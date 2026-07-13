<template>
  <div class="auth-root">
    <!-- Ambient glow -->
    <div class="ambient-glow" aria-hidden="true" />

    <!-- Noise texture -->
    <div class="noise" aria-hidden="true" />

    <!-- Subtle grid pattern -->
    <div class="auth-grid" aria-hidden="true" />

    <div class="auth-wrapper">
      <!-- Back button -->
      <button class="auth-back-btn" @click="goBack" :aria-label="$t('common.back')">← {{ $t('common.back') }}</button>

      <!-- Card -->
      <div class="auth-card">
        <slot />
      </div>

      <!-- Footer -->
      <p class="auth-footer">{{ $t('auth.footer', { year: new Date().getFullYear() }) }}</p>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const goBack = () => {
  router.push('/')
}
</script>

<style scoped>
/* ── Root ────────────────────────────────────────────────── */
.auth-root {
  min-height: 100vh;
  background-color: var(--color-bg-base);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 16px 56px;
  position: relative;
  overflow: hidden;
  font-family: var(--font-body);
}

/* ── Back button ────────────────────────────────────────── */
.auth-back-btn {
  position: absolute;
  top: -10px;
  left: -100px;
  background: rgba(255, 255, 255, 0.04);
  border: none;
  color: var(--color-text-secondary);
  font-size: 15px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: var(--radius-pill);
  cursor: pointer;
  transition: all 0.2s ease;
  z-index: 2;
}
.auth-back-btn:hover {
  color: var(--color-text-primary);
  background: rgba(255, 255, 255, 0.06);
  transform: translateX(-2px);
}
.auth-back-btn:focus-visible {
  outline: 2px solid var(--color-accent-muted);
  outline-offset: 2px;
}

/* ── Background layers ──────────────────────────────────── */
.ambient-glow {
  position: fixed;
  top: 40%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 720px;
  height: 520px;
  background: radial-gradient(ellipse at center, var(--color-accent-muted) 0%, transparent 65%);
  pointer-events: none;
  z-index: 0;
  filter: blur(8px);
}
.noise {
  position: fixed;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E");
  background-size: 180px 180px;
  opacity: 0.03;
  pointer-events: none;
  z-index: 0;
}
.auth-grid {
  position: fixed;
  inset: 0;
  background-image: radial-gradient(circle, var(--color-border-subtle) 1px, transparent 1px);
  background-size: 28px 28px;
  opacity: 0.6;
  pointer-events: none;
  z-index: 0;
  mask-image: radial-gradient(ellipse 60% 60% at 50% 50%, black 30%, transparent 100%);
}

/* ── Wrapper ─────────────────────────────────────────────── */
.auth-wrapper {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 440px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

/* ── Logo ────────────────────────────────────────────────── */
.auth-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  animation: fade-down 0.4s cubic-bezier(0.22, 1, 0.36, 1) both;
  animation-delay: 0.05s;
}
.auth-logo-icon {
  width: 36px;
  height: 36px;
  background: var(--color-accent);
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: var(--shadow-glow);
}
.auth-logo-wordmark {
  font-family: var(--font-display);
  font-size: 22px;
  font-weight: 800;
  color: var(--color-text-primary);
  letter-spacing: -0.5px;
}

/* ── Card ────────────────────────────────────────────────── */
.auth-card {
  width: 100%;
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-panel);
  padding: 36px 36px 32px;
  box-shadow:
    0 0 0 1px var(--color-border-subtle),
    0 20px 50px rgba(0, 0, 0, 0.5),
    0 0 40px -10px var(--color-accent-muted);
  animation: card-in 0.45s cubic-bezier(0.22, 1, 0.36, 1) both;
  animation-delay: 0.1s;
}
.auth-card::before {
  content: '';
  display: block;
  height: 1px;
  width: 40%;
  margin: 0 auto 28px;
  background: linear-gradient(to right, transparent, var(--color-accent-border), transparent);
  border-radius: 999px;
}

/* ── Footer ─────────────────────────────────────────────── */
.auth-footer {
  font-size: 12px;
  color: var(--color-text-faint);
  font-family: var(--font-body);
  letter-spacing: 0.01em;
  animation: fade-up 0.4s cubic-bezier(0.22, 1, 0.36, 1) both;
  animation-delay: 0.2s;
}

/* ── Animations ─────────────────────────────────────────── */
@keyframes card-in {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.975);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
@keyframes fade-down {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
@keyframes fade-up {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ── Responsive ─────────────────────────────────────────── */
@media (max-width: 480px) {
  .auth-card {
    padding: 28px 22px 26px;
    border-radius: var(--radius-card);
  }
  .auth-back-btn {
    top: 16px;
    left: 16px;
    font-size: 14px;
    padding: 6px 10px;
  }
}
</style>
