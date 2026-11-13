const PATHS = {
  search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></>,
  check: <path d="m5 12 4 4L19 6" />,
  pin: <><path d="M8 3h8v6l3 3v2H5v-2l3-3V3Z" /><path d="M12 14v7" /></>,
  'pin-off': <><path d="M8 3h8v6l3 3v2H5v-2l3-3V3Z" /><path d="M12 14v7M3 3l18 18" /></>,
  trash: <><path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7" /></>,
  footprints: <><ellipse cx="8" cy="7" rx="3" ry="4" transform="rotate(-20 8 7)" /><path d="M7 14c-3 0-3 4 0 4 2 0 3-3 0-4Z" /><ellipse cx="17" cy="12" rx="3" ry="4" transform="rotate(20 17 12)" /><path d="M18 19c-3 0-3 4 0 4 2 0 3-3 0-4Z" /></>,
  bookmark: <path d="M6 3h12v18l-6-4-6 4V3Z" />,
  decision: <><path d="M12 21V10m0 3L5 6m7 7 7-7M3 9V4h5m8 0h5v5" /><circle cx="12" cy="5" r="2" /></>,
  compass: <><circle cx="12" cy="12" r="9" /><path d="m16 8-2 6-6 2 2-6 6-2Z" /></>,
  flame: <path d="M12 3c1 5-5 6-5 11a5 5 0 0 0 10 0c0-2-1-4-3-5 0 3-2 3-2 3s2-5 0-9Z" />,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M7 3v4m10-4v4M3 10h18m-14 5 3 3 6-5" /></>,
  sparkles: <><path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3Z" /><path d="M20 2v4m-2-2h4" /></>,
  award: <><circle cx="12" cy="9" r="6" /><path d="m8 14-1 7 5-3 5 3-1-7" /></>,
  'thumbs-up': <><path d="M7 10v11H4a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1h3Z" /><path d="M7 10 11 3a2.2 2.2 0 0 1 3.6 2.4L13.5 9H19a2 2 0 0 1 2 2.4l-1.5 7.6A2.5 2.5 0 0 1 17 21H7" /></>,
  'thumbs-down': <><path d="M7 14V3H4a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h3Z" /><path d="M7 14l4 7a2.2 2.2 0 0 0 3.6-2.4L13.5 15H19a2 2 0 0 0 2-2.4l-1.5-7.6A2.5 2.5 0 0 0 17 3H7" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" /></>,
  'chevron-down': <path d="m6 9 6 6 6-6" />,
  'arrow-up-right': <path d="M7 17 17 7M8 7h9v9" />,
}

// filled: 저장된 북마크처럼 안을 채운 모양이 필요할 때 켭니다.
export default function UiIcon({ name, size = 20, filled = false }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      {PATHS[name] || PATHS.award}
    </svg>
  )
}
