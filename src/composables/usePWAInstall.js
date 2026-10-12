import { ref } from 'vue'

// Module-level singleton state so every caller shares the same install state.
const deferredPrompt = ref(null)
const canInstall = ref(false)
const isInstalled = ref(false)
const isIOS = ref(false)
const dismissed = ref(false)

const DISMISS_KEY = 'pwa-install-dismissed'
let initialized = false

function init() {
  if (initialized || typeof window === 'undefined') return
  initialized = true

  isInstalled.value =
    window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true

  const ua = window.navigator.userAgent || ''
  isIOS.value = /iphone|ipad|ipod/i.test(ua) && !/crios|fxios|edgios/i.test(ua)

  try {
    dismissed.value = localStorage.getItem(DISMISS_KEY) === '1'
  } catch {
    /* localStorage unavailable (private mode) */
  }

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferredPrompt.value = e
    canInstall.value = true
  })

  window.addEventListener('appinstalled', () => {
    deferredPrompt.value = null
    canInstall.value = false
    isInstalled.value = true
  })
}

export function usePWAInstall() {
  init()

  async function promptInstall() {
    const evt = deferredPrompt.value
    if (!evt) return 'unavailable'
    evt.prompt()
    const { outcome } = await evt.userChoice
    deferredPrompt.value = null
    canInstall.value = false
    return outcome
  }

  function dismiss() {
    dismissed.value = true
    try {
      localStorage.setItem(DISMISS_KEY, '1')
    } catch {
      /* ignore */
    }
  }

  return { canInstall, isInstalled, isIOS, dismissed, promptInstall, dismiss }
}
