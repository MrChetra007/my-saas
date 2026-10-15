import { ref, computed, onMounted, onUnmounted } from 'vue'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const HEARTBEAT_INTERVAL = 20000
const HEARTBEAT_TIMEOUT = 8000

/**
 * Tracks whether a staff-facing screen currently has a live connection.
 *
 * A screen is only considered connected when ALL of these hold:
 *   - the browser reports it is online (navigator.onLine + online/offline events)
 *   - the Supabase realtime channel reports SUBSCRIBED (when a channel is used)
 *   - a lightweight heartbeat request to the backend succeeds
 *
 * When any check fails, `isConnected` turns false so the screen can warn staff
 * that it is showing stale ("last known") orders and should not be trusted.
 */
export function useConnectionStatus() {
  const browserOnline = ref(typeof navigator === 'undefined' ? true : navigator.onLine)
  const channelStatus = ref('SUBSCRIBED')
  const serverReachable = ref(true)

  let heartbeatTimer = null

  const isConnected = computed(
    () => browserOnline.value && channelStatus.value === 'SUBSCRIBED' && serverReachable.value,
  )

  function setChannelStatus(status) {
    if (typeof status === 'string') channelStatus.value = status
  }

  function handleOnline() {
    browserOnline.value = true
    void checkServer()
  }

  function handleOffline() {
    browserOnline.value = false
  }

  async function checkServer() {
    if (!SUPABASE_URL || typeof fetch === 'undefined') return
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      serverReachable.value = false
      return
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), HEARTBEAT_TIMEOUT)

    try {
      await fetch(`${SUPABASE_URL}/auth/v1/health`, {
        method: 'GET',
        mode: 'no-cors',
        cache: 'no-store',
        signal: controller.signal,
      })
      serverReachable.value = true
    } catch {
      serverReachable.value = false
    } finally {
      clearTimeout(timeout)
    }
  }

  onMounted(() => {
    if (typeof window === 'undefined') return
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    void checkServer()
    heartbeatTimer = setInterval(checkServer, HEARTBEAT_INTERVAL)
  })

  onUnmounted(() => {
    if (typeof window === 'undefined') return
    window.removeEventListener('online', handleOnline)
    window.removeEventListener('offline', handleOffline)
    if (heartbeatTimer) clearInterval(heartbeatTimer)
  })

  return {
    isConnected,
    browserOnline,
    channelStatus,
    serverReachable,
    setChannelStatus,
  }
}
