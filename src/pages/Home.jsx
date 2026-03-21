import React, { useEffect, useMemo, useState } from 'react';
import Header from '../components/layout/Header';
import GoalProgress from '../components/home/GoalProgress';
import ActionGoalCard from '../components/home/ActionGoalCard';
import PhotoConfirmModal from '../components/home/PhotoConfirmModal';

const STORAGE_KEY = 'root_home_goals_v8';

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

function getDateTabLabel(dateKey) {
  const target = parseDateKey(dateKey);
  const today = new Date();
  const tomorrow = addDays(today, 1);

  const targetKey = getDateKey(target);
  const todayKey = getDateKey(today);
  const tomorrowKey = getDateKey(tomorrow);

  if (targetKey === todayKey) return '오늘';
  if (targetKey === tomorrowKey) return '내일';
  return formatDateLabel(target);
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
  if (goal.repeatType === 'daily') {
    return '매일';
  }

  if (goal.repeatType === 'weeklyCount') {
    return `주 ${goal.weeklyTarget || 3}회`;
  }

  if (goal.repeatType === 'weekdays') {
    const labels = WEEKDAY_OPTIONS.filter((item) =>
      (goal.repeatDays || []).includes(item.value)
    ).map((item) => item.label);

    return labels.length ? `요일: ${labels.join(', ')}` : '특정 요일';
  }

  return '1회성';
}

function isGoalActiveOnDate(goal, dateKey) {
  const targetDate = parseDateKey(dateKey);
  const startDate = parseDateKey(goal.startDateKey);

  targetDate.setHours(0, 0, 0, 0);
  startDate.setHours(0, 0, 0, 0);

  if (targetDate < startDate) {
    return false;
  }

  if (goal.repeatType === 'daily') {
    return true;
  }

  if (goal.repeatType === 'weeklyCount') {
    return true;
  }

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

    if (record?.done) {
      count += 1;
    }
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

function makeDefaultData() {
  const today = new Date();
  const tomorrow = addDays(today, 1);
  const dayAfterTomorrow = addDays(today, 2);

  return {
    goals: [
      {
        id: 1,
        title: '물 2L 마시기',
        category: '일상',
        startDateKey: getDateKey(today),
        repeatType: 'daily',
        repeatDays: [],
        weeklyTarget: 3,
      },
      {
        id: 2,
        title: '30분 걷기',
        category: '운동',
        startDateKey: getDateKey(today),
        repeatType: 'weeklyCount',
        repeatDays: [],
        weeklyTarget: 3,
      },
      {
        id: 3,
        title: '영어 단어 20개 외우기',
        category: '공부',
        startDateKey: getDateKey(today),
        repeatType: 'once',
        repeatDays: [],
        weeklyTarget: 3,
      },
      {
        id: 4,
        title: '명상 10분',
        category: '정신',
        startDateKey: getDateKey(today),
        repeatType: 'weekdays',
        repeatDays: [1, 3, 5],
        weeklyTarget: 3,
      },
      {
        id: 5,
        title: '팔굽혀펴기 20회',
        category: '운동',
        startDateKey: getDateKey(tomorrow),
        repeatType: 'once',
        repeatDays: [],
        weeklyTarget: 3,
      },
      {
        id: 6,
        title: '책 30분 읽기',
        category: '공부',
        startDateKey: getDateKey(dayAfterTomorrow),
        repeatType: 'once',
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

    if (!saved) {
      return makeDefaultData();
    }

    const parsed = JSON.parse(saved);

    if (
      !parsed ||
      !Array.isArray(parsed.goals) ||
      typeof parsed.records !== 'object'
    ) {
      return makeDefaultData();
    }

    return parsed;
  } catch (error) {
    console.error('localStorage 불러오기 실패:', error);
    return makeDefaultData();
  }
}

export default function Home() {
  const todayKey = getTodayDateKey();
  const tomorrowKey = getDateKey(addDays(new Date(), 1));

  const initialData = getSavedData();

  const [goals, setGoals] = useState(initialData.goals);
  const [records, setRecords] = useState(initialData.records);

  const [selectedDateKey, setSelectedDateKey] = useState(todayKey);
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState(null);

  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalCategory, setNewGoalCategory] = useState('일상');
  const [newGoalDateKey, setNewGoalDateKey] = useState(todayKey);
  const [newRepeatType, setNewRepeatType] = useState('once');
  const [newWeeklyTarget, setNewWeeklyTarget] = useState(3);
  const [newRepeatDays, setNewRepeatDays] = useState([]);

  const [editingGoalId, setEditingGoalId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState('일상');
  const [editDateKey, setEditDateKey] = useState(todayKey);
  const [editRepeatType, setEditRepeatType] = useState('once');
  const [editWeeklyTarget, setEditWeeklyTarget] = useState(3);
  const [editRepeatDays, setEditRepeatDays] = useState([]);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          goals,
          records,
        })
      );
    } catch (error) {
      console.error('localStorage 저장 실패:', error);
    }
  }, [goals, records]);

  useEffect(() => {
    if (newGoalDateKey < todayKey) {
      setNewGoalDateKey(todayKey);
    }
  }, [newGoalDateKey, todayKey]);

  const availableDateTabs = useMemo(() => {
    const futureOrTodayKeys = new Set([todayKey, tomorrowKey]);

    goals.forEach((goal) => {
      if (goal.startDateKey >= todayKey) {
        futureOrTodayKeys.add(goal.startDateKey);
      }
    });

    const sortedKeys = Array.from(futureOrTodayKeys).sort((a, b) =>
      a.localeCompare(b)
    );

    return sortedKeys.map((dateKey) => ({
      key: dateKey,
      label: getDateTabLabel(dateKey),
      subLabel: formatDateLabel(parseDateKey(dateKey)),
    }));
  }, [goals, todayKey, tomorrowKey]);

  useEffect(() => {
    const exists = availableDateTabs.some((tab) => tab.key === selectedDateKey);
    if (!exists && availableDateTabs.length > 0) {
      setSelectedDateKey(availableDateTabs[0].key);
    }
  }, [availableDateTabs, selectedDateKey]);

  const filteredGoals = useMemo(() => {
    return goals
      .filter((goal) => isGoalActiveOnDate(goal, selectedDateKey))
      .map((goal) => {
        const record = records[makeRecordKey(goal.id, selectedDateKey)];

        return {
          ...goal,
          done: record?.done || false,
          photo: record?.photo || null,
        };
      });
  }, [goals, records, selectedDateKey]);

  const selectedGoal = useMemo(() => {
    return filteredGoals.find((goal) => goal.id === selectedGoalId) || null;
  }, [filteredGoals, selectedGoalId]);

  const completedCount = filteredGoals.filter((goal) => goal.done).length;
  const totalCount = filteredGoals.length;
  const progressPercent =
    totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

  const selectedDateTab = availableDateTabs.find(
    (tab) => tab.key === selectedDateKey
  );

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

  const todayXp = useMemo(() => {
    let total = 0;

    filteredGoals.forEach((goal) => {
      if (!goal.done) return;
      total += XP_BY_CATEGORY[goal.category] || 0;
    });

    return total;
  }, [filteredGoals]);

  const handleGoalClick = (goal) => {
    if (goal.repeatType === 'weeklyCount' && !goal.done) {
      const weeklyDoneCount = countWeeklyDoneForGoal(
        goal.id,
        selectedDateKey,
        records
      );

      if (weeklyDoneCount >= goal.weeklyTarget) {
        alert(`이 목표는 이번 주 ${goal.weeklyTarget}회를 이미 완료했어요.`);
        return;
      }
    }

    setSelectedGoalId(goal.id);
    setPhotoModalOpen(true);
  };

  const handleCloseModal = () => {
    setPhotoModalOpen(false);
    setSelectedGoalId(null);
  };

  const handleConfirmPhoto = async (file) => {
    try {
      const goal = goals.find((item) => item.id === selectedGoalId);

      if (!goal) {
        handleCloseModal();
        return;
      }

      const currentRecord = records[makeRecordKey(selectedGoalId, selectedDateKey)];

      if (goal.repeatType === 'weeklyCount' && !currentRecord?.done) {
        const weeklyDoneCount = countWeeklyDoneForGoal(
          goal.id,
          selectedDateKey,
          records
        );

        if (weeklyDoneCount >= goal.weeklyTarget) {
          alert(`이 목표는 이번 주 ${goal.weeklyTarget}회를 이미 완료했어요.`);
          handleCloseModal();
          return;
        }
      }

      let photoData = null;

      if (file) {
        photoData = await fileToBase64(file);
      }

      const recordKey = makeRecordKey(selectedGoalId, selectedDateKey);

      setRecords((prev) => ({
        ...prev,
        [recordKey]: {
          done: true,
          photo: photoData || prev[recordKey]?.photo || null,
        },
      }));

      handleCloseModal();
    } catch (error) {
      console.error(error);
      alert('사진을 저장하는 중 문제가 발생했어요.');
    }
  };

  const handleToggleDone = (goalId) => {
    const goal = goals.find((item) => item.id === goalId);
    if (!goal) return;

    const recordKey = makeRecordKey(goalId, selectedDateKey);
    const currentRecord = records[recordKey];
    const nextDone = !currentRecord?.done;

    if (goal.repeatType === 'weeklyCount' && nextDone) {
      const weeklyDoneCount = countWeeklyDoneForGoal(goalId, selectedDateKey, records);

      if (weeklyDoneCount >= goal.weeklyTarget) {
        alert(`이 목표는 이번 주 ${goal.weeklyTarget}회를 이미 완료했어요.`);
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
      alert('날짜를 선택해주세요.');
      return;
    }

    if (newGoalDateKey < todayKey) {
      alert('오늘 이전 날짜는 선택할 수 없어요.');
      return;
    }

    if (newRepeatType === 'weekdays' && newRepeatDays.length === 0) {
      alert('특정 요일을 하나 이상 선택해주세요.');
      return;
    }

    const newGoal = {
      id: Date.now(),
      title: trimmedTitle,
      category: newGoalCategory,
      startDateKey: newGoalDateKey,
      repeatType: newRepeatType,
      repeatDays: newRepeatType === 'weekdays' ? newRepeatDays : [],
      weeklyTarget: newRepeatType === 'weeklyCount' ? Number(newWeeklyTarget) : 3,
    };

    setGoals((prevGoals) => [newGoal, ...prevGoals]);
    setNewGoalTitle('');
    setNewGoalCategory('일상');
    setNewGoalDateKey(todayKey);
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
        if (String(key).startsWith(`${goalId}_`)) {
          delete next[key];
        }
      });
      return next;
    });

    if (editingGoalId === goalId) {
      handleCancelEdit();
    }
  };

  const handleStartEdit = (goal) => {
    setEditingGoalId(goal.id);
    setEditTitle(goal.title);
    setEditCategory(goal.category);
    setEditDateKey(goal.startDateKey);
    setEditRepeatType(goal.repeatType);
    setEditWeeklyTarget(goal.weeklyTarget || 3);
    setEditRepeatDays(goal.repeatDays || []);
  };

  const handleCancelEdit = () => {
    setEditingGoalId(null);
    setEditTitle('');
    setEditCategory('일상');
    setEditDateKey(todayKey);
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
      alert('날짜를 선택해주세요.');
      return;
    }

    if (editDateKey < todayKey) {
      alert('오늘 이전 날짜는 선택할 수 없어요.');
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

    setNewGoalTitle('');
    setNewGoalCategory('일상');
    setNewGoalDateKey(todayKey);
    setNewRepeatType('once');
    setNewWeeklyTarget(3);
    setNewRepeatDays([]);

    handleCancelEdit();

    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <Header
          title="루트"
          subtitle="날짜를 고르고 반복 목표를 만들며 경험치와 레벨을 쌓아보세요"
        />

        <div style={styles.section}>
          <div style={styles.dateTabsScroll}>
            <div style={styles.dateTabsInline}>
              {availableDateTabs.map((tab) => {
                const active = tab.key === selectedDateKey;

                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setSelectedDateKey(tab.key)}
                    style={{
                      ...styles.dateTabButtonWide,
                      ...(active ? styles.dateTabButtonActive : {}),
                    }}
                  >
                    <div
                      style={{
                        ...styles.dateTabLabel,
                        ...(active ? styles.dateTabLabelActive : {}),
                      }}
                    >
                      {tab.label}
                    </div>
                    <div
                      style={{
                        ...styles.dateTabSubLabel,
                        ...(active ? styles.dateTabSubLabelActive : {}),
                      }}
                    >
                      {tab.subLabel}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div style={styles.section}>
          <GoalProgress
            completed={completedCount}
            total={totalCount}
            percent={progressPercent}
          />
        </div>

        <div style={styles.section}>
          <div style={styles.xpCard}>
            <div style={styles.xpTopRow}>
              <div>
                <div style={styles.xpLabel}>전체 성장</div>
                <div style={styles.xpTotal}>
                  Lv.{levelSummary.total.level} · 총 {xpSummary.total} XP
                </div>
              </div>

              <div style={styles.todayXpBadge}>
                {selectedDateTab ? `${selectedDateTab.label}` : '오늘'} +{todayXp} XP
              </div>
            </div>

            <div style={styles.levelBarBackground}>
              <div
                style={{
                  ...styles.levelBarFill,
                  width: `${levelSummary.total.progressPercent}%`,
                }}
              />
            </div>

            <div style={styles.levelGuide}>
              다음 레벨까지 {levelSummary.total.remainXp} XP 남았어요
            </div>

            <div style={styles.xpGrid}>
              <div style={styles.xpItem}>
                <div style={styles.xpItemTop}>
                  <div style={styles.xpItemLabel}>운동</div>
                  <div style={styles.xpItemLevel}>Lv.{levelSummary.운동.level}</div>
                </div>
                <div style={styles.xpItemValue}>{xpSummary.운동} XP</div>
                <div style={styles.smallBarBackground}>
                  <div
                    style={{
                      ...styles.smallBarFill,
                      width: `${levelSummary.운동.progressPercent}%`,
                    }}
                  />
                </div>
              </div>

              <div style={styles.xpItem}>
                <div style={styles.xpItemTop}>
                  <div style={styles.xpItemLabel}>공부</div>
                  <div style={styles.xpItemLevel}>Lv.{levelSummary.공부.level}</div>
                </div>
                <div style={styles.xpItemValue}>{xpSummary.공부} XP</div>
                <div style={styles.smallBarBackground}>
                  <div
                    style={{
                      ...styles.smallBarFill,
                      width: `${levelSummary.공부.progressPercent}%`,
                    }}
                  />
                </div>
              </div>

              <div style={styles.xpItem}>
                <div style={styles.xpItemTop}>
                  <div style={styles.xpItemLabel}>정신</div>
                  <div style={styles.xpItemLevel}>Lv.{levelSummary.정신.level}</div>
                </div>
                <div style={styles.xpItemValue}>{xpSummary.정신} XP</div>
                <div style={styles.smallBarBackground}>
                  <div
                    style={{
                      ...styles.smallBarFill,
                      width: `${levelSummary.정신.progressPercent}%`,
                    }}
                  />
                </div>
              </div>

              <div style={styles.xpItem}>
                <div style={styles.xpItemTop}>
                  <div style={styles.xpItemLabel}>일상</div>
                  <div style={styles.xpItemLevel}>Lv.{levelSummary.일상.level}</div>
                </div>
                <div style={styles.xpItemValue}>{xpSummary.일상} XP</div>
                <div style={styles.smallBarBackground}>
                  <div
                    style={{
                      ...styles.smallBarFill,
                      width: `${levelSummary.일상.progressPercent}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            <div style={styles.xpGuide}>
              운동 +12 / 공부 +10 / 정신 +8 / 일상 +6
            </div>
          </div>
        </div>

        <div style={styles.section}>
          <div style={styles.addCard}>
            <div style={styles.addCardTitle}>새 행동목표 추가</div>

            <input
              type="text"
              value={newGoalTitle}
              onChange={(e) => setNewGoalTitle(e.target.value)}
              placeholder="예: 7시 기상, 단어 20개, 30분 걷기"
              style={styles.input}
            />

            <div style={styles.formRow}>
              <select
                value={newGoalCategory}
                onChange={(e) => setNewGoalCategory(e.target.value)}
                style={styles.select}
              >
                <option value="일상">일상</option>
                <option value="운동">운동</option>
                <option value="공부">공부</option>
                <option value="정신">정신</option>
              </select>

              <input
                type="date"
                value={newGoalDateKey}
                min={todayKey}
                onChange={(e) => setNewGoalDateKey(e.target.value)}
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

        {editingGoalId !== null && (
          <div style={styles.section}>
            <div style={styles.editCard}>
              <div style={styles.editCardTitle}>행동목표 수정</div>

              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="행동목표 이름"
                style={styles.input}
              />

              <div style={styles.formRow}>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  style={styles.select}
                >
                  <option value="일상">일상</option>
                  <option value="운동">운동</option>
                  <option value="공부">공부</option>
                  <option value="정신">정신</option>
                </select>

                <input
                  type="date"
                  value={editDateKey}
                  min={todayKey}
                  onChange={(e) => setEditDateKey(e.target.value)}
                  style={styles.input}
                />
              </div>

              <div style={styles.formRowSingle}>
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
                <div style={styles.formRowSingle}>
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
                <div style={styles.dayButtonWrap}>
                  {WEEKDAY_OPTIONS.map((day) => {
                    const active = editRepeatDays.includes(day.value);

                    return (
                      <button
                        key={day.value}
                        type="button"
                        onClick={() => toggleEditRepeatDay(day.value)}
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

              <div style={styles.editButtonRow}>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  style={styles.cancelEditButton}
                >
                  취소
                </button>

                <button
                  type="button"
                  onClick={handleSaveEdit}
                  style={styles.saveEditButton}
                >
                  수정 저장
                </button>
              </div>
            </div>
          </div>
        )}

        <div style={styles.sectionHeader}>
          <div>
            <h2 style={styles.sectionTitle}>
              {selectedDateTab ? `${selectedDateTab.label}의 행동목표` : '행동목표'}
            </h2>
            <div style={styles.sectionSubText}>
              {selectedDateTab ? selectedDateTab.subLabel : ''}
            </div>
          </div>

          <div style={styles.sectionRight}>
            <span style={styles.sectionCount}>
              {completedCount}/{totalCount} 완료
            </span>

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
              <div style={styles.emptyEmoji}>🗓️</div>
              <div style={styles.emptyTitle}>이 날짜에는 아직 목표가 없어요</div>
              <div style={styles.emptyText}>
                위에서 새 행동목표를 추가해보세요.
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
                  if (record?.done) {
                    weeklyDoneCount += 1;
                  }
                }
              }

              const gainedXp = goal.done ? XP_BY_CATEGORY[goal.category] || 0 : 0;

              return (
                <div key={goal.id} style={styles.goalBlock}>
                  <div style={styles.repeatInfoRow}>
                    <div style={styles.repeatBadge}>{getRepeatLabel(goal)}</div>

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
      </div>

      <PhotoConfirmModal
        isOpen={photoModalOpen}
        onClose={handleCloseModal}
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
    minHeight: '100vh',
    background:
      'linear-gradient(180deg, #140f1d 0%, #1b1430 45%, #221938 100%)',
    paddingBottom: '120px',
  },
  container: {
    width: '100%',
    maxWidth: '720px',
    margin: '0 auto',
    padding: '20px 16px 32px',
    boxSizing: 'border-box',
  },
  section: {
    marginTop: '18px',
  },
  dateTabsScroll: {
    overflowX: 'auto',
    paddingBottom: '4px',
  },
  dateTabsInline: {
    display: 'flex',
    gap: '10px',
    minWidth: 'max-content',
  },
  dateTabButtonWide: {
    minWidth: '110px',
    border: '1px solid rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: '18px',
    padding: '14px 12px',
    cursor: 'pointer',
    textAlign: 'center',
    flexShrink: 0,
  },
  dateTabButtonActive: {
    background:
      'linear-gradient(135deg, rgba(139,92,246,0.35), rgba(236,72,153,0.22))',
    border: '1px solid rgba(216,180,254,0.45)',
  },
  dateTabLabel: {
    color: '#ffffff',
    fontSize: '16px',
    fontWeight: 800,
    lineHeight: 1.2,
  },
  dateTabLabelActive: {
    color: '#ffffff',
  },
  dateTabSubLabel: {
    marginTop: '6px',
    color: '#cbd5e1',
    fontSize: '12px',
    fontWeight: 600,
  },
  dateTabSubLabelActive: {
    color: '#f5d0fe',
  },
  xpCard: {
    background: 'linear-gradient(180deg, #2b1c41 0%, #221733 100%)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '22px',
    padding: '18px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
  },
  xpTopRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    flexWrap: 'wrap',
  },
  xpLabel: {
    color: '#cbd5e1',
    fontSize: '13px',
    fontWeight: 600,
    marginBottom: '6px',
  },
  xpTotal: {
    color: '#ffffff',
    fontSize: '24px',
    fontWeight: 800,
  },
  todayXpBadge: {
    minHeight: '38px',
    padding: '0 14px',
    borderRadius: '999px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
    color: '#ffffff',
    fontSize: '13px',
    fontWeight: 800,
  },
  levelBarBackground: {
    width: '100%',
    height: '14px',
    borderRadius: '999px',
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
    marginTop: '14px',
  },
  levelBarFill: {
    height: '100%',
    borderRadius: '999px',
    background: 'linear-gradient(90deg, #8b5cf6 0%, #ec4899 100%)',
  },
  levelGuide: {
    marginTop: '10px',
    color: '#d1d5db',
    fontSize: '12px',
    lineHeight: 1.5,
  },
  xpGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '10px',
    marginTop: '14px',
  },
  xpItem: {
    borderRadius: '16px',
    padding: '14px',
    backgroundColor: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.06)',
  },
  xpItemTop: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '8px',
    marginBottom: '6px',
  },
  xpItemLabel: {
    color: '#cbd5e1',
    fontSize: '12px',
    fontWeight: 700,
  },
  xpItemLevel: {
    color: '#f5d0fe',
    fontSize: '12px',
    fontWeight: 800,
  },
  xpItemValue: {
    color: '#ffffff',
    fontSize: '18px',
    fontWeight: 800,
  },
  smallBarBackground: {
    width: '100%',
    height: '8px',
    borderRadius: '999px',
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
    marginTop: '10px',
  },
  smallBarFill: {
    height: '100%',
    borderRadius: '999px',
    background: 'linear-gradient(90deg, #8b5cf6 0%, #ec4899 100%)',
  },
  xpGuide: {
    marginTop: '12px',
    color: '#d1d5db',
    fontSize: '12px',
    lineHeight: 1.5,
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
  editCard: {
    background: 'linear-gradient(180deg, #2d1d2f 0%, #231725 100%)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '22px',
    padding: '18px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
  },
  editCardTitle: {
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
  editButtonRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '10px',
    marginTop: '14px',
  },
  cancelEditButton: {
    height: '46px',
    borderRadius: '14px',
    border: '1px solid rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.06)',
    color: '#ffffff',
    fontSize: '14px',
    fontWeight: 700,
    cursor: 'pointer',
  },
  saveEditButton: {
    height: '46px',
    borderRadius: '14px',
    border: 'none',
    background: 'linear-gradient(135deg, #a855f7, #ec4899)',
    color: '#ffffff',
    fontSize: '14px',
    fontWeight: 800,
    cursor: 'pointer',
  },
  sectionHeader: {
    marginTop: '28px',
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
  sectionCount: {
    color: '#cbd5e1',
    fontSize: '14px',
    fontWeight: 600,
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
};
