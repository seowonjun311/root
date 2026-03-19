import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

const SECTIONS = [
  {
    title: '1. 수집하는 개인정보 항목',
    content: `앱은 서비스 제공을 위해 다음과 같은 정보를 수집합니다.
• 이메일 주소 (회원가입 및 로그인 시)
• 닉네임 (사용자가 직접 입력)
• 목표 및 행동 기록 데이터
• 운동 GPS 경로 및 거리 정보 (사용자가 GPS 기능 활성화 시에만)
• 수련 사진 (사용자가 직접 업로드 시에만)`
  },
  {
    title: '2. 개인정보 수집 및 이용 목적',
    content: `수집된 정보는 다음 목적으로만 사용됩니다.
• 서비스 제공 및 회원 관리
• 목표·행동 기록의 저장 및 통계 제공
• 운동 경로 시각화 (GPS 활성화 시)
• 서비스 개선 및 오류 수정`
  },
  {
    title: '3. 개인정보 보유 및 이용 기간',
    content: `• 회원 탈퇴 시 모든 개인정보 및 기록 데이터를 즉시 삭제합니다.
• GPS 좌표 데이터는 기기 로컬 저장소에만 보관되며, 사용자가 수동으로 삭제할 수 있습니다.
• 법령에 특별한 규정이 있는 경우를 제외하고는 위 기간 이상 보유하지 않습니다.`
  },
  {
    title: '4. 위치정보 수집 및 이용',
    content: `• GPS 위치 정보는 운동 경로 기록 목적으로만 수집됩니다.
• GPS 기능은 선택 사항이며, 사용자가 명시적으로 동의한 경우에만 활성화됩니다.
• 수집된 위치 정보는 제3자에게 제공되지 않습니다.`
  },
  {
    title: '5. 개인정보의 제3자 제공',
    content: `앱은 사용자의 개인정보를 원칙적으로 외부에 제공하지 않습니다. 단, 다음의 경우는 예외입니다.
• 사용자가 사전에 동의한 경우
• 법령의 규정에 의거하거나 수사 목적으로 법령에 정해진 절차에 따라 요청이 있는 경우`
  },
  {
    title: '6. 사용자의 권리',
    content: `사용자는 언제든지 다음 권리를 행사할 수 있습니다.
• 개인정보 조회 및 수정: 앱 내 설정에서 직접 변경
• 계정 삭제: 설정 → 계정 삭제를 통해 모든 데이터 즉시 삭제
• GPS 데이터 비활성화: 운동 기록 시 GPS 사용 안함 선택`
  },
  {
    title: '7. 개인정보 보호 책임자',
    content: `개인정보 처리에 관한 문의 사항은 아래로 연락해 주세요.
• 이메일: support@questlog.app
• 처리 기간: 영업일 기준 3일 이내 답변`
  },
  {
    title: '8. 개정 이력',
    content: `• 최초 시행일: 2026년 3월 19일
• 본 방침은 법령 또는 서비스 변경에 따라 개정될 수 있으며, 변경 시 앱 내 공지를 통해 안내합니다.`
  },
];

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* 헤더 */}
      <div className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3 bg-background/95 backdrop-blur border-b border-border/40"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 12px)' }}>
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl hover:bg-secondary transition-colors"
          aria-label="뒤로 가기"
        >
          <ChevronLeft className="w-5 h-5 text-amber-800" />
        </button>
        <h1 className="font-bold text-base text-amber-900">개인정보처리방침</h1>
      </div>

      <div className="p-5 space-y-6 pb-12">
        <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/60">
          <p className="text-xs text-amber-800 leading-relaxed">
            퀘스트로그(QuestLog) 앱(이하 "앱")은 사용자의 개인정보를 소중히 여기며, 
            개인정보보호법 및 관련 법령을 준수합니다.
          </p>
        </div>

        {SECTIONS.map((section, i) => (
          <div key={i} className="space-y-2">
            <h2 className="font-bold text-sm text-amber-900">{section.title}</h2>
            <p className="text-xs text-foreground/80 leading-relaxed whitespace-pre-line bg-card border border-border/40 rounded-xl p-4">
              {section.content}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}