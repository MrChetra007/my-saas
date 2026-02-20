<template>
  <div class="landing">
    <!-- ── Nav ─────────────────────────────────────── -->
    <nav class="nav" :class="{ scrolled: scrolled }">
      <div class="nav-inner">
        <div class="nav-logo">
          <span class="logo-icon">🍽️</span>
          <span class="logo-text">RestaurantOS</span>
        </div>
        <div class="nav-links">
          <a href="#features" class="nav-link" @click.prevent="scrollTo('features')">Features</a>
          <a href="#how-it-works" class="nav-link" @click.prevent="scrollTo('how-it-works')"
            >How it works</a
          >
          <a href="#pricing" class="nav-link" @click.prevent="scrollTo('pricing')">Pricing</a>
        </div>
        <div class="nav-actions">
          <RouterLink to="/login" class="btn-ghost">Sign in</RouterLink>
          <RouterLink to="/signup" class="btn-primary">Start free trial</RouterLink>
        </div>
        <!-- Mobile menu button -->
        <button class="nav-mobile-btn" @click="mobileMenuOpen = !mobileMenuOpen">
          <span v-if="!mobileMenuOpen">☰</span>
          <span v-else>✕</span>
        </button>
      </div>
      <!-- Mobile menu -->
      <div class="mobile-menu" v-if="mobileMenuOpen">
        <a
          href="#features"
          class="mobile-link"
          @click="(scrollTo('features'), (mobileMenuOpen = false))"
          >Features</a
        >
        <a
          href="#how-it-works"
          class="mobile-link"
          @click="(scrollTo('how-it-works'), (mobileMenuOpen = false))"
          >How it works</a
        >
        <a
          href="#pricing"
          class="mobile-link"
          @click="(scrollTo('pricing'), (mobileMenuOpen = false))"
          >Pricing</a
        >
        <RouterLink to="/login" class="mobile-link">Sign in</RouterLink>
        <RouterLink to="/signup" class="btn-primary mobile-cta">Start free trial</RouterLink>
      </div>
    </nav>

    <!-- ── Hero ─────────────────────────────────────── -->
    <section class="hero">
      <div class="hero-bg">
        <div class="hero-blob blob-1" />
        <div class="hero-blob blob-2" />
        <div class="hero-grain" />
      </div>

      <div class="hero-inner">
        <div class="hero-badge">
          <span class="badge-dot" />
          No app download required
        </div>

        <h1 class="hero-title">
          Your restaurant,<br />
          <em>fully digital</em>
        </h1>

        <p class="hero-body">
          Customers scan a QR code and order from their table. Orders flow instantly to the kitchen.
          Staff manage everything from one dashboard. No hardware. No complexity.
        </p>

        <div class="hero-actions">
          <RouterLink to="/signup" class="btn-hero">
            Start your 14-day free trial
            <span class="btn-arrow">→</span>
          </RouterLink>
          <span class="hero-note">No credit card required</span>
        </div>

        <!-- Hero visual — mock order flow -->
        <div class="hero-visual">
          <div class="flow-step" style="animation-delay: 0s">
            <div class="flow-icon">📱</div>
            <div class="flow-label">Customer scans QR</div>
          </div>
          <div class="flow-arrow">→</div>
          <div class="flow-step" style="animation-delay: 0.1s">
            <div class="flow-icon">🛒</div>
            <div class="flow-label">Places order</div>
          </div>
          <div class="flow-arrow">→</div>
          <div class="flow-step" style="animation-delay: 0.2s">
            <div class="flow-icon">👨‍🍳</div>
            <div class="flow-label">Kitchen notified</div>
          </div>
          <div class="flow-arrow">→</div>
          <div class="flow-step" style="animation-delay: 0.3s">
            <div class="flow-icon">✅</div>
            <div class="flow-label">Order complete</div>
          </div>
        </div>
      </div>
    </section>

    <!-- ── Social proof strip ────────────────────────── -->
    <div class="proof-strip">
      <span class="proof-text">Trusted by restaurants across Southeast Asia</span>
      <div class="proof-dots">
        <div class="proof-dot" v-for="n in 5" :key="n" />
      </div>
    </div>

    <!-- ── Features ──────────────────────────────────── -->
    <section class="section" id="features">
      <div class="section-inner">
        <div class="section-label">Features</div>
        <h2 class="section-title">Everything your team needs,<br />nothing they don't</h2>

        <div class="features-grid">
          <div class="feature-card" v-for="f in features" :key="f.title">
            <div class="feature-icon">{{ f.icon }}</div>
            <h3 class="feature-title">{{ f.title }}</h3>
            <p class="feature-body">{{ f.body }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ── How it works ───────────────────────────────── -->
    <section class="section section-dark" id="how-it-works">
      <div class="section-inner">
        <div class="section-label light">How it works</div>
        <h2 class="section-title light">Up and running in minutes</h2>

        <div class="steps-list">
          <div class="step" v-for="(step, i) in steps" :key="i">
            <div class="step-number">{{ String(i + 1).padStart(2, '0') }}</div>
            <div class="step-content">
              <h3 class="step-title">{{ step.title }}</h3>
              <p class="step-body">{{ step.body }}</p>
            </div>
            <div class="step-icon">{{ step.icon }}</div>
          </div>
        </div>
      </div>
    </section>

    <!-- ── Role breakdown ─────────────────────────────── -->
    <section class="section" id="roles">
      <div class="section-inner">
        <div class="section-label">Built for your whole team</div>
        <h2 class="section-title">One platform, every role</h2>

        <div class="roles-grid">
          <div class="role-card" v-for="role in roles" :key="role.name">
            <div class="role-header">
              <span class="role-icon">{{ role.icon }}</span>
              <span class="role-name">{{ role.name }}</span>
            </div>
            <ul class="role-perks">
              <li v-for="perk in role.perks" :key="perk">{{ perk }}</li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <!-- ── Pricing ────────────────────────────────────── -->
    <section class="section section-warm" id="pricing">
      <div class="section-inner">
        <div class="section-label">Pricing</div>
        <h2 class="section-title">Simple, transparent pricing</h2>
        <p class="section-subtitle">
          14-day free trial on all plans. No credit card required to start.
        </p>

        <div class="pricing-grid">
          <!-- Starter -->
          <div class="pricing-card">
            <div class="pricing-name">Starter</div>
            <div class="pricing-price">
              <span class="price-currency">$</span>
              <span class="price-num">29</span>
              <span class="price-period">/month</span>
            </div>
            <p class="pricing-desc">
              Perfect for small restaurants just getting started with digital ordering.
            </p>
            <ul class="pricing-features">
              <li v-for="f in starterFeatures" :key="f"><span class="check">✓</span> {{ f }}</li>
            </ul>
            <RouterLink to="/signup" class="pricing-btn pricing-btn-secondary">
              Start free trial
            </RouterLink>
          </div>

          <!-- Pro -->
          <div class="pricing-card pricing-card-featured">
            <div class="pricing-badge">Most Popular</div>
            <div class="pricing-name">Pro</div>
            <div class="pricing-price">
              <span class="price-currency">$</span>
              <span class="price-num">59</span>
              <span class="price-period">/month</span>
            </div>
            <p class="pricing-desc">
              For restaurants ready to run their full operation from one place.
            </p>
            <ul class="pricing-features">
              <li v-for="f in proFeatures" :key="f"><span class="check">✓</span> {{ f }}</li>
            </ul>
            <RouterLink to="/signup" class="pricing-btn pricing-btn-primary">
              Start free trial
            </RouterLink>
          </div>
        </div>

        <p class="pricing-note">
          Need something custom for multiple locations?
          <a href="mailto:hello@restaurantos.io" class="pricing-contact">Get in touch →</a>
        </p>
      </div>
    </section>

    <!-- ── FAQ ───────────────────────────────────────── -->
    <section class="section" id="faq">
      <div class="section-inner section-inner-narrow">
        <div class="section-label">FAQ</div>
        <h2 class="section-title">Common questions</h2>

        <div class="faq-list">
          <div
            class="faq-item"
            v-for="(item, i) in faq"
            :key="i"
            :class="{ open: openFaq === i }"
            @click="openFaq = openFaq === i ? null : i"
          >
            <div class="faq-question">
              <span>{{ item.q }}</span>
              <span class="faq-chevron">{{ openFaq === i ? '−' : '+' }}</span>
            </div>
            <div class="faq-answer" v-show="openFaq === i">{{ item.a }}</div>
          </div>
        </div>
      </div>
    </section>

    <!-- ── Final CTA ──────────────────────────────────── -->
    <section class="cta-section">
      <div class="cta-bg">
        <div class="cta-blob" />
        <div class="hero-grain" />
      </div>
      <div class="cta-inner">
        <h2 class="cta-title">Ready to go digital?</h2>
        <p class="cta-body">Start your free 14-day trial today. Set up takes under 10 minutes.</p>
        <RouterLink to="/signup" class="btn-hero">
          Create your account
          <span class="btn-arrow">→</span>
        </RouterLink>
        <span class="hero-note" style="color: rgba(255, 255, 255, 0.5)"
          >No credit card required</span
        >
      </div>
    </section>

    <!-- ── Footer ─────────────────────────────────────── -->
    <footer class="footer">
      <div class="footer-inner">
        <div class="footer-logo">
          <span class="logo-icon">🍽️</span>
          <span class="logo-text">RestaurantOS</span>
        </div>
        <div class="footer-links">
          <a href="#features" @click.prevent="scrollTo('features')" class="footer-link">Features</a>
          <a href="#pricing" @click.prevent="scrollTo('pricing')" class="footer-link">Pricing</a>
          <RouterLink to="/login" class="footer-link">Sign in</RouterLink>
          <RouterLink to="/signup" class="footer-link">Sign up</RouterLink>
        </div>
        <div class="footer-copy">
          © {{ new Date().getFullYear() }} RestaurantOS. All rights reserved.
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const scrolled = ref(false)
const mobileMenuOpen = ref(false)
const openFaq = ref(null)

function handleScroll() {
  scrolled.value = window.scrollY > 20
}

function scrollTo(id) {
  const el = document.getElementById(id)
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

onMounted(() => window.addEventListener('scroll', handleScroll))
onUnmounted(() => window.removeEventListener('scroll', handleScroll))

const features = [
  {
    icon: '📱',
    title: 'QR Code Ordering',
    body: 'Each table gets a unique QR code. Customers scan and order without downloading anything — just a browser.',
  },
  {
    icon: '⚡',
    title: 'Real-Time Kitchen View',
    body: 'Orders appear on the kitchen screen instantly. Accept, reject, or mark ready — the whole team stays in sync.',
  },
  {
    icon: '📋',
    title: 'Menu Management',
    body: 'Add categories, items, photos, and prices. Toggle availability in real-time when something sells out.',
  },
  {
    icon: '👥',
    title: 'Role-Based Staff',
    body: 'Admins, kitchen staff, cashiers, and waiters each see exactly what they need — nothing more.',
  },
  {
    icon: '💳',
    title: 'Cashier View',
    body: 'See all ready orders and mark them as paid in one tap. No clutter, no confusion.',
  },
  {
    icon: '▦',
    title: 'Dashboard & Analytics',
    body: "Today's revenue, top items, active orders — everything at a glance when you start your shift.",
  },
]

const steps = [
  {
    icon: '🏪',
    title: 'Set up your restaurant',
    body: 'Add your name, logo, currency, and timezone. Takes two minutes.',
  },
  {
    icon: '📋',
    title: 'Build your menu',
    body: 'Create categories, add items with photos and prices. Your menu is live immediately.',
  },
  {
    icon: '⬡',
    title: 'Create tables & print QR codes',
    body: 'Each table gets its own QR. Download them as PNGs or print a full sheet.',
  },
  {
    icon: '🚀',
    title: 'Go live',
    body: "Invite your staff and you're ready. Customers can start ordering the moment they sit down.",
  },
]

const roles = [
  {
    icon: '👤',
    name: 'Admin',
    perks: [
      'Full dashboard access',
      'Menu & table management',
      'Staff management',
      'Settings & billing',
    ],
  },
  {
    icon: '👨‍🍳',
    name: 'Kitchen',
    perks: [
      'Large-text kitchen display',
      'Accept or reject orders',
      'Mark orders as ready',
      'Audio ping on new orders',
    ],
  },
  {
    icon: '💳',
    name: 'Cashier',
    perks: [
      'View all ready orders',
      'Mark as paid in one tap',
      'Order history for the day',
      'Mobile-friendly view',
    ],
  },
  {
    icon: '🤵',
    name: 'Waiter',
    perks: [
      'Create orders on behalf of customers',
      'See live order status',
      'Table-by-table view',
      'No extra hardware needed',
    ],
  },
]

const starterFeatures = [
  'Up to 3 staff accounts',
  'Unlimited orders & tables',
  'QR ordering page',
  'Kitchen & cashier views',
  'Menu management',
  'Email support',
]

const proFeatures = [
  'Unlimited staff accounts',
  'Unlimited orders & tables',
  'QR ordering page',
  'Kitchen & cashier views',
  'Menu management',
  'Dashboard analytics',
  'Priority support',
]

const faq = [
  {
    q: 'Do customers need to download an app?',
    a: 'No. The ordering page is a regular website that opens directly in the browser when a customer scans the QR code. No app store, no account, no friction.',
  },
  {
    q: 'How does the kitchen receive orders?',
    a: "Orders appear on the kitchen screen in real-time using Supabase Realtime. There's no polling or page refresh needed — it updates instantly the moment a customer submits.",
  },
  {
    q: 'Can I use RestaurantOS on a tablet or phone?',
    a: 'Yes. The kitchen view and cashier view are both optimized for mobile and tablet. The admin dashboard works great on desktop.',
  },
  {
    q: 'What happens when my trial ends?',
    a: "You'll see an upgrade screen and won't be able to access the app until you subscribe. Your data is never deleted — it's all there waiting when you upgrade.",
  },
  {
    q: 'Can I manage multiple restaurant locations?',
    a: 'Multi-branch support is on the roadmap. For now, each location needs its own account. Get in touch if you need a custom arrangement.',
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Yes. You can cancel your subscription at any time from the Settings page. There are no lock-in contracts or cancellation fees.',
  },
]
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,300;0,400;0,600;0,700;0,800;1,400;1,700&family=DM+Sans:wght@400;500;600&display=swap');

*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

.landing {
  font-family: 'DM Sans', sans-serif;
  background: #f5f3ef;
  color: #1c1917;
  overflow-x: hidden;
}

/* ── Nav ──────────────────────────────────────────── */
.nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  padding: 0 24px;
  transition:
    background 0.2s,
    box-shadow 0.2s;
}

.nav.scrolled {
  background: rgba(245, 243, 239, 0.92);
  backdrop-filter: blur(12px);
  box-shadow: 0 1px 0 #e8e2da;
}

.nav-inner {
  max-width: 1100px;
  margin: 0 auto;
  height: 68px;
  display: flex;
  align-items: center;
  gap: 32px;
}

.nav-logo {
  display: flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
  flex-shrink: 0;
}

.logo-icon {
  font-size: 20px;
}

.logo-text {
  font-family: 'Fraunces', serif;
  font-size: 18px;
  font-weight: 700;
  color: #1c1917;
  letter-spacing: -0.3px;
}

.nav-links {
  display: flex;
  gap: 28px;
  flex: 1;
}

.nav-link {
  font-size: 14px;
  font-weight: 500;
  color: #6b6460;
  text-decoration: none;
  transition: color 0.15s;
}

.nav-link:hover {
  color: #1c1917;
}

.nav-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.btn-ghost {
  font-family: 'DM Sans', sans-serif;
  font-size: 14px;
  font-weight: 600;
  color: #4a4440;
  text-decoration: none;
  padding: 8px 16px;
  border-radius: 8px;
  transition: background 0.15s;
}

.btn-ghost:hover {
  background: rgba(0, 0, 0, 0.05);
}

.btn-primary {
  font-family: 'DM Sans', sans-serif;
  font-size: 14px;
  font-weight: 600;
  color: white;
  background: #1c1917;
  text-decoration: none;
  padding: 9px 18px;
  border-radius: 8px;
  transition: background 0.15s;
  white-space: nowrap;
}

.btn-primary:hover {
  background: #2d2421;
}

.nav-mobile-btn {
  display: none;
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #1c1917;
  margin-left: auto;
}

.mobile-menu {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px 0 20px;
  border-top: 1px solid #e8e2da;
  background: #f5f3ef;
}

.mobile-link {
  font-size: 15px;
  font-weight: 500;
  color: #4a4440;
  text-decoration: none;
  padding: 10px 4px;
  transition: color 0.15s;
}

.mobile-link:hover {
  color: #1c1917;
}

.mobile-cta {
  margin-top: 8px;
  text-align: center;
}

/* ── Hero ─────────────────────────────────────────── */
.hero {
  position: relative;
  padding: 160px 24px 100px;
  text-align: center;
  overflow: hidden;
}

.hero-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}

.hero-blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.5;
}

.blob-1 {
  width: 500px;
  height: 400px;
  background: radial-gradient(ellipse, rgba(200, 115, 58, 0.2), transparent 70%);
  top: -100px;
  left: 50%;
  transform: translateX(-50%);
}

.blob-2 {
  width: 300px;
  height: 300px;
  background: radial-gradient(ellipse, rgba(200, 115, 58, 0.1), transparent 70%);
  bottom: 0;
  right: 10%;
}

.hero-grain {
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.025'/%3E%3C/svg%3E");
  background-size: 200px;
  opacity: 0.4;
}

.hero-inner {
  position: relative;
  z-index: 1;
  max-width: 780px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 28px;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  background: rgba(200, 115, 58, 0.1);
  border: 1px solid rgba(200, 115, 58, 0.25);
  border-radius: 99px;
  font-size: 12.5px;
  font-weight: 600;
  color: #c8733a;
  letter-spacing: 0.02em;
}

.badge-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #c8733a;
  animation: pulse-dot 2s infinite;
}

@keyframes pulse-dot {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.5;
    transform: scale(0.8);
  }
}

.hero-title {
  font-family: 'Fraunces', serif;
  font-size: clamp(48px, 8vw, 80px);
  font-weight: 800;
  line-height: 1.05;
  letter-spacing: -2px;
  color: #1c1917;
}

.hero-title em {
  font-style: italic;
  color: #c8733a;
}

.hero-body {
  font-size: 18px;
  color: #6b6460;
  line-height: 1.65;
  max-width: 520px;
}

.hero-actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.btn-hero {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 16px 28px;
  background: #1c1917;
  color: white;
  font-family: 'DM Sans', sans-serif;
  font-size: 15px;
  font-weight: 600;
  text-decoration: none;
  border-radius: 12px;
  transition:
    background 0.15s,
    transform 0.15s;
  box-shadow: 0 4px 20px rgba(28, 25, 23, 0.2);
}

.btn-hero:hover {
  background: #2d2421;
  transform: translateY(-1px);
  box-shadow: 0 6px 24px rgba(28, 25, 23, 0.25);
}

.btn-arrow {
  font-size: 18px;
  transition: transform 0.15s;
}

.btn-hero:hover .btn-arrow {
  transform: translateX(3px);
}

.hero-note {
  font-size: 13px;
  color: #9e9087;
}

/* Hero visual */
.hero-visual {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: center;
  margin-top: 12px;
}

.flow-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 16px 20px;
  background: white;
  border: 1px solid #e8e2da;
  border-radius: 14px;
  min-width: 100px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  animation: floatIn 0.5s ease both;
  animation-delay: calc(var(--i, 0) * 0.1s);
}

@keyframes floatIn {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.flow-icon {
  font-size: 24px;
}

.flow-label {
  font-size: 12px;
  font-weight: 600;
  color: #4a4440;
  text-align: center;
  white-space: nowrap;
}

.flow-arrow {
  font-size: 18px;
  color: #c8733a;
  font-weight: 700;
}

/* ── Proof strip ──────────────────────────────────── */
.proof-strip {
  background: #1c1917;
  padding: 16px 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  flex-wrap: wrap;
}

.proof-text {
  font-size: 13px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.5);
  letter-spacing: 0.02em;
}

.proof-dots {
  display: flex;
  gap: 6px;
}

.proof-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #c8733a;
  opacity: 0.4;
}

.proof-dot:nth-child(3) {
  opacity: 0.8;
}
.proof-dot:nth-child(4) {
  opacity: 0.6;
}

/* ── Sections ─────────────────────────────────────── */
.section {
  padding: 96px 24px;
}

.section-dark {
  background: #1c1917;
}

.section-warm {
  background: #fdf8f3;
}

.section-inner {
  max-width: 1100px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 48px;
}

.section-inner-narrow {
  max-width: 700px;
}

.section-label {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #c8733a;
  background: rgba(200, 115, 58, 0.1);
  padding: 4px 12px;
  border-radius: 99px;
  border: 1px solid rgba(200, 115, 58, 0.2);
}

.section-label.light {
  background: rgba(200, 115, 58, 0.15);
  border-color: rgba(200, 115, 58, 0.3);
}

.section-title {
  font-family: 'Fraunces', serif;
  font-size: clamp(32px, 5vw, 52px);
  font-weight: 700;
  letter-spacing: -1.5px;
  color: #1c1917;
  text-align: center;
  line-height: 1.1;
}

.section-title.light {
  color: #faf8f5;
}

.section-subtitle {
  font-size: 16px;
  color: #6b6460;
  text-align: center;
  margin-top: -24px;
}

/* ── Features grid ───────────────────────────────── */
.features-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  width: 100%;
}

.feature-card {
  background: white;
  border: 1px solid #e8e2da;
  border-radius: 16px;
  padding: 28px 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  transition:
    border-color 0.2s,
    transform 0.2s,
    box-shadow 0.2s;
}

.feature-card:hover {
  border-color: #c8733a;
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.07);
}

.feature-icon {
  font-size: 28px;
}

.feature-title {
  font-family: 'Fraunces', serif;
  font-size: 18px;
  font-weight: 700;
  color: #1c1917;
  letter-spacing: -0.3px;
}

.feature-body {
  font-size: 14px;
  color: #6b6460;
  line-height: 1.6;
}

/* ── Steps ───────────────────────────────────────── */
.steps-list {
  display: flex;
  flex-direction: column;
  gap: 0;
  width: 100%;
  max-width: 700px;
}

.step {
  display: grid;
  grid-template-columns: 56px 1fr 56px;
  align-items: center;
  gap: 24px;
  padding: 28px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.07);
}

.step:last-child {
  border-bottom: none;
}

.step-number {
  font-family: 'Fraunces', serif;
  font-size: 36px;
  font-weight: 800;
  color: rgba(200, 115, 58, 0.4);
  letter-spacing: -2px;
  line-height: 1;
}

.step-title {
  font-family: 'Fraunces', serif;
  font-size: 20px;
  font-weight: 700;
  color: #faf8f5;
  letter-spacing: -0.3px;
  margin-bottom: 6px;
}

.step-body {
  font-size: 14px;
  color: rgba(250, 248, 245, 0.55);
  line-height: 1.6;
}

.step-icon {
  font-size: 28px;
  text-align: center;
}

/* ── Roles grid ──────────────────────────────────── */
.roles-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  width: 100%;
}

.role-card {
  background: white;
  border: 1px solid #e8e2da;
  border-radius: 14px;
  padding: 22px 18px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.role-header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.role-icon {
  font-size: 22px;
}

.role-name {
  font-family: 'Fraunces', serif;
  font-size: 17px;
  font-weight: 700;
  color: #1c1917;
}

.role-perks {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.role-perks li {
  font-size: 13px;
  color: #6b6460;
  line-height: 1.4;
  padding-left: 14px;
  position: relative;
}

.role-perks li::before {
  content: '·';
  position: absolute;
  left: 0;
  color: #c8733a;
  font-weight: 700;
}

/* ── Pricing ─────────────────────────────────────── */
.pricing-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  max-width: 700px;
  width: 100%;
}

.pricing-card {
  background: white;
  border: 1.5px solid #e8e2da;
  border-radius: 16px;
  padding: 32px 28px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  position: relative;
}

.pricing-card-featured {
  background: #1c1917;
  border-color: #1c1917;
}

.pricing-badge {
  position: absolute;
  top: -12px;
  left: 50%;
  transform: translateX(-50%);
  background: #c8733a;
  color: white;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 4px 14px;
  border-radius: 99px;
  white-space: nowrap;
}

.pricing-name {
  font-family: 'Fraunces', serif;
  font-size: 20px;
  font-weight: 700;
  color: #1c1917;
}

.pricing-card-featured .pricing-name {
  color: #faf8f5;
}

.pricing-price {
  display: flex;
  align-items: baseline;
  gap: 2px;
  line-height: 1;
}

.price-currency {
  font-size: 20px;
  font-weight: 600;
  color: #4a4440;
  margin-top: 4px;
}

.pricing-card-featured .price-currency {
  color: rgba(250, 248, 245, 0.6);
}

.price-num {
  font-family: 'Fraunces', serif;
  font-size: 48px;
  font-weight: 800;
  color: #1c1917;
  letter-spacing: -2px;
}

.pricing-card-featured .price-num {
  color: #faf8f5;
}

.price-period {
  font-size: 14px;
  color: #9e9087;
  margin-left: 4px;
}

.pricing-card-featured .price-period {
  color: rgba(250, 248, 245, 0.4);
}

.pricing-desc {
  font-size: 13.5px;
  color: #6b6460;
  line-height: 1.55;
}

.pricing-card-featured .pricing-desc {
  color: rgba(250, 248, 245, 0.55);
}

.pricing-features {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
}

.pricing-features li {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13.5px;
  color: #4a4440;
}

.pricing-card-featured .pricing-features li {
  color: rgba(250, 248, 245, 0.75);
}

.check {
  color: #c8733a;
  font-weight: 700;
  flex-shrink: 0;
}

.pricing-btn {
  display: block;
  text-align: center;
  padding: 13px 20px;
  border-radius: 10px;
  font-family: 'DM Sans', sans-serif;
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.15s;
}

.pricing-btn-secondary {
  background: #1c1917;
  color: white;
}

.pricing-btn-secondary:hover {
  background: #2d2421;
}

.pricing-btn-primary {
  background: #c8733a;
  color: white;
}

.pricing-btn-primary:hover {
  background: #b5622e;
}

.pricing-note {
  font-size: 14px;
  color: #9e9087;
  text-align: center;
}

.pricing-contact {
  color: #c8733a;
  text-decoration: none;
  font-weight: 600;
}

.pricing-contact:hover {
  text-decoration: underline;
}

/* ── FAQ ─────────────────────────────────────────── */
.faq-list {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0;
}

.faq-item {
  border-bottom: 1px solid #e8e2da;
  cursor: pointer;
  transition: background 0.15s;
  padding: 20px 4px;
}

.faq-item:first-child {
  border-top: 1px solid #e8e2da;
}

.faq-question {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  font-size: 15px;
  font-weight: 600;
  color: #1c1917;
  line-height: 1.4;
  user-select: none;
}

.faq-chevron {
  font-size: 20px;
  font-weight: 400;
  color: #c8733a;
  flex-shrink: 0;
  line-height: 1;
}

.faq-answer {
  font-size: 14px;
  color: #6b6460;
  line-height: 1.65;
  padding-top: 12px;
}

/* ── Final CTA ───────────────────────────────────── */
.cta-section {
  background: #1c1917;
  padding: 96px 24px;
  text-align: center;
  position: relative;
  overflow: hidden;
}

.cta-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.cta-blob {
  position: absolute;
  width: 600px;
  height: 400px;
  background: radial-gradient(ellipse, rgba(200, 115, 58, 0.15), transparent 70%);
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  filter: blur(60px);
}

.cta-inner {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  max-width: 560px;
  margin: 0 auto;
}

.cta-title {
  font-family: 'Fraunces', serif;
  font-size: clamp(36px, 6vw, 60px);
  font-weight: 800;
  letter-spacing: -2px;
  color: #faf8f5;
  line-height: 1.05;
}

.cta-body {
  font-size: 16px;
  color: rgba(250, 248, 245, 0.55);
  line-height: 1.6;
}

/* ── Footer ──────────────────────────────────────── */
.footer {
  background: #f5f3ef;
  border-top: 1px solid #e8e2da;
  padding: 32px 24px;
}

.footer-inner {
  max-width: 1100px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  gap: 32px;
  flex-wrap: wrap;
}

.footer-logo {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.footer-links {
  display: flex;
  gap: 24px;
  flex: 1;
  flex-wrap: wrap;
}

.footer-link {
  font-size: 13px;
  color: #9e9087;
  text-decoration: none;
  transition: color 0.15s;
}

.footer-link:hover {
  color: #1c1917;
}

.footer-copy {
  font-size: 12px;
  color: #b5a99f;
  flex-shrink: 0;
}

/* ── Responsive ──────────────────────────────────── */
@media (max-width: 900px) {
  .features-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .roles-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .nav-links {
    display: none;
  }
  .nav-actions {
    display: none;
  }
  .nav-mobile-btn {
    display: flex;
  }
}

@media (max-width: 600px) {
  .hero {
    padding: 120px 20px 72px;
  }
  .features-grid {
    grid-template-columns: 1fr;
  }
  .roles-grid {
    grid-template-columns: 1fr 1fr;
  }
  .pricing-grid {
    grid-template-columns: 1fr;
  }
  .step {
    grid-template-columns: 40px 1fr 40px;
    gap: 16px;
  }
  .flow-step {
    min-width: 80px;
    padding: 12px 14px;
  }
  .flow-arrow {
    display: none;
  }
  .footer-inner {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
}
</style>
