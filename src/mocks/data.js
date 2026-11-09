// 백엔드 저장소 backend/data의 attributes.csv, cards.json에서 일부를 옮겨 온 목업 데이터입니다.
export const ATTRIBUTES = [
  { code: 'R', label: '현실형', group: 'interest' },
  { code: 'I', label: '탐구형', group: 'interest' },
  { code: 'A', label: '예술형', group: 'interest' },
  { code: 'S', label: '사회형', group: 'interest' },
  { code: 'E', label: '진취형', group: 'interest' },
  { code: 'C', label: '관습형', group: 'interest' },
  { code: 'team', label: '함께 일하기', group: 'style' },
  { code: 'field', label: '현장·야외', group: 'style' },
  { code: 'novelty', label: '새로움·변화', group: 'value' },
  { code: 'autonomy', label: '자율', group: 'value' },
  { code: 'impact', label: '사회적 영향', group: 'value' },
]

export const CARDS = [
  { card_id: 'c0001', type: 'job_day', title: '수의사의 하루', body: '아침엔 입원한 강아지 상태부터 확인해요. 오후엔 수술, 저녁엔 보호자에게 치료 과정을 설명해요.', job_name: '수의사', attrs: [1, 3, 0, 2, 0, 0, 0, 0, 0, 0, 1], options: [] },
  { card_id: 'c0002', type: 'a_vs_b', title: '주말에 하나만 고른다면?', body: '둘 중 더 끌리는 쪽은?', job_name: null, attrs: [2, 0, 2, 0, 0, 0, 0, 1, 0, 0, 0], options: [
    { id: 'c0002-a', label: '직접 가구 만들기', attrs: [3, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0] },
    { id: 'c0002-b', label: '전시회 보러 가기', attrs: [0, 0, 3, 0, 0, 0, 0, 1, 0, 0, 0] },
  ] },
  { card_id: 'c0003', type: 'situation', title: '조별 과제에서 나는?', body: '조별 과제를 시작했어요. 가장 먼저 하고 싶은 일은?', job_name: null, attrs: [0, 2, 0, 2, 2, 0, 1, 0, 0, 0, 0], options: [
    { id: 'c0003-a', label: '역할을 나누고 일정을 짠다', attrs: [0, 0, 0, 0, 3, 1, 2, 0, 0, 0, 0] },
    { id: 'c0003-b', label: '자료부터 깊이 조사한다', attrs: [0, 3, 0, 0, 0, 0, 0, 0, 0, 1, 0] },
    { id: 'c0003-c', label: '조원들 의견을 하나씩 들어본다', attrs: [0, 0, 0, 3, 0, 0, 2, 0, 0, 0, 0] },
  ] },
  { card_id: 'c0004', type: 'job_day', title: '목공의 하루', body: '아침에 설계 도면을 꼼꼼히 확인하고 마름질 기계로 목재를 정밀하게 잘라내요. 오후에는 높은 공사 현장으로 올라가 다듬은 목재들을 도면에 맞춰 지붕틀로 단단히 조립해요.', job_name: '목공', attrs: [3, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0], options: [] },
  { card_id: 'c0005', type: 'job_day', title: '회계사의 하루', body: '출근 후 기업이 제출한 재무제표 숫자에 오류가 없는지 꼼꼼히 대조해요. 오후에는 기업 담당자들을 직접 만나 회사의 경영 상태를 알기 쉽게 설명하고 더 나은 재정 전략을 설득해요.', job_name: '회계사', attrs: [0, 0, 0, 0, 2, 2, 0, 0, 0, 0, 0], options: [] },
  { card_id: 'c0006', type: 'job_day', title: '경찰관의 하루', body: '오전에는 동네 골목과 도로를 순찰하며 교통 법규 위반을 단속해요. 오후에는 위험에 처했다는 신고를 받고 출동해 시민을 안전하게 보호하고 사건 현장을 꼼꼼히 수습해요.', job_name: '경찰관', attrs: [0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 2], options: [] },
  { card_id: 'c0007', type: 'job_day', title: '가축사육자의 하루', body: '이른 아침 축사 온도를 맞추고 소들에게 줄 영양 사료를 배합해 먹여요. 오후에는 방목장과 우사를 깨끗이 청소하고, 상처 입은 동물이 없는지 세심히 살펴 연고를 발라 줘요.', job_name: '가축사육자', attrs: [2, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0], options: [] },
  { card_id: 'c0008', type: 'job_day', title: '비행기승무원의 하루', body: '탑승 전 동료 승무원들과 회의를 거쳐 비상 장비 상태를 확인해요. 비행기가 뜨면 승객들에게 안전 수칙을 안내하고 따뜻한 식사와 편의용품을 건네며 편안한 여행을 도와요.', job_name: '비행기승무원', attrs: [0, 0, 0, 3, 0, 0, 2, 0, 0, 0, 0], options: [] },
  { card_id: 'c0009', type: 'job_day', title: '제과사 및 제빵사의 하루', body: '새벽부터 밀가루와 버터를 섞어 반죽을 빚고 알맞은 온도의 오븐에 구워요. 오후에는 갓 구운 케이크 위에 달콤한 크림과 과일로 나만의 멋진 장식을 더해 완성해요.', job_name: '제과사 및 제빵사', attrs: [2, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0], options: [] },
  { card_id: 'c0010', type: 'job_day', title: 'GIS전문가의 하루', body: '오전에는 위성 사진과 현장 측정 장비로 수집한 국토의 지리 데이터를 분석해요. 오후에는 이 데이터를 바탕으로 지도 프로그램의 데이터베이스 구조를 꼼꼼히 설계해요.', job_name: 'GIS전문가', attrs: [0, 3, 0, 0, 0, 1, 0, 0, 0, 0, 0], options: [] },
]
