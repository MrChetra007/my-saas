<template>
  <Transition name="ub-slide">
    <div
      v-if="needRefresh"
      class="ub-banner"
      role="alertdialog"
      aria-live="polite"
      :aria-label="$t('pwa.updateTitle')"
    >
      <div class="ub-icon">
        <img src="/pwa-192x192.png" alt="QRserve" width="40" height="40" />
      </div>

      <div class="ub-text">
        <div class="ub-title">{{ $t('pwa.updateTitle') }}</div>
        <p class="ub-desc">{{ $t('pwa.updateDesc') }}</p>
      </div>

      <div class="ub-actions">
        <button class="ub-update" :disabled="updating" @click="onUpdate">
          <RefreshCw :size="15" :class="{ 'ub-spin': updating }" />
          {{ $t('pwa.updateNow') }}
        </button>
        <button class="ub-close" @click="close" :aria-label="$t('pwa.later')">
          <X :size="16" />
        </button>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref } from 'vue'
import { RefreshCw, X } from 'lucide-vue-next'
import { useRegisterSW } from 'virtual:pwa-register/vue'

const updating = ref(false)

const { needRefresh, updateServiceWorker } = useRegisterSW({
  onRegisteredSW(_swUrl, registration) {
    // Long-lived sessions don't re-check on their own — poll hourly so staff
    // eventually see the update prompt without having to close the app.
    if (!registration) return
    setInterval(
      async () => {
        if (registration.installing || !navigator.onLine) return
        try {
          await registration.update()
        } catch {
          /* offline or transient — try again on the next tick */
        }
      },
      60 * 60 * 1000,
    )
  },
  onRegisterError(error) {
    console.error('Service worker registration failed', error)
  },
})

async function onUpdate() {
  updating.value = true
  try {
    // Applies the waiting worker and reloads the page.
    await updateServiceWorker(true)
  } finally {
    updating.value = false
  }
}

function close() {
  needRefresh.value = false
}
</script>

<style scoped>
.ub-banner {
  position: fixed;
  left: 50%;
  top: calc(12px + env(safe-area-inset-top, 0px));
  transform: translateX(-50%);
  z-index: 2100;
  width: calc(100% - 32px);
  max-width: 460px;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 14px;
  background: var(--color-bg-surface, #1b1a18);
  border: 1px solid var(--color-border-medium, #363430);
  border-radius: 14px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.35);
}

.ub-icon {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  border: 1px solid var(--color-border-subtle, #2a2825);
}
.ub-icon img {
  display: block;
}

.ub-text {
  flex: 1;
  min-width: 0;
}

.ub-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--color-text-primary, #fff);
  font-family: var(--font-body, inherit);
}

.ub-desc {
  margin: 2px 0 0;
  font-size: 12.5px;
  line-height: 1.4;
  color: var(--color-text-secondary, #b5b1a9);
}

.ub-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.ub-update {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border: none;
  border-radius: 999px;
  background: var(--color-accent, #f97316);
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  font-family: var(--font-body, inherit);
  cursor: pointer;
  white-space: nowrap;
  transition:
    background 0.15s,
    transform 0.15s;
}
.ub-update:hover:not(:disabled) {
  background: var(--color-accent-hover, #ea6a0a);
  transform: translateY(-1px);
}
.ub-update:disabled {
  opacity: 0.7;
  cursor: default;
}

.ub-spin {
  animation: ub-rotate 0.9s linear infinite;
}
@keyframes ub-rotate {
  to {
    transform: rotate(360deg);
  }
}

.ub-close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border: none;
  background: transparent;
  border-radius: 50%;
  color: var(--color-text-muted, #8a857c);
  cursor: pointer;
  transition:
    background 0.15s,
    color 0.15s;
}
.ub-close:hover {
  background: rgba(255, 255, 255, 0.08);
  color: var(--color-text-primary, #fff);
}

.ub-slide-enter-active,
.ub-slide-leave-active {
  transition:
    opacity 0.25s ease,
    transform 0.25s ease;
}
.ub-slide-enter-from,
.ub-slide-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-16px);
}

@media (max-width: 480px) {
  .ub-banner {
    gap: 10px;
    padding: 10px 12px;
  }
  .ub-desc {
    display: none;
  }
  .ub-icon {
    width: 34px;
    height: 34px;
  }
}
</style>
