// 사생활 보호 모드 등에서 localStorage가 막혀 있어도 앱이 멈추지 않게 감쌉니다.
export function readJSON(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

export function writeJSON(key, value) {
  try {
    if (value === null || value === undefined) window.localStorage.removeItem(key)
    else window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // 저장하지 못해도 현재 화면은 계속 동작합니다.
  }
}
