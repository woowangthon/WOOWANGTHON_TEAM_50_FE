export const INTEREST_TYPES = [
  { code: 'R', label: '현실형', activity: '직접 만들고 움직이는 활동', description: '도구나 기계를 다루고, 손이나 몸을 써서 무언가를 만들고 고치는 활동에 흥미를 느껴요.', example: '조립하기 · 실습하기 · 기계 다루기' },
  { code: 'I', label: '탐구형', activity: '궁금한 원리를 알아가는 활동', description: '관찰하고 실험하며 왜 그런지 알아보고, 자료를 분석해 답을 찾는 활동에 흥미를 느껴요.', example: '실험하기 · 조사하기 · 문제 분석하기' },
  { code: 'A', label: '예술형', activity: '나만의 생각을 표현하는 활동', description: '정해진 정답보다 나만의 생각을 글, 그림, 음악이나 디자인으로 표현하는 활동에 흥미를 느껴요.', example: '그리기 · 글쓰기 · 새로운 표현 만들기' },
  { code: 'S', label: '사회형', activity: '사람을 돕고 함께하는 활동', description: '다른 사람의 이야기를 듣고, 가르치거나 돕고 돌보는 활동에 흥미를 느껴요.', example: '친구 돕기 · 설명하기 · 봉사하기' },
  { code: 'E', label: '진취형', activity: '사람을 이끌고 도전하는 활동', description: '목표를 세우고 사람들을 설득하거나 이끌며, 함께 성과를 만드는 활동에 흥미를 느껴요.', example: '행사 기획하기 · 발표하기 · 팀 이끌기' },
  { code: 'C', label: '관습형', activity: '규칙에 맞춰 꼼꼼히 정리하는 활동', description: '정해진 규칙과 절차에 따라 자료나 기록을 정확하게 정리하고 관리하는 활동에 흥미를 느껴요.', example: '기록하기 · 계획 세우기 · 자료 정리하기' },
]

export function interestScores(traits) {
  return INTEREST_TYPES.map((type) => {
    const score = traits.find((trait) => trait.code === type.code)?.score
    return { ...type, score: Number.isFinite(score) ? Math.min(1, Math.max(0, score)) : 0 }
  })
}

export function traitLabel(trait) {
  return trait.code === 'autonomy' ? '스스로 결정하기' : trait.label
}
