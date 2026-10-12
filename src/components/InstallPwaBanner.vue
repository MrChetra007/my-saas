<template>
  <Transition name="pwa-slide">
    <div v-if="visible" class="pwa-banner" role="dialog" :aria-label="$t('pwa.title')">
      <div class="pwa-icon">
        <img src="/pwa-192x192.png" alt="QRserve" width="40" height="40" />
      </div>

      <div class="pwa-text">
        <div class="pwa-title">{{ isIOS ? $t('pwa.iosTitle') : $t('pwa.title') }}</div>
        <p class="pwa-desc">{{ isIOS ? $t('pwa.iosDesc') : $t('pwa.desc') }}</p>
      </div>

      <div class="pwa-actions">
        <button v-if="canInstall" class="pwa-install" @click="onInstall">
          <Download :size="15" />
          {{ $t('pwa.install') }}
        </button>
        <button class="pwa-close" @click="dismiss" :aria-label="$t('pwa.later')">
          <X :size="16" />
        </button>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { computed } from 'vue'
import { Download, X } from 'lucide-vue-next'
import { usePWAInstall } from '@/composables/usePWAInstall'

const { canInstall, isInstalled, isIOS, dismissed, promptInstall, dismiss } = usePWAInstall()

const visible = computed(
  () => !isInstalled.value && !dismissed.value && (canInstall.value || isIOS.value),
)

async function onInstall() {
  await promptInstall()
}
</script>

<style scoped>
.pwa-banner {
  position: fixed;
  left: 50%;
  bottom: 18px;
  transform: translateX(-50%);
  z-index: 2000;
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

.pwa-icon {
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
.pwa-icon img {
  display: block;
}

.pwa-text {
  flex: 1;
  min-width: 0;
}

.pwa-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--color-text-primary, #fff);
  font-family: var(--font-body, inherit);
}

.pwa-desc {
  margin: 2px 0 0;
  font-size: 12.5px;
  line-height: 1.4;
  color: var(--color-text-secondary, #b5b1a9);
}

.pwa-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.pwa-install {
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
.pwa-install:hover {
  background: var(--color-accent-hover, #ea6a0a);
  transform: translateY(-1px);
}

.pwa-close {
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
.pwa-close:hover {
  background: rgba(255, 255, 255, 0.08);
  color: var(--color-text-primary, #fff);
}

.pwa-slide-enter-active,
.pwa-slide-leave-active {
  transition:
    opacity 0.25s ease,
    transform 0.25s ease;
}
.pwa-slide-enter-from,
.pwa-slide-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(16px);
}

@media (max-width: 480px) {
  .pwa-banner {
    bottom: 12px;
    gap: 10px;
    padding: 10px 12px;
  }
  .pwa-desc {
    display: none;
  }
  .pwa-icon {
    width: 34px;
    height: 34px;
  }
}
</style>
