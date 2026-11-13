const MOUTHS = {
  strongly_dislike: 'M6.5 17 Q12 10 17.5 17',
  dislike: 'M8 16 Q12 12.5 16 16',
  neutral: 'M8 15h8',
  like: 'M7 13.5 Q12 19 17 13.5',
  strongly_like: 'M6.5 12.5h11a5.5 5.5 0 0 1-11 0Z',
}

export default function SurveyFace({ value }) {
  return (
    <svg className="interest-option-face" width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <circle className="survey-face-background" cx="12" cy="12" r="10" />
      {value === 'strongly_like' ? (
        <path d="M6.5 9.5q1.5-2 3 0m5 0q1.5-2 3 0" />
      ) : (
        <>
          <circle cx="8.5" cy="9.5" r="0.8" fill="currentColor" stroke="none" />
          <circle cx="15.5" cy="9.5" r="0.8" fill="currentColor" stroke="none" />
        </>
      )}
      {value === 'strongly_dislike' && <path d="m6.5 6.5 3 1m5 0 3-1" />}
      <path d={MOUTHS[value] || MOUTHS.neutral} fill={value === 'strongly_like' ? 'currentColor' : 'none'} />
    </svg>
  )
}
