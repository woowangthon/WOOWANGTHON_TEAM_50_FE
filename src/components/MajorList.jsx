import { useState } from 'react'
import './MajorList.css'

// 관련 학과 목록. 학과가 많은 직업(최대 10개)은 앞 몇 개만 보여 주고 나머지는 펼쳐서 봅니다.
// 학과가 없으면 아무것도 그리지 않습니다.
export default function MajorList({ majors, limit = 3, label = '관련 학과' }) {
  const [expanded, setExpanded] = useState(false)
  if (!majors?.length) return null

  const hidden = majors.length - limit
  const shown = expanded || hidden <= 0 ? majors : majors.slice(0, limit)

  return (
    <div className="major-list">
      <span className="major-list-label">{label}</span>
      <ul>
        {shown.map((major) => <li key={major}>{major}</li>)}
        {hidden > 0 && (
          <li className="major-list-more">
            <button type="button" aria-expanded={expanded} onClick={() => setExpanded((value) => !value)}>
              {expanded ? '접기' : `외 ${hidden}개`}
            </button>
          </li>
        )}
      </ul>
    </div>
  )
}
