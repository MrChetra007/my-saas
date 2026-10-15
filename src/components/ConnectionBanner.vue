<template>
  <Transition name="conn-banner">
    <div
      v-if="!connected"
      class="conn-banner"
      :class="online ? 'conn-banner--reconnecting' : 'conn-banner--offline'"
      role="alert"
      aria-live="assertive"
    >
      <WifiOff class="conn-banner__icon" :size="18" />
      <span class="conn-banner__text">
        {{ online ? $t('connection.reconnecting') : $t('connection.offline') }}
      </span>
    </div>
  </Transition>
</template>

<script setup>
import { WifiOff } from 'lucide-vue-next'

defineProps({
  connected: { type: Boolean, default: true },
  online: { type: Boolean, default: true },
})
</script>

<style scoped>
.conn-banner {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 10px 16px;
  padding-top: calc(10px + env(safe-area-inset-top, 0px));
  font-family: 'DM Sans', 'Noto Sans Khmer', sans-serif;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.01em;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.35);
}

.conn-banner--offline {
  background: #dc2626;
  color: #ffffff;
}

.conn-banner--reconnecting {
  background: #d97706;
  color: #ffffff;
}

.conn-banner__icon {
  flex-shrink: 0;
}

.conn-banner__text {
  text-align: center;
}

.conn-banner-enter-active,
.conn-banner-leave-active {
  transition:
    transform 0.25s ease,
    opacity 0.25s ease;
}

.conn-banner-enter-from,
.conn-banner-leave-to {
  transform: translateY(-100%);
  opacity: 0;
}
</style>
