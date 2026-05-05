<template>
  <div class="sa-shell" :class="{ 'sidebar-collapsed': collapsed, 'sidebar-open': mobileOpen }">
    <!-- ── Mobile overlay ──────────────────────────── -->
    <div class="sa-overlay" @click="mobileOpen = false" />

    <!-- ── Sidebar ─────────────────────────────────── -->
    <aside class="sa-sidebar">
      <!-- Logo -->
      <div class="sa-logo">
        <div class="sa-logo-icon">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M10 2L17 6V14L10 18L3 14V6L10 2Z" fill="currentColor" opacity="0.9" />
            <path d="M10 6L14 8.5V13.5L10 16L6 13.5V8.5L10 6Z" fill="white" opacity="0.4" />
          </svg>
        </div>
        <span class="sa-logo-text">{{ $t('layouts.superAdmin') }}</span>
      </div>

      <!-- Nav -->
        <nav class="sa-nav">
          <div class="sa-nav-section">
            <span class="sa-nav-label">{{ $t('layouts.management') }}</span>
            <router-link
              v-for="item in navItems"
              :key="item.path"
              :to="item.path"
              class="sa-nav-item"
              @click="mobileOpen = false"
            >
              <span class="sa-nav-icon" v-html="item.icon" />
              <span class="sa-nav-text">{{ $t('layouts.' + item.labelKey) }}</span>
              <span v-if="item.badge" class="sa-nav-badge">{{ item.badge }}</span>
            </router-link>
          </div>

          <div class="sa-nav-section sa-nav-bottom">
            <span class="sa-nav-label">{{ $t('layouts.system') }}</span>
            <router-link to="/super-admin/settings" class="sa-nav-item" @click="mobileOpen = false">
              <span class="sa-nav-icon" v-html="icons.settings" />
              <span class="sa-nav-text">{{ $t('layouts.settings') }}</span>
            </router-link>
          </div>
        </nav>

      <!-- Collapse toggle (desktop only) -->
      <button class="sa-collapse-btn" @click="collapsed = !collapsed" title="Toggle sidebar">
        <span v-html="collapsed ? icons.expand : icons.collapse" />
      </button>
    </aside>

    <!-- ── Main ─────────────────────────────────────── -->
    <div class="sa-main">
      <!-- Topbar -->
      <header class="sa-topbar">
        <!-- Mobile hamburger -->
        <button class="sa-hamburger" @click="mobileOpen = !mobileOpen">
          <span v-html="icons.menu" />
        </button>

        <!-- Page title -->
        <div class="sa-topbar-title">
          <h1>{{ currentTitle }}</h1>
          <span class="sa-topbar-breadcrumb">Super Admin</span>
        </div>

        <div class="sa-topbar-right">
          <!-- Avatar + name -->
          <div class="sa-user">
            <div class="sa-avatar">
              {{ initials }}
            </div>
            <div class="sa-user-info">
              <span class="sa-user-name">{{ authStore.profile?.full_name || t('layouts.superAdmin') }}</span>
              <span class="sa-user-role">{{ t('layouts.administrator') }}</span>
            </div>
          </div>

          <!-- Logout -->
          <button class="sa-logout-btn" @click="handleLogout" title="$t('layouts.signOut')">
            <span v-html="icons.logout" />
            <span class="sa-logout-text">{{ $t('layouts.signOut') }}</span>
          </button>
        </div>
      </header>

      <!-- Page content -->
      <main class="sa-content">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useI18n } from 'vue-i18n'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const collapsed = ref(false)
const mobileOpen = ref(false)

const icons = {
  dashboard: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>`,
  restaurants: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l19-9-9 19-2-8-8-2z"/></svg>`,
  users: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  subscriptions: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>`,
  settings: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
  logout: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>`,
  menu: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>`,
  collapse: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="15 18 9 12 15 6"/></svg>`,
  expand: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="9 18 15 12 9 6"/></svg>`,
}

const navItems = [
  { path: '/super-admin/dashboard', labelKey: 'overview', icon: icons.dashboard },
  { path: '/super-admin/restaurants', labelKey: 'restaurants', icon: icons.restaurants },
  { path: '/super-admin/users', labelKey: 'users', icon: icons.users },
  { path: '/super-admin/subscriptions', labelKey: 'subscriptions', icon: icons.subscriptions },
]

const titleMap = {
  '/super-admin/dashboard': 'overview',
  '/super-admin/restaurants': 'restaurants',
  '/super-admin/users': 'users',
  '/super-admin/subscriptions': 'subscriptions',
  '/super-admin/settings': 'settings',
}
const currentTitle = computed(() => {
  const key = titleMap[route.path]
  return key ? t(`layouts.${key}`) : t('layouts.superAdmin')
})

const initials = computed(() => {
  const name = authStore.profile?.full_name || ''
  return (
    name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'SA'
  )
})

async function handleLogout() {
  await authStore.signOut()
  router.push('/login')
}
</script>

<style scoped>
/* ── Tokens ─────────────────────────────────────────── */
.sa-shell {
  --sidebar-w: 220px;
  --sidebar-collapsed-w: 64px;
  --topbar-h: 60px;
  --accent: #f97316;
  --accent-dim: #fed7aa;
  --accent-bg: #fff7ed;
  --bg: #f8f7f4;
  --surface: #ffffff;
  --border: #e8e6e1;
  --text-primary: #1a1917;
  --text-secondary: #6b6963;
  --text-muted: #a8a49e;
  --nav-hover: #f3f1ee;
  --nav-active-bg: #fff7ed;
  --nav-active-text: #c2410c;
  --radius: 10px;
  --sidebar-transition: 0.22s cubic-bezier(0.4, 0, 0.2, 1);

  display: flex;
  height: 100dvh;
  background: var(--bg);
  font-family: 'DM Sans', 'Helvetica Neue', sans-serif;
  overflow: hidden;
}

/* ── Sidebar ─────────────────────────────────────────── */
.sa-sidebar {
  width: var(--sidebar-w);
  min-width: var(--sidebar-w);
  background: var(--surface);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  transition:
    width var(--sidebar-transition),
    min-width var(--sidebar-transition);
  overflow: hidden;
  position: relative;
  z-index: 30;
}

.sidebar-collapsed .sa-sidebar {
  width: var(--sidebar-collapsed-w);
  min-width: var(--sidebar-collapsed-w);
}

/* ── Logo ─────────────────────────────────────────────── */
.sa-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 16px;
  height: var(--topbar-h);
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
  overflow: hidden;
}

.sa-logo-icon {
  width: 34px;
  height: 34px;
  min-width: 34px;
  background: var(--accent);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.sa-logo-text {
  font-size: 15px;
  font-weight: 700;
  letter-spacing: -0.3px;
  color: var(--text-primary);
  white-space: nowrap;
  opacity: 1;
  transition: opacity var(--sidebar-transition);
}

.sidebar-collapsed .sa-logo-text {
  opacity: 0;
  pointer-events: none;
}

/* ── Nav ──────────────────────────────────────────────── */
.sa-nav {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 12px 10px;
  gap: 4px;
  overflow-y: auto;
  overflow-x: hidden;
}

.sa-nav-section {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.sa-nav-bottom {
  margin-top: auto;
  padding-top: 12px;
  border-top: 1px solid var(--border);
}

.sa-nav-label {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-muted);
  padding: 8px 8px 4px;
  white-space: nowrap;
  overflow: hidden;
  opacity: 1;
  transition: opacity var(--sidebar-transition);
}

.sidebar-collapsed .sa-nav-label {
  opacity: 0;
}

.sa-nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 10px;
  border-radius: 8px;
  text-decoration: none;
  color: var(--text-secondary);
  font-size: 13.5px;
  font-weight: 500;
  white-space: nowrap;
  transition:
    background 0.15s,
    color 0.15s;
  position: relative;
  overflow: hidden;
}

.sa-nav-item:hover {
  background: var(--nav-hover);
  color: var(--text-primary);
}

.sa-nav-item.router-link-active {
  background: var(--nav-active-bg);
  color: var(--nav-active-text);
}

.sa-nav-item.router-link-active .sa-nav-icon {
  color: var(--accent);
}

.sa-nav-icon {
  min-width: 20px;
  width: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.sa-nav-text {
  opacity: 1;
  transition: opacity var(--sidebar-transition);
  flex: 1;
}

.sidebar-collapsed .sa-nav-text {
  opacity: 0;
  pointer-events: none;
}

.sa-nav-badge {
  background: var(--accent);
  color: white;
  font-size: 10px;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: 20px;
  transition: opacity var(--sidebar-transition);
}

.sidebar-collapsed .sa-nav-badge {
  opacity: 0;
}

/* ── Collapse button ──────────────────────────────────── */
.sa-collapse-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 10px;
  padding: 8px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  transition:
    background 0.15s,
    color 0.15s;
  flex-shrink: 0;
}

.sa-collapse-btn:hover {
  background: var(--nav-hover);
  color: var(--text-primary);
}

/* ── Main ─────────────────────────────────────────────── */
.sa-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 0;
}

/* ── Topbar ───────────────────────────────────────────── */
.sa-topbar {
  height: var(--topbar-h);
  min-height: var(--topbar-h);
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  padding: 0 20px;
  gap: 12px;
}

.sa-hamburger {
  display: none;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  border-radius: 8px;
  flex-shrink: 0;
}

.sa-hamburger:hover {
  background: var(--nav-hover);
}

.sa-topbar-title {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.sa-topbar-title h1 {
  font-size: 16px;
  font-weight: 650;
  color: var(--text-primary);
  margin: 0;
  letter-spacing: -0.2px;
}

.sa-topbar-breadcrumb {
  font-size: 11px;
  color: var(--text-muted);
  font-weight: 500;
  letter-spacing: 0.02em;
}

.sa-topbar-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

/* ── User info ────────────────────────────────────────── */
.sa-user {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 5px 10px 5px 5px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: var(--bg);
}

.sa-avatar {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  background: var(--accent);
  color: white;
  font-size: 11px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  letter-spacing: 0.5px;
}

.sa-user-info {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.sa-user-name {
  font-size: 12.5px;
  font-weight: 600;
  color: var(--text-primary);
  line-height: 1;
}

.sa-user-role {
  font-size: 10.5px;
  color: var(--accent);
  font-weight: 500;
  line-height: 1;
}

/* ── Logout ───────────────────────────────────────────── */
.sa-logout-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 12px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: transparent;
  color: var(--text-secondary);
  font-size: 12.5px;
  font-weight: 500;
  cursor: pointer;
  transition:
    background 0.15s,
    color 0.15s,
    border-color 0.15s;
  white-space: nowrap;
}

.sa-logout-btn:hover {
  background: #fff1f2;
  color: #e11d48;
  border-color: #fecdd3;
}

/* ── Content ──────────────────────────────────────────── */
.sa-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

/* ── Mobile overlay ───────────────────────────────────── */
.sa-overlay {
  display: none;
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  z-index: 25;
  backdrop-filter: blur(2px);
}

/* ── Mobile ───────────────────────────────────────────── */
@media (max-width: 768px) {
  .sa-hamburger {
    display: flex;
  }

  .sa-collapse-btn {
    display: none;
  }

  .sa-sidebar {
    position: fixed;
    left: 0;
    top: 0;
    bottom: 0;
    width: var(--sidebar-w) !important;
    min-width: var(--sidebar-w) !important;
    transform: translateX(-100%);
    transition: transform var(--sidebar-transition);
    box-shadow: 4px 0 24px rgba(0, 0, 0, 0.08);
  }

  .sidebar-open .sa-sidebar {
    transform: translateX(0);
  }

  .sidebar-open .sa-overlay {
    display: block;
  }

  .sa-logo-text,
  .sa-nav-text,
  .sa-nav-label,
  .sa-nav-badge {
    opacity: 1 !important;
    pointer-events: auto !important;
  }

  .sa-logout-text {
    display: none;
  }

  .sa-user-info {
    display: none;
  }
}
</style>
