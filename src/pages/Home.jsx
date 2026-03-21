import React, { useEffect, useMemo, useState } from 'react';
import ActionGoalCard from '../components/home/ActionGoalCard';
import PhotoConfirmModal from '../components/home/PhotoConfirmModal';

const STORAGE_KEY = 'root_home_goals_v13';
const CATEGORY_OPTIONS = ['운동', '공부', '정신', '일상'];

const XP_BY_CATEGORY = {
  운동: 12,
  공부: 10,
  정신: 8,
  일상: 6,
};

const WEEKDAY_OPTIONS = [
  { label: '월', value: 1 },
  { label: '화', value: 2 },
  { label: '수', value: 3 },
  { label: '목', value: 4 },
  { label: '금', value: 5 },
  { label: '토', value: 6 },
  { label: '일', value: 0 },
];

function pad(num) {
  return String(num).padStart(2, '0');
}

function getDateKey(date) {
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  return `${year}-${month}-${day}`;
}

function getTodayDateKey() {
  return getDateKey(new Date());
}

function parseDateKey(dateKey) {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function addDays(baseDate, amount) {
  const next = new Date(baseDate);
  next.setDate(next.getDate() + amount);
  return next;
}

function formatDateLabel(date) {
  return `${date.getMonth() + 1}월 ${date.getDate()}일`;
}

function formatFullDateLabel(dateKey) {
  const date = parseDateKey(dateKey);
  const todayKey = getTodayDateKey();
  const tomorrowKey = getDateKey(addDays(new Date(), 1));

  if (dateKey === todayKey) return `오늘 · ${formatDateLabel(date)}`;
  if (dateKey === tomorrowKey) return `내일 · ${formatDateLabel(date)}`;
  return formatDateLabel(date);
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('파일을 읽는 중 오류가 발생했습니다.'));
    reader.readAsDataURL(file);
  });
}

function getWeekStartDate(date) {
  const target = new Date(date);
  const day = target.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  target.setDate(target.getDate() + diff);
  target.setHours(0, 0, 0, 0);
  return target;
}

function makeRecordKey(goalId, dateKey) {
  return `${goalId}_${dateKey}`;
}

function getRepeatLabel(goal) {
  if (goal.repeatType === 'daily') return '매일';
  if (goal.repeatType === 'weeklyCount') return `주 ${goal.weeklyTarget || 3}회`;

  if (goal.repeatType === 'weekdays') {
    const labels = WEEKDAY_OPTIONS.filter((item) =>
      (goal.repeatDays || []).includes(item.value)
    ).map((item) => item.label);

    return labels.length ? `요일: ${labels.join(', ')}` : '특정 요일';
  }

  return '1회성';
}

function normalizeGoal(goal) {
  return {
    ...goal,
    endDateKey: goal.endDateKey || goal.startDateKey,
    repeatDays: goal.repeatDays || [],
    weeklyTarget: goal.weeklyTarget || 3,
  };
}

function isGoalActiveOnDate(goalInput, dateKey) {
  const goal = normalizeGoal(goalInput);

  const targetDate = parseDateKey(dateKey);
  const startDate = parseDateKey(goal.startDateKey);
  const endDate = parseDateKey(goal.endDateKey);

  targetDate.setHours(0, 0, 0, 0);
  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(0, 0, 0, 0);

  if (targetDate < startDate) return false;
  if (targetDate > endDate) return false;

  if (goal.repeatType === 'daily') return true;
  if (goal.repeatType === 'weeklyCount') return true;
  if (goal.repeatType === 'weekdays') {
    return (goal.repeatDays || []).includes(targetDate.getDay());
  }

  return goal.startDateKey === dateKey;
}

function countWeeklyDoneForGoal(goalId, dateKey, records) {
  const selectedDate = parseDateKey(dateKey);
  const weekStart = getWeekStartDate(selectedDate);
  let count = 0;

  for (let i = 0; i < 7; i += 1) {
    const current = addDays(weekStart, i);
    const currentKey = getDateKey(current);
    const record = records[makeRecordKey(goalId, currentKey)];
    if (record?.done) count += 1;
  }

  return count;
}

function getLevelFromXp(xp) {
  const level = Math.floor(xp / 100) + 1;
  const currentLevelStartXp = (level - 1) * 100;
  const nextLevelXp = level * 100;
  const progressXp = xp - currentLevelStartXp;
  const progressPercent = Math.min(
    100,
    Math.max(0, Math.round((progressXp / 100) * 100))
  );

  return {
    level,
    currentLevelStartXp,
    nextLevelXp,
    progressXp,
    progressPercent,
    remainXp: nextLevelXp - xp,
  };
}

function getDateKeysInRange(startKey, endKey) {
  if (!startKey || !endKey || endKey < startKey) return [];

  const result = [];
  let cursor = parseDateKey(startKey);
  const end = parseDateKey(endKey);

  cursor.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  while (getDateKey(cursor) <= getDateKey(end)) {
    result.push(getDateKey(cursor));
    cursor = addDays(cursor, 1);
  }

  return result;
}

function getWeekStartKeysInRange(startKey, endKey) {
  const dates = getDateKeysInRange(startKey, endKey);
  const set = new Set();

  dates.forEach((dateKey) => {
    const weekStart = getWeekStartDate(parseDateKey(dateKey));
    set.add(getDateKey(weekStart));
  });

  return Array.from(set);
}

function countRequiredInRange(goalInput, startKey, endKey) {
  const goal = normalizeGoal(goalInput);

  if (!startKey || !endKey || endKey < startKey) return 0;
  if (goal.repeatType === 'once') return 1;
  if (goal.repeatType === 'daily') return getDateKeysInRange(startKey, endKey).length;

  if (goal.repeatType === 'weekdays') {
    return getDateKeysInRange(startKey, endKey).filter((dateKey) => {
      const day = parseDateKey(dateKey).getDay();
      return (goal.repeatDays || []).includes(day);
    }).length;
  }

  if (goal.repeatType === 'weeklyCount') {
    const weekStartKeys = getWeekStartKeysInRange(startKey, endKey);
    return weekStartKeys.length * (goal.weeklyTarget || 3);
  }

  return 0;
}

function countDoneInRange(goalInput, startKey, endKey, records) {
  const goal = normalizeGoal(goalInput);

  if (!startKey || !endKey || endKey < startKey) return 0;

  if (goal.repeatType === 'once') {
    const keys = getDateKeysInRange(startKey, endKey);
    const found = keys.some((dateKey) => records[makeRecordKey(goal.id, dateKey)]?.done);
    return found ? 1 : 0;
  }

  if (goal.repeatType === 'daily' || goal.repeatType === 'weekdays') {
    return getDateKeysInRange(startKey, endKey).filter((dateKey) => {
      if (!isGoalActiveOnDate(goal, dateKey)) return false;
      return records[makeRecordKey(goal.id, dateKey)]?.done;
    }).length;
  }

  if (goal.repeatType === 'weeklyCount') {
    const weekStartKeys = getWeekStartKeysInRange(startKey, endKey);

    return weekStartKeys.reduce((sum, weekStartKey) => {
      let weeklyCount = 0;
      const weekStart = parseDateKey(weekStartKey);

      for (let i = 0; i < 7; i += 1) {
        const current = addDays(weekStart, i);
        const currentKey = getDateKey(current);

        if (currentKey < startKey || currentKey > endKey) continue;
        if (records[makeRecordKey(goal.id, currentKey)]?.done) weeklyCount += 1;
      }

      return sum + Math.min(weeklyCount, goal.weeklyTarget || 3);
    }, 0);
  }

  return 0;
}

function getGoalPeriodMeta(goalInput, records) {
  const goal = normalizeGoal(goalInput);
  const todayKey = getTodayDateKey();

  const progressEndKey = todayKey > goal.endDateKey ? goal.endDateKey : todayKey;

  const doneForProgress =
    progressEndKey < goal.startDateKey
      ? 0
      : countDoneInRange(goal, goal.startDateKey, progressEndKey, records);

  const requiredForProgress =
    progressEndKey < goal.startDateKey
      ? 0
      : countRequiredInRange(goal, goal.startDateKey, progressEndKey);

  const progressPercent =
    requiredForProgress === 0
      ? 0
      : Math.min(100, Math.round((doneForProgress / requiredForProgress) * 100));

  const totalDone = countDoneInRange(goal, goal.startDateKey, goal.endDateKey, records);
  const totalRequired = countRequiredInRange(goal, goal.startDateKey, goal.endDateKey);
  const finalPercent =
    totalRequired === 0
      ? 0
      : Math.min(100, Math.round((totalDone / totalRequired) * 100));

  if (todayKey < goal.startDateKey) {
    return {
      status: 'before',
      statusLabel: '시작 전',
      progressPercent: 0,
      progressText: '아직 시작 전',
      finalPercent,
      finalText: `${totalDone}/${totalRequired}`,
    };
  }

  if (todayKey > goal.endDateKey) {
    const success = finalPercent >= 100;

    return {
      status: success ? 'success' : 'fail',
      statusLabel: success ? '성공' : '실패',
      progressPercent: 100,
      progressText: `종료됨 · 최종 ${finalPercent}%`,
      finalPercent,
      finalText: `${totalDone}/${totalRequired}`,
    };
  }

  return {
    status: 'ongoing',
    statusLabel: '진행 중',
    progressPercent,
    progressText: `${doneForProgress}/${requiredForProgress}`,
    finalPercent,
    finalText: `${totalDone}/${totalRequired}`,
  };
}

function makeDefaultData() {
  const today = new Date();
  const tomorrow = addDays(today, 1);
  const dayAfterTomorrow = addDays(today, 2);
  const oneWeekLater = addDays(today, 6);
  const twoWeeksLater = addDays(today, 13);

  return {
    goals: [
      {
        id: 1,
        title: '물 2L 마시기',
        category: '일상',
        startDateKey: getDateKey(today),
        endDateKey: getDateKey(oneWeekLater),
        repeatType: 'daily',
        repeatDays: [],
        weeklyTarget: 3,
      },
      {
        id: 2,
        title: '30분 걷기',
        category: '운동',
        startDateKey: getDateKey(today),
        endDateKey: getDateKey(twoWeeksLater),
        repeatType: 'weeklyCount',
        repeatDays: [],
        weeklyTarget: 3,
      },
      {
        id: 3,
        title: '영어 단어 20개 외우기',
        category: '공부',
        startDateKey: getDateKey(today),
        endDateKey: getDateKey(today),
        repeatType: 'once',
        repeatDays: [],
        weeklyTarget: 3,
      },
      {
        id: 4,
        title: '명상 10분',
        category: '정신',
        startDateKey: getDateKey(today),
        endDateKey: getDateKey(oneWeekLater),
        repeatType: 'weekdays',
        repeatDays: [1, 3, 5],
        weeklyTarget: 3,
      },
      {
        id: 5,
        title: '팔굽혀펴기 20회',
        category: '운동',
        startDateKey: getDateKey(tomorrow),
        endDateKey: getDateKey(tomorrow),
        repeatType: 'once',
        repeatDays: [],
        weeklyTarget: 3,
      },
      {
        id: 6,
        title: '책 30분 읽기',
        category: '공부',
        startDateKey: getDateKey(dayAfterTomorrow),
        endDateKey: getDateKey(addDays(dayAfterTomorrow, 6)),
        repeatType: 'daily',
        repeatDays: [],
        weeklyTarget: 3,
      },
    ],
    records: {},
  };
}

function getSavedData() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) return makeDefaultData();

    const parsed = JSON.parse(saved);

    if (!parsed || !Array.isArray(parsed.goals) || typeof parsed.records !== 'object') {
      return makeDefaultData();
    }

    return {
      goals: parsed.goals.map((goal) => normalizeGoal(goal)),
      records: parsed.records,
    };
  } catch (error) {
    console.error('localStorage 불러오기 실패:', error);
    return makeDefaultData();
  }
}

export default function Home() {
  const todayKey = getTodayDateKey();
  const initialData = getSavedData();

  const [goals, setGoals] = useState(initialData.goals);
  const [records, setRecords] = useState(initialData.records);
  const [activeCategory, setActiveCategory] = useState('운동');

  const [selectedDateKey, setSelectedDateKey] = useState(todayKey);
  const [calendarOpen, setCalendarOpen] = useState(false);

  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState(null);

  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalDateKey, setNewGoalDateKey] = useState(todayKey);
  const [newGoalEndDateKey, setNewGoalEndDateKey] = useState(todayKey);
  const [newRepeatType, setNewRepeatType] = useState('once');
  const [newWeeklyTarget, setNewWeeklyTarget] = useState(3);
  const [newRepeatDays, setNewRepeatDays] = useState([]);

  const [editingGoalId, setEditingGoalId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState('운동');
  const [editDateKey, setEditDateKey] = useState(todayKey);
  const [editEndDateKey, setEditEndDateKey] = useState(todayKey);
  const [editRepeatType, setEditRepeatType] = useState('once');
  const [editWeeklyTarget, setEditWeeklyTarget] = useState(3);
  const [editRepeatDays, setEditRepeatDays] = useState([]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ goals, records }));
      window.dispatchEvent(new Event('root-home-data-updated'));
    } catch (error) {
      console.error('localStorage 저장 실패:', error);
    }
  }, [goals, records]);

  useEffect(() => {
    if (newGoalDateKey < todayKey) setNewGoalDateKey(todayKey);
  }, [newGoalDateKey, todayKey]);

  useEffect(() => {
    if (newGoalEndDateKey < newGoalDateKey) setNewGoalEndDateKey(newGoalDateKey);
  }, [newGoalDateKey, newGoalEndDateKey]);

  useEffect(() => {
    if (editEndDateKey < editDateKey) setEditEndDateKey(editDateKey);
  }, [editDateKey, editEndDateKey]);

  useEffect(() => {
    setEditingGoalId(null);
    setNewGoalTitle('');
    setNewGoalDateKey(todayKey);
    setNewGoalEndDateKey(todayKey);
    setNewRepeatType('once');
    setNewWeeklyTarget(3);
    setNewRepeatDays([]);
  }, [activeCategory, todayKey]);

  const xpSummary = useMemo(() => {
    const result = {
      운동: 0,
      공부: 0,
      정신: 0,
      일상: 0,
      total: 0,
    };

    Object.entries(records).forEach(([recordKey, record]) => {
      if (!record?.done) return;

      const goalId = Number(String(recordKey).split('_')[0]);
      const goal = goals.find((item) => item.id === goalId);
      if (!goal) return;

      const earnedXp = XP_BY_CATEGORY[goal.category] || 0;
      result[goal.category] += earnedXp;
      result.total += earnedXp;
    });

    return result;
  }, [goals, records]);

  const levelSummary = useMemo(() => {
    return {
      운동: getLevelFromXp(xpSummary.운동),
      공부: getLevelFromXp(xpSummary.공부),
      정신: getLevelFromXp(xpSummary.정신),
      일상: getLevelFromXp(xpSummary.일상),
      total: getLevelFromXp(xpSummary.total),
    };
  }, [xpSummary]);

  const availableDateKeys = useMemo(() => {
    const keys = new Set([todayKey]);

    goals.forEach((goalInput) => {
      const goal = normalizeGoal(goalInput);
      if (goal.category !== activeCategory) return;

      const startKey = goal.startDateKey < todayKey ? todayKey : goal.startDateKey;
      const endKey = goal.endDateKey;
      if (endKey < todayKey) return;

      getDateKeysInRange(startKey, endKey).forEach((dateKey) => {
        if (isGoalActiveOnDate(goal, dateKey)) {
          keys.add(dateKey);
        }
      });
    });

    return Array.from(keys).sort((a, b) => a.localeCompare(b));
  }, [goals, activeCategory, todayKey]);

  useEffect(() => {
    if (!availableDateKeys.includes(selectedDateKey)) {
      setSelectedDateKey(availableDateKeys[0] || todayKey);
    }
  }, [availableDateKeys, selectedDateKey, todayKey]);

  const filteredGoals = useMemo(() => {
    return goals
      .map((goal) => normalizeGoal(goal))
      .filter((goal) => goal.category === activeCategory)
      .filter((goal) => isGoalActiveOnDate(goal, selectedDateKey))
      .map((goal) => {
        const record = records[makeRecordKey(goal.id, selectedDateKey)];
        const periodMeta = getGoalPeriodMeta(goal, records);

        return {
          ...goal,
          done: record?.done || false,
          photo: record?.photo || null,
          periodMeta,
        };
      });
  }, [goals, records, selectedDateKey, activeCategory]);

  const endedGoals = useMemo(() => {
    return goals
      .map((goal) => {
        const normalized = normalizeGoal(goal);
        return {
          ...normalized,
          periodMeta: getGoalPeriodMeta(normalized, records),
        };
      })
      .filter((goal) => goal.category === activeCategory)
      .filter(
        (goal) => goal.periodMeta.status === 'success' || goal.periodMeta.status === 'fail'
      )
      .sort((a, b) => (b.endDateKey || '').localeCompare(a.endDateKey || ''));
  }, [goals, records, activeCategory]);

  const selectedGoal = useMemo(() => {
    return filteredGoals.find((goal) => goal.id === selectedGoalId) || null;
  }, [filteredGoals, selectedGoalId]);

  const selectedMonth = useMemo(() => {
    const date = parseDateKey(selectedDateKey);
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }, [selectedDateKey]);

  const [calendarMonth, setCalendarMonth] = useState(selectedMonth);

  useEffect(() => {
    setCalendarMonth(selectedMonth);
  }, [selectedMonth]);

  const calendarCells = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();

    const firstDay = new Date(year, month, 1);
    const firstWeekday = firstDay.getDay();
    const offset = firstWeekday === 0 ? 6 : firstWeekday - 1;

    const gridStart = addDays(firstDay, -offset);
    const cells = [];

    for (let i = 0; i < 42; i += 1) {
      const date = addDays(gridStart, i);
      cells.push({
        key: getDateKey(date),
        date,
        isCurrentMonth: date.getMonth() === month,
      });
    }

    return cells;
  }, [calendarMonth]);

  const activeDateSet = useMemo(() => new Set(availableDateKeys), [availableDateKeys]);

  const handleGoalClick = (goal) => {
    if (goal.periodMeta.status !== 'ongoing') return;

    if (goal.repeatType === 'weeklyCount' && !goal.done) {
      const weeklyDoneCount = countWeeklyDoneForGoal(goal.id, selectedDateKey, records);
      if (weeklyDoneCount >= goal.weeklyTarget) {
        alert(`이 목표는 이번 주 ${goal.weeklyTarget}회를 이미 완료했어요.`);
        return;
      }
    }

    setSelectedGoalId(goal.id);
    setPhotoModalOpen(true);
  };

  const handleClosePhotoModal = () => {
    setPhotoModalOpen(false);
    setSelectedGoalId(null);
  };

  const handleConfirmPhoto = async (file) => {
    try {
      const goal = goals.find((item) => item.id === selectedGoalId);
      if (!goal) {
        handleClosePhotoModal();
        return;
      }

      const normalizedGoal = normalizeGoal(goal);
      const periodMeta = getGoalPeriodMeta(normalizedGoal, records);

      if (periodMeta.status !== 'ongoing') {
        alert('이 목표는 현재 기록할 수 없는 상태예요.');
        handleClosePhotoModal();
        return;
      }

      const currentRecord = records[makeRecordKey(selectedGoalId, selectedDateKey)];

      if (normalizedGoal.repeatType === 'weeklyCount' && !currentRecord?.done) {
        const weeklyDoneCount = countWeeklyDoneForGoal(
          normalizedGoal.id,
          selectedDateKey,
          records
        );

        if (weeklyDoneCount >= normalizedGoal.weeklyTarget) {
          alert(`이 목표는 이번 주 ${normalizedGoal.weeklyTarget}회를 이미 완료했어요.`);
          handleClosePhotoModal();
          return;
        }
      }

      let photoData = null;
      if (file) photoData = await fileToBase64(file);

      const recordKey = makeRecordKey(selectedGoalId, selectedDateKey);

      setRecords((prev) => ({
        ...prev,
        [recordKey]: {
          done: true,
          photo: photoData || prev[recordKey]?.photo || null,
        },
      }));

      handleClosePhotoModal();
    } catch (error) {
      console.error(error);
      alert('사진을 저장하는 중 문제가 발생했어요.');
    }
  };

  const handleToggleDone = (goalId) => {
    const goal = goals.find((item) => item.id === goalId);
    if (!goal) return;

    const normalizedGoal = normalizeGoal(goal);
    const periodMeta = getGoalPeriodMeta(normalizedGoal, records);

    if (periodMeta.status !== 'ongoing') {
      alert('이 목표는 현재 체크할 수 없는 상태예요.');
      return;
    }

    const recordKey = makeRecordKey(goalId, selectedDateKey);
    const currentRecord = records[recordKey];
    const nextDone = !currentRecord?.done;

    if (normalizedGoal.repeatType === 'weeklyCount' && nextDone) {
      const weeklyDoneCount = countWeeklyDoneForGoal(goalId, selectedDateKey, records);
      if (weeklyDoneCount >= normalizedGoal.weeklyTarget) {
        alert(`이 목표는 이번 주 ${normalizedGoal.weeklyTarget}회를 이미 완료했어요.`);
        return;
      }
    }

    setRecords((prev) => ({
      ...prev,
      [recordKey]: {
        done: nextDone,
        photo: prev[recordKey]?.photo || null,
      },
    }));
  };

  const toggleNewRepeatDay = (dayValue) => {
    setNewRepeatDays((prev) =>
      prev.includes(dayValue)
        ? prev.filter((item) => item !== dayValue)
        : [...prev, dayValue]
    );
  };

  const toggleEditRepeatDay = (dayValue) => {
    setEditRepeatDays((prev) =>
      prev.includes(dayValue)
        ? prev.filter((item) => item !== dayValue)
        : [...prev, dayValue]
    );
  };

  const handleAddGoal = () => {
    const trimmedTitle = newGoalTitle.trim();

    if (!trimmedTitle) {
      alert('행동목표 이름을 입력해주세요.');
      return;
    }

    if (!newGoalDateKey) {
      alert('시작일을 선택해주세요.');
      return;
    }

    if (!newGoalEndDateKey) {
      alert('종료일을 선택해주세요.');
      return;
    }

    if (newGoalDateKey < todayKey) {
      alert('오늘 이전 날짜는 선택할 수 없어요.');
      return;
    }

    if (newGoalEndDateKey < newGoalDateKey) {
      alert('종료일은 시작일보다 빠를 수 없어요.');
      return;
    }

    if (newRepeatType === 'weekdays' && newRepeatDays.length === 0) {
      alert('특정 요일을 하나 이상 선택해주세요.');
      return;
    }

    const newGoal = {
      id: Date.now(),
      title: trimmedTitle,
      category: activeCategory,
      startDateKey: newGoalDateKey,
      endDateKey: newGoalEndDateKey,
      repeatType: newRepeatType,
      repeatDays: newRepeatType === 'weekdays' ? newRepeatDays : [],
      weeklyTarget: newRepeatType === 'weeklyCount' ? Number(newWeeklyTarget) : 3,
    };

    setGoals((prevGoals) => [newGoal, ...prevGoals]);
    setNewGoalTitle('');
    setNewGoalDateKey(todayKey);
    setNewGoalEndDateKey(todayKey);
    setNewRepeatType('once');
    setNewWeeklyTarget(3);
    setNewRepeatDays([]);
    setSelectedDateKey(newGoal.startDateKey);
  };

  const handleDeleteGoal = (goalId) => {
    const ok = window.confirm('이 행동목표를 삭제할까요?');
    if (!ok) return;

    setGoals((prevGoals) => prevGoals.filter((goal) => goal.id !== goalId));

    setRecords((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((key) => {
        if (String(key).startsWith(`${goalId}_`)) delete next[key];
      });
      return next;
    });

    if (editingGoalId === goalId) {
      handleCancelEdit();
    }
  };

  const handleStartEdit = (goalInput) => {
    const goal = normalizeGoal(goalInput);
    setEditingGoalId(goal.id);
    setEditTitle(goal.title);
    setEditCategory(goal.category);
    setEditDateKey(goal.startDateKey);
    setEditEndDateKey(goal.endDateKey);
    setEditRepeatType(goal.repeatType);
    setEditWeeklyTarget(goal.weeklyTarget || 3);
    setEditRepeatDays(goal.repeatDays || []);
  };

  const handleCancelEdit = () => {
    setEditingGoalId(null);
    setEditTitle('');
    setEditCategory(activeCategory);
    setEditDateKey(todayKey);
    setEditEndDateKey(todayKey);
    setEditRepeatType('once');
    setEditWeeklyTarget(3);
    setEditRepeatDays([]);
  };

  const handleSaveEdit = () => {
    const trimmedTitle = editTitle.trim();

    if (!trimmedTitle) {
      alert('행동목표 이름을 입력해주세요.');
      return;
    }

    if (!editDateKey) {
      alert('시작일을 선택해주세요.');
      return;
    }

    if (!editEndDateKey) {
      alert('종료일을 선택해주세요.');
      return;
    }

    if (editDateKey < todayKey) {
      alert('오늘 이전 날짜는 선택할 수 없어요.');
      return;
    }

    if (editEndDateKey < editDateKey) {
      alert('종료일은 시작일보다 빠를 수 없어요.');
      return;
    }

    if (editRepeatType === 'weekdays' && editRepeatDays.length === 0) {
      alert('특정 요일을 하나 이상 선택해주세요.');
      return;
    }

    setGoals((prevGoals) =>
      prevGoals.map((goal) =>
        goal.id === editingGoalId
          ? {
              ...goal,
              title: trimmedTitle,
              category: editCategory,
              startDateKey: editDateKey,
              endDateKey: editEndDateKey,
              repeatType: editRepeatType,
              repeatDays: editRepeatType === 'weekdays' ? editRepeatDays : [],
              weeklyTarget:
                editRepeatType === 'weeklyCount' ? Number(editWeeklyTarget) : 3,
            }
          : goal
      )
    );

    setSelectedDateKey(editDateKey);
    handleCancelEdit();
  };

  const handleResetAllGoals = () => {
    const ok = window.confirm('전체 목표 데이터를 처음 상태로 되돌릴까요?');
    if (!ok) return;

    const defaults = makeDefaultData();
    setGoals(defaults.goals);
    setRecords(defaults.records);
    setSelectedDateKey(todayKey);
    setActiveCategory('운동');

    setNewGoalTitle('');
    setNewGoalDateKey(todayKey);
    setNewGoalEndDateKey(todayKey);
    setNewRepeatType('once');
    setNewWeeklyTarget(3);
    setNewRepeatDays([]);

    handleCancelEdit();
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new Event('root-home-data-updated'));
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.stickyTopWrap}>
          <div style={styles.categoryTabs}>
            {CATEGORY_OPTIONS.map((category) => {
              const active = activeCategory === category;
              const categoryLevel = levelSummary[category];
              const categoryXp = xpSummary[category];

              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => setActiveCategory(category)}
                  style={{
                    ...styles.categoryTabButton,
                    ...(active ? styles.categoryTabButtonActive : {}),
                  }}
                >
                  <div
                    style={{
                      ...styles.categoryMainLabel,
                      ...(active ? styles.categoryMainLabelActive : {}),
                    }}
                  >
                    {category}
                  </div>

                  <div
                    style={{
                      ...styles.categoryMetaRow,
                      ...(active ? styles.categoryMetaRowActive : {}),
                    }}
                  >
                    <span>Lv.{categoryLevel.level}</span>
                    <span>{categoryXp}XP</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div style={styles.section}>
          <button
            type="button"
            onClick={() => setCalendarOpen(true)}
            style={styles.datePickerButton}
          >
            <span>{formatFullDateLabel(selectedDateKey)}</span>
            <span style={styles.datePickerIcon}>📅</span>
          </button>
        </div>

        <div style={styles.sectionHeader}>
          <div>
            <h2 style={styles.sectionTitle}>{activeCategory} 목표 리스트</h2>
            <div style={styles.sectionSubText}>
              {formatFullDateLabel(selectedDateKey)}
            </div>
          </div>

          <div style={styles.sectionRight}>
            <button
              type="button"
              onClick={handleResetAllGoals}
              style={styles.resetButton}
            >
              전체 초기화
            </button>
          </div>
        </div>

        <div style={styles.goalList}>
          {filteredGoals.length === 0 ? (
            <div style={styles.emptyCard}>
              <div style={styles.emptyEmoji}>🗂️</div>
              <div style={styles.emptyTitle}>{activeCategory} 목표가 아직 없어요</div>
              <div style={styles.emptyText}>
                아래에서 {activeCategory} 행동목표를 추가해보세요.
              </div>
            </div>
          ) : (
            filteredGoals.map((goal) => {
              const selectedDate = parseDateKey(selectedDateKey);
              const weekStart = getWeekStartDate(selectedDate);

              let weeklyDoneCount = 0;
              if (goal.repeatType === 'weeklyCount') {
                for (let i = 0; i < 7; i += 1) {
                  const current = addDays(weekStart, i);
                  const currentKey = getDateKey(current);
                  const record = records[makeRecordKey(goal.id, currentKey)];
                  if (record?.done) weeklyDoneCount += 1;
                }
              }

              const gainedXp = goal.done ? XP_BY_CATEGORY[goal.category] || 0 : 0;

              return (
                <div key={goal.id} style={styles.goalBlock}>
                  <div style={styles.repeatInfoRow}>
                    <div style={styles.repeatBadge}>{getRepeatLabel(goal)}</div>

                    <div style={styles.periodBadge}>
                      기간 {goal.startDateKey} ~ {goal.endDateKey}
                    </div>

                    <div
                      style={{
                        ...styles.statusBadge,
                        ...(goal.periodMeta.status === 'success'
                          ? styles.statusBadgeSuccess
                          : goal.periodMeta.status === 'fail'
                          ? styles.statusBadgeFail
                          : goal.periodMeta.status === 'before'
                          ? styles.statusBadgeBefore
                          : styles.statusBadgeOngoing),
                      }}
                    >
                      {goal.periodMeta.statusLabel}
                    </div>

                    {goal.repeatType === 'weeklyCount' && (
                      <div style={styles.repeatSubInfo}>
                        {weeklyDoneCount >= goal.weeklyTarget
                          ? `이번 주 목표 달성 완료 (${weeklyDoneCount}/${goal.weeklyTarget})`
                          : `이번 주 ${weeklyDoneCount}/${goal.weeklyTarget}회`}
                      </div>
                    )}

                    {goal.done && (
                      <div style={styles.xpEarnedBadge}>+{gainedXp} XP</div>
                    )}
                  </div>

                  <div style={styles.progressInfoBox}>
                    <div style={styles.progressInfoTop}>
                      <span>기간 진행률</span>
                      <strong>{goal.periodMeta.progressPercent}%</strong>
                    </div>

                    <div style={styles.smallLevelBarBackground}>
                      <div
                        style={{
                          ...styles.smallLevelBarFill,
                          width: `${goal.periodMeta.progressPercent}%`,
                        }}
                      />
                    </div>

                    <div style={styles.progressInfoText}>
                      진행 계산: {goal.periodMeta.progressText}
                    </div>
                    <div style={styles.progressInfoText}>
                      최종 판정 기준: {goal.periodMeta.finalText}
                    </div>
                  </div>

                  <div style={styles.goalRow}>
                    <div style={styles.goalItem}>
                      <ActionGoalCard
                        title={goal.title}
                        category={goal.category}
                        done={goal.done}
                        photo={goal.photo}
                        onClick={() => handleGoalClick(goal)}
                        onToggleDone={() => handleToggleDone(goal.id)}
                      />
                    </div>

                    <div style={styles.sideButtons}>
                      <button
                        type="button"
                        onClick={() => handleStartEdit(goal)}
                        style={styles.editButton}
                      >
                        수정
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteGoal(goal.id)}
                        style={styles.deleteButton}
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {endedGoals.length > 0 && (
          <>
            <div style={styles.sectionHeader}>
              <div>
                <h2 style={styles.sectionTitle}>{activeCategory} 종료된 목표 판정</h2>
                <div style={styles.sectionSubText}>
                  기간이 끝난 목표의 성공 / 실패 결과예요
                </div>
              </div>
            </div>

            <div style={styles.goalList}>
              {endedGoals.map((goal) => (
                <div key={`ended-${goal.id}`} style={styles.endedGoalCard}>
                  <div style={styles.endedGoalTop}>
                    <div>
                      <div style={styles.endedGoalTitle}>{goal.title}</div>
                      <div style={styles.endedGoalSub}>
                        {goal.category} · {goal.startDateKey} ~ {goal.endDateKey}
                      </div>
                    </div>

                    <div
                      style={{
                        ...styles.statusBadge,
                        ...(goal.periodMeta.status === 'success'
                          ? styles.statusBadgeSuccess
                          : styles.statusBadgeFail),
                      }}
                    >
                      {goal.periodMeta.statusLabel}
                    </div>
                  </div>

                  <div style={styles.progressInfoText}>
                    최종 달성률: {goal.periodMeta.finalPercent}% ({goal.periodMeta.finalText})
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <div style={styles.section}>
          <div style={styles.addCard}>
            <div style={styles.addCardTitle}>새 행동목표 추가 · {activeCategory}</div>

            <input
              type="text"
              value={newGoalTitle}
              onChange={(e) => setNewGoalTitle(e.target.value)}
              placeholder={`${activeCategory} 행동목표를 입력하세요`}
              style={styles.input}
            />

            <div style={styles.formRow}>
              <input
                type="date"
                value={newGoalDateKey}
                min={todayKey}
                onChange={(e) => setNewGoalDateKey(e.target.value)}
                style={styles.input}
              />

              <input
                type="date"
                value={newGoalEndDateKey}
                min={newGoalDateKey}
                onChange={(e) => setNewGoalEndDateKey(e.target.value)}
                style={styles.input}
              />
            </div>

            <div style={styles.formRowSingle}>
              <select
                value={newRepeatType}
                onChange={(e) => setNewRepeatType(e.target.value)}
                style={styles.select}
              >
                <option value="once">1회성 목표</option>
                <option value="daily">매일</option>
                <option value="weeklyCount">주 n회</option>
                <option value="weekdays">특정 요일</option>
              </select>
            </div>

            {newRepeatType === 'weeklyCount' && (
              <div style={styles.formRowSingle}>
                <select
                  value={newWeeklyTarget}
                  onChange={(e) => setNewWeeklyTarget(Number(e.target.value))}
                  style={styles.select}
                >
                  <option value={1}>주 1회</option>
                  <option value={2}>주 2회</option>
                  <option value={3}>주 3회</option>
                  <option value={4}>주 4회</option>
                  <option value={5}>주 5회</option>
                  <option value={6}>주 6회</option>
                  <option value={7}>주 7회</option>
                </select>
              </div>
            )}

            {newRepeatType === 'weekdays' && (
              <div style={styles.dayButtonWrap}>
                {WEEKDAY_OPTIONS.map((day) => {
                  const active = newRepeatDays.includes(day.value);

                  return (
                    <button
                      key={day.value}
                      type="button"
                      onClick={() => toggleNewRepeatDay(day.value)}
                      style={{
                        ...styles.dayButton,
                        ...(active ? styles.dayButtonActive : {}),
                      }}
                    >
                      {day.label}
                    </button>
                  );
                })}
              </div>
            )}

            <button type="button" onClick={handleAddGoal} style={styles.addButton}>
              행동목표 추가
            </button>
          </div>
        </div>
      </div>

      {calendarOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.calendarModalCard}>
            <div style={styles.calendarHeader}>
              <button
                type="button"
                onClick={() =>
                  setCalendarMonth(
                    new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1)
                  )
                }
                style={styles.calendarNavButton}
              >
                ‹
              </button>

              <div style={styles.calendarTitle}>
                {calendarMonth.getFullYear()}년 {calendarMonth.getMonth() + 1}월
              </div>

              <button
                type="button"
                onClick={() =>
                  setCalendarMonth(
                    new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1)
                  )
                }
                style={styles.calendarNavButton}
              >
                ›
              </button>
            </div>

            <div style={styles.calendarWeekHeader}>
              {['월', '화', '수', '목', '금', '토', '일'].map((day) => (
                <div key={day} style={styles.calendarWeekText}>
                  {day}
                </div>
              ))}
            </div>

            <div style={styles.calendarGrid}>
              {calendarCells.map((cell) => {
                const isSelected = cell.key === selectedDateKey;
                const isToday = cell.key === todayKey;
                const isDisabled = cell.key < todayKey;
                const isAvailable = activeDateSet.has(cell.key);

                return (
                  <button
                    key={cell.key}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => {
                      setSelectedDateKey(cell.key);
                      setCalendarOpen(false);
                    }}
                    style={{
                      ...styles.calendarDateCell,
                      ...(cell.isCurrentMonth ? {} : styles.calendarDateCellDim),
                      ...(isSelected ? styles.calendarDateCellSelected : {}),
                      ...(isToday ? styles.calendarDateCellToday : {}),
                      ...(isDisabled ? styles.calendarDateCellDisabled : {}),
                    }}
                  >
                    <span style={styles.calendarDateNumber}>{cell.date.getDate()}</span>
                    {isAvailable && !isDisabled && <span style={styles.calendarDot} />}
                  </button>
                );
              })}
            </div>

            <div style={styles.modalButtonRow}>
              <button
                type="button"
                onClick={() => setCalendarOpen(false)}
                style={styles.modalCancelButton}
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {editingGoalId !== null && (
        <div style={styles.modalOverlay}>
          <div style={styles.editModalCard}>
            <div style={styles.editModalTitle}>행동목표 수정</div>

            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder="행동목표 이름"
              style={styles.input}
            />

            <div style={styles.modalSpacing}>
              <select
                value={editCategory}
                onChange={(e) => setEditCategory(e.target.value)}
                style={styles.select}
              >
                {CATEGORY_OPTIONS.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.modalDateRow}>
              <input
                type="date"
                value={editDateKey}
                min={todayKey}
                onChange={(e) => setEditDateKey(e.target.value)}
                style={styles.input}
              />
              <input
                type="date"
                value={editEndDateKey}
                min={editDateKey}
                onChange={(e) => setEditEndDateKey(e.target.value)}
                style={styles.input}
              />
            </div>

            <div style={styles.modalSpacing}>
              <select
                value={editRepeatType}
                onChange={(e) => setEditRepeatType(e.target.value)}
                style={styles.select}
              >
                <option value="once">1회성 목표</option>
                <option value="daily">매일</option>
                <option value="weeklyCount">주 n회</option>
                <option value="weekdays">특정 요일</option>
              </select>
            </div>

            {editRepeatType === 'weeklyCount' && (
              <div style={styles.modalSpacing}>
                <select
                  value={editWeeklyTarget}
                  onChange={(e) => setEditWeeklyTarget(Number(e.target.value))}
                  style={styles.select}
                >
                  <option value={1}>주 1회</option>
                  <option value={2}>주 2회</option>
                  <option value={3}>주 3회</option>
                  <option value={4}>주 4회</option>
                  <option value={5}>주 5회</option>
                  <option value={6}>주 6회</option>
                  <option value={7}>주 7회</option>
                </select>
              </div>
            )}

            {editRepeatType === 'weekdays' && (
              <div style={styles.modalDayWrap}>
                {WEEKDAY_OPTIONS.map((day) => {
                  const active = editRepeatDays.includes(day.value);

                  return (
                    <button
                      key={day.value}
                      type="button"
                      onClick={() => toggleEditRepeatDay(day.value)}
                      style={{
                        ...styles.modalDayButton,
                        ...(active ? styles.modalDayButtonActive : {}),
                      }}
                    >
                      {day.label}
                    </button>
                  );
                })}
              </div>
            )}

            <div style={styles.modalButtonRow}>
              <button
                type="button"
                onClick={handleCancelEdit}
                style={styles.modalCancelButton}
              >
                취소
              </button>

              <button
                type="button"
                onClick={handleSaveEdit}
                style={styles.modalSaveButton}
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}

      <PhotoConfirmModal
        isOpen={photoModalOpen}
        onClose={handleClosePhotoModal}
        onConfirm={handleConfirmPhoto}
        title={
          selectedGoal
            ? `"${selectedGoal.title}" 기록을 완료할까요?`
            : '기록을 완료할까요?'
        }
        description="사진을 남기거나, 사진 없이 바로 완료할 수 있어요."
      />
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100%',
    background: 'linear-gradient(180deg, #140f1d 0%, #1b1430 45%, #221938 100%)',
    paddingBottom: '120px',
  },
  container: {
    width: '100%',
    maxWidth: '720px',
    margin: '0 auto',
    padding: '12px 16px 32px',
    boxSizing: 'border-box',
  },
  section: {
    marginTop: '16px',
  },
  stickyTopWrap: {
    position: 'sticky',
    top: 0,
    zIndex: 1000,
    paddingTop: '6px',
    paddingBottom: '8px',
    background: 'linear-gradient(180deg, rgba(20,15,29,0.96) 0%, rgba(27,20,48,0.96) 100%)',
    backdropFilter: 'blur(12px)',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
  },
  categoryTabs: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '8px',
    marginTop: '0px',
  },
  categoryTabButton: {
    minHeight: '48px',
    borderRadius: '14px',
    border: '1px solid rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    color: '#cbd5e1',
    padding: '6px 4px',
    cursor: 'pointer',
  },
  categoryTabButtonActive: {
    background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
    color: '#ffffff',
    border: 'none',
    boxShadow: '0 6px 14px rgba(139,92,246,0.22)',
  },
  categoryMainLabel: {
    fontSize: '13px',
    fontWeight: 800,
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: 1.2,
  },
  categoryMainLabelActive: {
    color: '#ffffff',
  },
  categoryMetaRow: {
    marginTop: '5px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '5px',
    flexWrap: 'wrap',
    fontSize: '10px',
    fontWeight: 700,
    color: '#d8b4fe',
    lineHeight: 1.2,
  },
  categoryMetaRowActive: {
    color: '#ffffff',
  },
  datePickerButton: {
    width: '100%',
    minHeight: '48px',
    borderRadius: '16px',
    border: '1px solid rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    color: '#ffffff',
    padding: '0 16px',
    boxSizing: 'border-box',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    fontSize: '15px',
    fontWeight: 800,
    cursor: 'pointer',
  },
  datePickerIcon: {
    fontSize: '18px',
  },
  sectionHeader: {
    marginTop: '24px',
    marginBottom: '14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    flexWrap: 'wrap',
  },
  sectionTitle: {
    margin: 0,
    color: '#ffffff',
    fontSize: '20px',
    fontWeight: 700,
  },
  sectionSubText: {
    marginTop: '6px',
    color: '#cbd5e1',
    fontSize: '13px',
    fontWeight: 600,
  },
  sectionRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexWrap: 'wrap',
  },
  resetButton: {
    height: '34px',
    padding: '0 12px',
    borderRadius: '999px',
    border: '1px solid rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.06)',
    color: '#ffffff',
    fontSize: '13px',
    fontWeight: 700,
    cursor: 'pointer',
  },
  goalList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  goalBlock: {
    width: '100%',
  },
  repeatInfoRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap',
    marginBottom: '8px',
  },
  repeatBadge: {
    padding: '6px 10px',
    borderRadius: '999px',
    backgroundColor: 'rgba(255,255,255,0.06)',
    color: '#f5d0fe',
    fontSize: '12px',
    fontWeight: 700,
  },
  periodBadge: {
    padding: '6px 10px',
    borderRadius: '999px',
    backgroundColor: 'rgba(255,255,255,0.06)',
    color: '#cbd5e1',
    fontSize: '12px',
    fontWeight: 700,
  },
  statusBadge: {
    padding: '6px 10px',
    borderRadius: '999px',
    fontSize: '12px',
    fontWeight: 800,
  },
  statusBadgeOngoing: {
    backgroundColor: 'rgba(59,130,246,0.18)',
    color: '#93c5fd',
  },
  statusBadgeBefore: {
    backgroundColor: 'rgba(148,163,184,0.18)',
    color: '#cbd5e1',
  },
  statusBadgeSuccess: {
    backgroundColor: 'rgba(16,185,129,0.18)',
    color: '#86efac',
  },
  statusBadgeFail: {
    backgroundColor: 'rgba(239,68,68,0.18)',
    color: '#fca5a5',
  },
  repeatSubInfo: {
    color: '#cbd5e1',
    fontSize: '12px',
    fontWeight: 600,
  },
  xpEarnedBadge: {
    padding: '6px 10px',
    borderRadius: '999px',
    backgroundColor: 'rgba(16,185,129,0.14)',
    color: '#86efac',
    fontSize: '12px',
    fontWeight: 800,
  },
  progressInfoBox: {
    marginBottom: '10px',
    borderRadius: '16px',
    padding: '12px',
    backgroundColor: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.06)',
  },
  progressInfoTop: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '8px',
    color: '#ffffff',
    fontSize: '13px',
    fontWeight: 700,
    marginBottom: '8px',
  },
  progressInfoText: {
    marginTop: '8px',
    color: '#cbd5e1',
    fontSize: '12px',
    lineHeight: 1.5,
  },
  smallLevelBarBackground: {
    width: '100%',
    height: '8px',
    borderRadius: '999px',
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  smallLevelBarFill: {
    height: '100%',
    borderRadius: '999px',
    background: 'linear-gradient(90deg, #8b5cf6 0%, #ec4899 100%)',
  },
  goalRow: {
    display: 'grid',
    gridTemplateColumns: '1fr auto',
    gap: '10px',
    alignItems: 'stretch',
  },
  goalItem: {
    width: '100%',
  },
  sideButtons: {
    display: 'grid',
    gridTemplateRows: '1fr 1fr',
    gap: '8px',
  },
  editButton: {
    minWidth: '64px',
    border: '1px solid rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.06)',
    color: '#c4b5fd',
    borderRadius: '16px',
    padding: '0 12px',
    fontSize: '13px',
    fontWeight: 700,
    cursor: 'pointer',
  },
  deleteButton: {
    minWidth: '64px',
    border: '1px solid rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.06)',
    color: '#fca5a5',
    borderRadius: '16px',
    padding: '0 12px',
    fontSize: '13px',
    fontWeight: 700,
    cursor: 'pointer',
  },
  emptyCard: {
    border: '1px dashed rgba(255,255,255,0.16)',
    borderRadius: '20px',
    padding: '30px 16px',
    textAlign: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  emptyEmoji: {
    fontSize: '30px',
    marginBottom: '10px',
  },
  emptyTitle: {
    color: '#ffffff',
    fontSize: '16px',
    fontWeight: 700,
  },
  emptyText: {
    marginTop: '8px',
    color: '#cbd5e1',
    fontSize: '13px',
    lineHeight: 1.5,
  },
  endedGoalCard: {
    borderRadius: '20px',
    padding: '16px',
    backgroundColor: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
  },
  endedGoalTop: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '12px',
    marginBottom: '8px',
  },
  endedGoalTitle: {
    color: '#ffffff',
    fontSize: '16px',
    fontWeight: 800,
  },
  endedGoalSub: {
    marginTop: '6px',
    color: '#cbd5e1',
    fontSize: '12px',
    fontWeight: 600,
  },
  addCard: {
    background: 'linear-gradient(180deg, #261b3a 0%, #1f1730 100%)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '22px',
    padding: '18px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
  },
  addCardTitle: {
    color: '#ffffff',
    fontSize: '18px',
    fontWeight: 800,
    marginBottom: '14px',
  },
  input: {
    width: '100%',
    height: '46px',
    borderRadius: '14px',
    border: '1px solid rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.06)',
    color: '#ffffff',
    padding: '0 14px',
    boxSizing: 'border-box',
    fontSize: '14px',
    outline: 'none',
  },
  formRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '10px',
    marginTop: '12px',
  },
  formRowSingle: {
    marginTop: '12px',
  },
  select: {
    width: '100%',
    height: '46px',
    borderRadius: '14px',
    border: '1px solid rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.06)',
    color: '#ffffff',
    padding: '0 12px',
    boxSizing: 'border-box',
    fontSize: '14px',
    outline: 'none',
  },
  dayButtonWrap: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: '8px',
    marginTop: '12px',
  },
  dayButton: {
    height: '42px',
    borderRadius: '12px',
    border: '1px solid rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    color: '#ffffff',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 700,
  },
  dayButtonActive: {
    background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
    border: 'none',
  },
  addButton: {
    width: '100%',
    height: '48px',
    marginTop: '14px',
    borderRadius: '14px',
    border: 'none',
    background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
    color: '#ffffff',
    fontSize: '15px',
    fontWeight: 800,
    cursor: 'pointer',
  },
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: '16px',
    boxSizing: 'border-box',
  },
  calendarModalCard: {
    width: '100%',
    maxWidth: '420px',
    background: 'linear-gradient(180deg, #2d1d2f 0%, #231725 100%)',
    borderRadius: '20px',
    padding: '18px',
    border: '1px solid rgba(255,255,255,0.08)',
    boxSizing: 'border-box',
    boxShadow: '0 10px 30px rgba(0,0,0,0.35)',
  },
  calendarHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    marginBottom: '14px',
  },
  calendarNavButton: {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    border: '1px solid rgba(255,255,255,0.08)',
    background: 'rgba(255,255,255,0.05)',
    color: '#ffffff',
    fontSize: '20px',
    cursor: 'pointer',
  },
  calendarTitle: {
    color: '#ffffff',
    fontSize: '17px',
    fontWeight: 800,
  },
  calendarWeekHeader: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: '6px',
    marginBottom: '8px',
  },
  calendarWeekText: {
    textAlign: 'center',
    color: '#cbd5e1',
    fontSize: '12px',
    fontWeight: 700,
  },
  calendarGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: '6px',
  },
  calendarDateCell: {
    position: 'relative',
    aspectRatio: '1 / 1',
    borderRadius: '12px',
    border: '1px solid rgba(255,255,255,0.06)',
    background: 'rgba(255,255,255,0.04)',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    cursor: 'pointer',
  },
  calendarDateCellDim: {
    opacity: 0.45,
  },
  calendarDateCellSelected: {
    background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
    border: 'none',
  },
  calendarDateCellToday: {
    boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.35)',
  },
  calendarDateCellDisabled: {
    opacity: 0.28,
    cursor: 'not-allowed',
  },
  calendarDateNumber: {
    fontSize: '14px',
    fontWeight: 700,
  },
  calendarDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    background: '#f5d0fe',
    marginTop: '4px',
  },
  editModalCard: {
    width: '100%',
    maxWidth: '420px',
    background: 'linear-gradient(180deg, #2d1d2f 0%, #231725 100%)',
    borderRadius: '20px',
    padding: '20px',
    border: '1px solid rgba(255,255,255,0.08)',
    boxSizing: 'border-box',
    boxShadow: '0 10px 30px rgba(0,0,0,0.35)',
  },
  editModalTitle: {
    color: '#ffffff',
    fontSize: '18px',
    fontWeight: 800,
    marginBottom: '12px',
  },
  modalSpacing: {
    marginTop: '10px',
  },
  modalDateRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '8px',
    marginTop: '10px',
  },
  modalDayWrap: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: '6px',
    marginTop: '10px',
  },
  modalDayButton: {
    height: '36px',
    borderRadius: '10px',
    border: '1px solid rgba(255,255,255,0.1)',
    background: 'rgba(255,255,255,0.05)',
    color: '#fff',
    fontSize: '12px',
    cursor: 'pointer',
  },
  modalDayButtonActive: {
    background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
    border: 'none',
  },
  modalButtonRow: {
    display: 'flex',
    gap: '8px',
    marginTop: '16px',
  },
  modalCancelButton: {
    flex: 1,
    height: '42px',
    borderRadius: '12px',
    border: '1px solid rgba(255,255,255,0.1)',
    background: 'rgba(255,255,255,0.05)',
    color: '#fff',
    cursor: 'pointer',
  },
  modalSaveButton: {
    flex: 1,
    height: '42px',
    borderRadius: '12px',
    border: 'none',
    background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
    color: '#fff',
    fontWeight: 800,
    cursor: 'pointer',
  },
};
