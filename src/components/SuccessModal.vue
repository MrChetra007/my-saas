<template>
  <Teleport to="body">
    <Transition name="success-fade">
      <div
        v-if="modelValue"
        class="success-backdrop"
        @click.self="$emit('update:modelValue', false)"
      >
        <div class="success-modal">
          <!-- Animated check ring -->
          <div class="success-icon-wrap">
            <svg class="success-ring" viewBox="0 0 60 60" fill="none">
              <circle class="ring-track" cx="30" cy="30" r="27" stroke-width="3" />
              <circle
                class="ring-fill"
                cx="30"
                cy="30"
                r="27"
                stroke-width="3"
                stroke-linecap="round"
                :style="{
                  strokeDasharray: ringCircumference,
                  strokeDashoffset: modelValue ? 0 : ringCircumference,
                }"
              />
            </svg>
            <svg
              class="check-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>

          <h2 class="success-title">{{ title }}</h2>
          <p class="success-message">{{ message }}</p>

          <!-- Info rows (e.g. email/password) -->
          <div v-if="details && details.length" class="success-details">
            <div v-for="(item, i) in details" :key="i" class="detail-row">
              <span class="detail-label">{{ item.label }}</span>
              <div class="detail-value-wrap">
                <span class="detail-value">{{ item.value }}</span>
                <button
                  v-if="item.copyable"
                  class="copy-btn"
                  @click="copy(item.value, i)"
                  :title="copiedIndex === i ? t('promotions.copied') : t('common.done')"
                >
                  <svg
                    v-if="copiedIndex !== i"
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <rect x="9" y="9" width="13" height="13" rx="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                  <svg
                    v-else
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.5"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <!-- Warning note (e.g. "save this password") -->
          <div v-if="warning" class="success-warning">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
              />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            {{ warning }}
          </div>

          <!-- Slot for extra content -->
          <slot />

          <button class="success-close-btn" @click="$emit('update:modelValue', false)">
            {{ closeLabel || $t('common.done') }}
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    default: 'Success!',
  },
  message: {
    type: String,
    default: '',
  },
  // Array of { label, value, copyable? }
  details: {
    type: Array,
    default: () => [],
  },
  warning: {
    type: String,
    default: '',
  },
  closeLabel: {
    type: String,
    default: 'Done',
  },
})

defineEmits(['update:modelValue'])

const copiedIndex = ref(null)
const ringCircumference = computed(() => 2 * Math.PI * 27)

async function copy(text, index) {
  try {
    await navigator.clipboard.writeText(text)
    copiedIndex.value = index
    setTimeout(() => (copiedIndex.value = null), 2000)
  } catch {
    // fallback — silently fail
  }
}
</script>

<style scoped>
/* ── Backdrop ── */
.success-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1100;
  padding: 20px;
}

/* ── Modal box ── */
.success-modal {
  background: var(--color-bg-surface, #161616);
  border: 1px solid var(--color-border-subtle, rgba(255, 255, 255, 0.07));
  border-radius: var(--radius-panel, 16px);
  padding: 40px 32px 32px;
  width: 100%;
  max-width: 420px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  box-shadow: 0 32px 64px rgba(0, 0, 0, 0.5);
}

/* ── Animated icon ── */
.success-icon-wrap {
  position: relative;
  width: 64px;
  height: 64px;
  margin-bottom: 20px;
}

.success-ring {
  width: 64px;
  height: 64px;
  transform: rotate(-90deg);
}

.ring-track {
  stroke: var(--color-border-medium, rgba(255, 255, 255, 0.1));
}

.ring-fill {
  stroke: #4ade80;
  transition: stroke-dashoffset 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.check-icon {
  position: absolute;
  inset: 0;
  margin: auto;
  width: 26px;
  height: 26px;
  color: #4ade80;
  animation: check-pop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) 0.45s both;
}

@keyframes check-pop {
  from {
    opacity: 0;
    transform: scale(0.5);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* ── Text ── */
.success-title {
  font-family: var(--font-display, 'Fraunces', serif);
  font-size: 22px;
  font-weight: 700;
  color: var(--color-text-primary, #fff);
  margin-bottom: 6px;
}

.success-message {
  font-size: 14px;
  color: var(--color-text-secondary, rgba(255, 255, 255, 0.55));
  line-height: 1.6;
  margin-bottom: 20px;
}

/* ── Detail rows ── */
.success-details {
  width: 100%;
  background: var(--color-bg-elevated, #0e0e0e);
  border: 1px solid var(--color-border-medium, rgba(255, 255, 255, 0.1));
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 16px;
}

.detail-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 11px 16px;
  gap: 12px;
}

.detail-row + .detail-row {
  border-top: 1px solid var(--color-border-subtle, rgba(255, 255, 255, 0.07));
}

.detail-label {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-muted, rgba(255, 255, 255, 0.35));
  white-space: nowrap;
}

.detail-value-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.detail-value {
  font-size: 13.5px;
  font-weight: 600;
  color: var(--color-text-primary, #fff);
  font-family: monospace;
  word-break: break-all;
}

.copy-btn {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  background: var(--color-bg-surface, #161616);
  border: 1px solid var(--color-border-medium, rgba(255, 255, 255, 0.1));
  color: var(--color-text-muted, rgba(255, 255, 255, 0.35));
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}

.copy-btn:hover {
  border-color: var(--color-accent, #c8733a);
  color: var(--color-accent, #c8733a);
}

/* ── Warning ── */
.success-warning {
  width: 100%;
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 10px 14px;
  background: rgba(251, 191, 36, 0.07);
  border: 1px solid rgba(251, 191, 36, 0.25);
  border-radius: 8px;
  font-size: 12.5px;
  color: #fbbf24;
  line-height: 1.5;
  margin-bottom: 20px;
  text-align: left;
}

.success-warning svg {
  flex-shrink: 0;
  margin-top: 1px;
}

/* ── Close button ── */
.success-close-btn {
  width: 100%;
  padding: 12px;
  background: var(--color-accent, #c8733a);
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  font-family: var(--font-body, 'DM Sans', sans-serif);
  cursor: pointer;
  margin-top: 4px;
  transition: background 0.15s;
}

.success-close-btn:hover {
  background: var(--color-accent-hover, #d4844e);
}

/* ── Transition ── */
.success-fade-enter-active {
  transition: opacity 0.2s ease;
}
.success-fade-leave-active {
  transition: opacity 0.15s ease;
}
.success-fade-enter-from,
.success-fade-leave-to {
  opacity: 0;
}

.success-fade-enter-active .success-modal {
  animation: modal-in 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes modal-in {
  from {
    opacity: 0;
    transform: scale(0.92) translateY(12px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}
</style>
