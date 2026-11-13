import { useId } from 'react'
import logo from '../assets/findme-logo.png'
import './BrandLogo.css'

export default function BrandLogo({ decorative = false }) {
  const tintId = useId()
  return (
    <svg
      className="brand-logo"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="330 135 960 665"
      width="960"
      height="665"
      role={decorative ? undefined : 'img'}
      aria-label={decorative ? undefined : 'FindME'}
      aria-hidden={decorative ? true : undefined}
      focusable="false"
    >
      <defs>
        <filter id={tintId} colorInterpolationFilters="sRGB">
          <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -1 0 0 1 0" result="ink" />
          <feFlood floodColor="var(--brown)" result="brand-color" />
          <feComposite in="brand-color" in2="ink" operator="in" />
        </filter>
      </defs>
      {/* 원본 로고를 보존하고 화면에서만 공통 브랜드 색상을 적용합니다. */}
      <image href={logo} width="1599" height="984" filter={`url(#${tintId})`} />
    </svg>
  )
}
