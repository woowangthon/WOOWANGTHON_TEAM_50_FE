import './BrandLogo.css'

// FindME 로고: 선으로 그린 망원경 아이콘 + 작은 반짝임 + 글자. 색은 글자색(currentColor)을 따릅니다.
// decorative: 링크 안처럼 옆에 이름이 따로 있을 때 켜서 화면 읽기 프로그램이 두 번 읽지 않게 합니다.
export default function BrandLogo({ decorative = false }) {
  return (
    <svg
      className="brand-logo"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 178 46"
      role={decorative ? undefined : 'img'}
      aria-label={decorative ? undefined : 'FindME'}
      aria-hidden={decorative ? true : undefined}
      focusable="false"
    >
      <g fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
        {/* 망원경 몸통 · 앞쪽 렌즈 테 · 접안부 */}
        <path d="M9 27 33 13.5l4 7L13 34Z" />
        <path d="M33.5 11.5 39.8 8l4.6 8.1-6.3 3.5Z" />
        <path d="M9 27 5.6 29l3 5.2L12 32.3" />
        {/* 삼각대 */}
        <path d="M22.5 27.5 15.5 43M22.5 27.5V43M22.5 27.5 29.5 43" />
      </g>
      {/* 반짝임 */}
      <path d="M48 1.5l1.3 3.9 3.9 1.3-3.9 1.3L48 11.9l-1.3-3.9-3.9-1.3 3.9-1.3Z" fill="currentColor" />
      <text
        x="58"
        y="35"
        textLength="118"
        lengthAdjust="spacingAndGlyphs"
        fill="currentColor"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontSize="30"
        fontWeight="700"
      >
        FindME
      </text>
    </svg>
  )
}
