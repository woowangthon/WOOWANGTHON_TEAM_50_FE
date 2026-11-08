export default function AuthIcon({ name }) {
  const icons = {
    sprout: <><path d="M7 20h10M12 20v-9" /><path d="M12 15C5 15 3 11 3 6c6 0 9 3 9 9ZM12 11c0-5 3-8 9-8 0 5-3 8-9 8Z" /></>,
    mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>,
    lock: <><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4M12 15v2" /></>,
    eye: <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></>,
    'eye-off': <><path d="m3 3 18 18M10.6 5.1A12.5 12.5 0 0 1 12 5c6.5 0 10 7 10 7a20 20 0 0 1-3 3.7M6.1 6.1A21 21 0 0 0 2 12s3.5 7 10 7a13 13 0 0 0 5.9-1.5M9.9 9.9a3 3 0 0 0 4.2 4.2" /></>,
    arrow: <path d="M5 12h14m-6-6 6 6-6 6" />,
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      {icons[name]}
    </svg>
  )
}
