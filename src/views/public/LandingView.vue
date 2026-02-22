<template>
  <div class="landing">
    <!-- Noise overlay -->
    <div class="noise fixed inset-0 z-0 pointer-events-none opacity-45" />

    <!-- ── Nav ─────────────────────────────────────── -->
    <nav class="nav" :class="{ scrolled: scrolled }">
      <div class="nav-inner">
        <div class="nav-logo">
          <span style="font-size: 20px">🍽️</span>
          <span class="logo-text">
            <span class="logo-white">Qrder</span><span class="logo-orange">OS</span>
          </span>
        </div>
        <div class="nav-links">
          <a href="#features" class="nav-link" @click.prevent="scrollTo('features')">Features</a>
          <a href="#how-it-works" class="nav-link" @click.prevent="scrollTo('how-it-works')"
            >How it works</a
          >
          <a href="#pricing" class="nav-link" @click.prevent="scrollTo('pricing')">Pricing</a>
        </div>
        <div class="nav-actions">
          <RouterLink to="/login" class="btn-ghost">Login</RouterLink>
          <RouterLink to="/signup" class="btn-pill">Get Started</RouterLink>
        </div>
        <button class="nav-mobile-btn" @click="mobileMenuOpen = !mobileMenuOpen">
          <svg
            v-if="!mobileMenuOpen"
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
          >
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
          <svg
            v-else
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
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
        <RouterLink to="/login" class="mobile-link">Login</RouterLink>
        <RouterLink to="/signup" class="btn-pill mobile-cta">Get Started</RouterLink>
      </div>
    </nav>

    <!-- ── Hero ─────────────────────────────────────── -->
    <section class="hero">
      <div class="hero-bg-img" />
      <div class="hero-overlay" />
      <div class="hero-inner">
        <!-- Left -->
        <div class="hero-left">
          <div class="badge">
            <span class="badge-dot" />
            No app download required
          </div>
          <h1 class="hero-title">Your restaurant,<br /><em>fully digital.</em></h1>
          <p class="hero-body">
            QR ordering, live kitchen display, staff dashboards — all in one platform built for
            modern restaurants.
          </p>
          <div class="hero-actions">
            <RouterLink to="/signup" class="btn-pill btn-lg">
              Start free trial
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </RouterLink>
            <a href="#how-it-works" class="btn-ghost-lg" @click.prevent="scrollTo('how-it-works')"
              >See how it works</a
            >
          </div>
          <p class="microcopy">No setup fees. Cancel anytime.</p>
        </div>

        <!-- Right — Order card -->
        <div class="hero-right">
          <div class="order-card">
            <div class="order-card-header">
              <span class="order-table">Table 4</span>
              <div class="order-live"><span class="live-dot" />Live</div>
            </div>
            <div class="order-items">
              <div class="order-item" v-for="item in orderItems" :key="item.name">
                <div class="order-item-left">
                  <span class="item-qty">{{ item.qty }}×</span>
                  <span class="item-name">{{ item.name }}</span>
                </div>
                <span class="item-price">{{ item.price }}</span>
              </div>
            </div>
            <div class="divider" />
            <div class="order-total">
              <span>Total</span>
              <span class="total-amount">$34.50</span>
            </div>
            <button class="btn-place-order">
              Place Order
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 01-8 0" />
              </svg>
            </button>
            <p class="order-note">Powered by RestaurantOS QR</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ── How It Works ───────────────────────────────── -->
    <section class="section" id="how-it-works">
      <div class="section-inner">
        <span class="section-label">How it works</span>
        <h2 class="section-title">Three steps to a smoother service</h2>
        <div class="steps-grid">
          <div class="step-card" v-for="step in steps" :key="step.num">
            <div class="step-icon-wrap" v-html="step.icon" />
            <div class="step-num">{{ step.num }}</div>
            <h3 class="step-title">{{ step.title }}</h3>
            <p class="step-body">{{ step.body }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ── Feature: QR Ordering ───────────────────────── -->
    <section class="section section-elevated" id="features">
      <div class="section-inner">
        <div class="feature-row">
          <div class="feature-text">
            <span class="section-label">QR Ordering</span>
            <h2 class="section-title text-left">Orders without the wait</h2>
            <p class="feature-desc">
              Each table gets a unique QR code. Customers scan, browse your full menu, and place
              orders directly — no app, no account, no friction.
            </p>
            <ul class="feature-list">
              <li v-for="p in qrPoints" :key="p"><span class="check-icon">✓</span>{{ p }}</li>
            </ul>
            <RouterLink to="/signup" class="btn-pill">Get Started →</RouterLink>
          </div>
          <div class="feature-mockup">
            <div class="phone-mockup">
              <div class="phone-header">
                <span class="phone-dot" /><span class="phone-dot" /><span class="phone-dot" />
              </div>
              <div class="phone-body">
                <div class="phone-restaurant">🍽️ Bella Italia</div>
                <span class="phone-table-tag">Table 7</span>
                <div class="phone-cats">
                  <span class="cat active">All</span>
                  <span class="cat">Starters</span>
                  <span class="cat">Mains</span>
                  <span class="cat">Drinks</span>
                </div>
                <div class="phone-item" v-for="item in phoneItems" :key="item.name">
                  <div>
                    <div class="phone-item-name">{{ item.name }}</div>
                    <div class="phone-item-price">{{ item.price }}</div>
                  </div>
                  <button class="phone-add-btn">
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2.5"
                      stroke-linecap="round"
                    >
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ── Feature: Kitchen Display ───────────────────── -->
    <section class="section">
      <div class="section-inner">
        <div class="feature-row reverse">
          <div class="feature-mockup">
            <div class="kd-card">
              <div class="kd-header">
                <span class="kd-title">
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="var(--color-accent)"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 002-2V2" />
                    <path d="M7 2v20" />
                    <path d="M21 15V2" />
                    <circle cx="18" cy="18" r="3" />
                  </svg>
                  Kitchen Display
                </span>
                <span class="kd-count">4 Active</span>
              </div>
              <div class="kd-body">
                <div v-for="o in kitchenOrders" :key="o.table" class="kd-order" :class="o.status">
                  <div class="kd-order-top">
                    <span class="kd-table">{{ o.table }}</span>
                    <span class="kd-time">{{ o.time }}</span>
                  </div>
                  <p class="kd-items">{{ o.items }}</p>
                  <div>
                    <button v-if="o.status === 'new'" class="kd-btn accept">Accept</button>
                    <button v-if="o.status === 'cooking'" class="kd-btn ready">Mark Ready</button>
                    <span v-if="o.status === 'done'" class="kd-done">✓ Done</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="feature-text">
            <span class="section-label">Kitchen Display</span>
            <h2 class="section-title text-left">Real-time kitchen sync</h2>
            <p class="feature-desc">
              Orders appear instantly on the kitchen screen. Accept, cook, mark ready — the whole
              team stays in sync without a single call or paper ticket.
            </p>
            <ul class="feature-list">
              <li v-for="p in kitchenPoints" :key="p"><span class="check-icon">✓</span>{{ p }}</li>
            </ul>
            <RouterLink to="/signup" class="btn-pill">Get Started →</RouterLink>
          </div>
        </div>
      </div>
    </section>

    <!-- ── Feature: Analytics ─────────────────────────── -->
    <section class="section section-elevated">
      <div class="section-inner">
        <div class="feature-row">
          <div class="feature-text">
            <span class="section-label">Analytics</span>
            <h2 class="section-title text-left">Know your numbers</h2>
            <p class="feature-desc">
              Revenue charts, top-selling items, order volume by hour — everything you need to make
              smarter decisions, all in one dashboard.
            </p>
            <ul class="feature-list">
              <li v-for="p in analyticsPoints" :key="p">
                <span class="check-icon">✓</span>{{ p }}
              </li>
            </ul>
            <RouterLink to="/signup" class="btn-pill">Get Started →</RouterLink>
          </div>
          <div class="feature-mockup">
            <div class="analytics-card">
              <div class="analytics-header">
                <span class="analytics-label">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="var(--color-accent)"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                    <polyline points="17 6 23 6 23 12" />
                  </svg>
                  Today's Revenue
                </span>
                <span class="live-badge">Live</span>
              </div>
              <div class="analytics-big">$2,841</div>
              <div class="analytics-delta">↑ 18% vs yesterday</div>
              <div class="chart">
                <div class="chart-bars">
                  <div
                    v-for="(h, i) in chartBars"
                    :key="i"
                    class="chart-bar"
                    :class="{ active: i === chartBars.length - 1 }"
                    :style="{ height: h + '%' }"
                  />
                </div>
                <div class="chart-labels">
                  <span v-for="l in chartLabels" :key="l">{{ l }}</span>
                </div>
              </div>
              <div class="analytics-stats">
                <div v-for="s in analyticsStats" :key="s.label" class="stat">
                  <div class="stat-val">{{ s.value }}</div>
                  <div class="stat-lbl">{{ s.label }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ── Testimonials ───────────────────────────────── -->
    <section class="section">
      <div class="section-inner">
        <span class="section-label">Testimonials</span>
        <h2 class="section-title">Loved by restaurants</h2>
        <div class="testimonials-grid">
          <div class="t-card" v-for="t in testimonials" :key="t.name">
            <div class="t-stars">
              <svg
                v-for="n in 5"
                :key="n"
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="var(--color-accent)"
                stroke="none"
              >
                <polygon
                  points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
                />
              </svg>
            </div>
            <p class="t-quote">"{{ t.quote }}"</p>
            <div class="t-author">
              <div class="t-avatar">{{ t.initials }}</div>
              <div>
                <div class="t-name">{{ t.name }}</div>
                <div class="t-role">{{ t.role }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ── Pricing ────────────────────────────────────── -->
    <section class="section section-elevated" id="pricing">
      <div class="section-inner">
        <span class="section-label">Pricing</span>
        <h2 class="section-title">Simple, honest pricing</h2>
        <p class="section-subtitle">14-day free trial on all plans. No credit card required.</p>
        <div class="pricing-grid">
          <div class="pricing-card">
            <div class="pricing-name">Starter</div>
            <div class="pricing-price">
              <span class="price-dollar">$</span>
              <span class="price-num">29</span>
              <span class="price-period">/mo</span>
            </div>
            <p class="pricing-desc">Perfect for small restaurants getting started.</p>
            <ul class="pricing-features">
              <li v-for="f in starterFeatures" :key="f">
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--color-accent)"
                  stroke-width="2.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                {{ f }}
              </li>
            </ul>
            <RouterLink to="/signup" class="pricing-btn secondary">Start free trial</RouterLink>
          </div>
          <div class="pricing-card featured">
            <div class="pricing-badge">Recommended</div>
            <div class="pricing-name">Pro</div>
            <div class="pricing-price">
              <span class="price-dollar">$</span>
              <span class="price-num">69</span>
              <span class="price-period">/mo</span>
            </div>
            <p class="pricing-desc">For restaurants running their full operation digitally.</p>
            <ul class="pricing-features">
              <li v-for="f in proFeatures" :key="f">
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--color-accent)"
                  stroke-width="2.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                {{ f }}
              </li>
            </ul>
            <RouterLink to="/signup" class="pricing-btn primary">Start free trial</RouterLink>
          </div>
        </div>
      </div>
    </section>

    <!-- ── FAQ ───────────────────────────────────────── -->
    <section class="section" id="faq">
      <div class="section-inner section-inner-narrow">
        <span class="section-label">FAQ</span>
        <h2 class="section-title">Common questions</h2>
        <div class="faq-list">
          <div
            v-for="(item, i) in faq"
            :key="i"
            class="faq-item"
            :class="{ open: openFaq === i }"
            @click="openFaq = openFaq === i ? null : i"
          >
            <div class="faq-q">
              <span>{{ item.q }}</span>
              <svg
                v-if="openFaq !== i"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <svg
                v-else
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--color-accent)"
                stroke-width="2"
                stroke-linecap="round"
              >
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </div>
            <div class="faq-a" v-show="openFaq === i">{{ item.a }}</div>
          </div>
        </div>
      </div>
    </section>

    <!-- ── Final CTA ──────────────────────────────────── -->
    <section class="cta-section">
      <div class="cta-glow" />
      <div class="cta-panel">
        <h2 class="cta-title">Ready to simplify service?</h2>
        <p class="cta-body">Start your 14-day free trial. Setup takes under 10 minutes.</p>
        <div class="cta-actions">
          <RouterLink to="/signup" class="btn-pill btn-lg">
            Create your account
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </RouterLink>
          <RouterLink to="/login" class="btn-ghost-lg">Sign in instead</RouterLink>
        </div>
        <p class="cta-micro">No credit card required · Cancel anytime</p>
      </div>
    </section>

    <!-- ── Footer ─────────────────────────────────────── -->
    <footer class="footer">
      <div class="footer-inner">
        <div class="footer-logo">
          <span>🍽️</span>
          <span class="logo-white">Qrder</span><span class="logo-orange">OS</span>
        </div>
        <div class="footer-links">
          <a href="#features" @click.prevent="scrollTo('features')" class="footer-link">Features</a>
          <a href="#how-it-works" @click.prevent="scrollTo('how-it-works')" class="footer-link"
            >How it works</a
          >
          <a href="#pricing" @click.prevent="scrollTo('pricing')" class="footer-link">Pricing</a>
          <RouterLink to="/login" class="footer-link">Login</RouterLink>
          <RouterLink to="/signup" class="footer-link">Sign up</RouterLink>
        </div>
        <div class="footer-copy">
          © {{ new Date().getFullYear() }} QrderOS. All rights reserved.
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
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
onMounted(() => window.addEventListener('scroll', handleScroll))
onUnmounted(() => window.removeEventListener('scroll', handleScroll))

// ── Data ──────────────────────────────────────────────────
const orderItems = [
  { qty: 1, name: 'Nasi Goreng', price: '$12.00' },
  { qty: 2, name: 'Teh Tarik', price: '$5.00' },
  { qty: 1, name: 'Satay Chicken', price: '$14.50' },
  { qty: 1, name: 'Roti Canai', price: '$3.00' },
]

const steps = [
  {
    num: '01',
    title: 'Scan',
    body: 'Customers scan the QR on their table — no app, no login, just a browser.',
    icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="3" height="3"/><rect x="18" y="18" width="3" height="3"/></svg>`,
  },
  {
    num: '02',
    title: 'Order',
    body: 'They browse your menu and place orders. It hits the kitchen instantly.',
    icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>`,
  },
  {
    num: '03',
    title: 'Enjoy',
    body: 'Kitchen prepares, marks ready, cashier closes the tab. End-to-end seamless.',
    icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
  },
]

const qrPoints = [
  'No app download needed',
  'Works on any smartphone browser',
  'Custom branding per restaurant',
  'Toggle item availability in real-time',
]
const kitchenPoints = [
  'Instant order notifications',
  'Audio ping on new orders',
  'Accept, reject, or mark ready',
  'Large-text view for busy kitchens',
]
const analyticsPoints = [
  'Real-time revenue tracking',
  'Top-selling items at a glance',
  'Order volume by hour',
  'Export reports anytime',
]

const phoneItems = [
  { name: 'Grilled Salmon', price: '$18.00' },
  { name: 'Caesar Salad', price: '$11.00' },
  { name: 'Sparkling Water', price: '$3.50' },
]

const kitchenOrders = [
  { table: 'Table 2', time: '2 min', items: 'Beef Rendang × 1, Rice × 2', status: 'new' },
  { table: 'Table 5', time: '8 min', items: 'Laksa × 2, Teh Tarik × 2', status: 'cooking' },
  { table: 'Table 1', time: '15 min', items: 'Nasi Lemak × 3', status: 'done' },
]

const chartBars = [32, 48, 41, 60, 55, 70, 65, 80, 75, 90, 85, 100]
const chartLabels = ['9am', '11am', '1pm', '3pm', '5pm', '7pm']

const analyticsStats = [
  { value: '142', label: 'Orders today' },
  { value: '$20.0', label: 'Avg. order' },
  { value: '94%', label: 'Completion' },
]

const testimonials = [
  {
    quote:
      'RestaurantOS completely changed how our floor runs. Orders go straight to the kitchen and our staff can actually focus on guests instead of running paper tickets.',
    name: 'Amirah Yusof',
    role: 'Owner, Warung Amirah — KL',
    initials: 'AY',
  },
  {
    quote:
      'Setup was unbelievably fast. We were live within an hour. The kitchen display alone saved us from so much miscommunication during peak hours.',
    name: 'Benny Tan',
    role: 'F&B Manager, Spice Garden — SG',
    initials: 'BT',
  },
]

const starterFeatures = [
  'Up to 15 tables',
  'Up to 3 staff accounts',
  'Unlimited orders',
  'QR code ordering',
  'Kitchen & cashier views',
  'Menu management',
  // 'Email support',
]
const proFeatures = [
  'Unlimited tables',
  'Up to 10 staff accounts',
  'Unlimited orders',
  'QR code ordering',
  'All staff role views',
  'Menu management',
  'Analytics & charts',
  'Promotions & discounts',
  // 'Priority support',
]

const faq = [
  {
    q: 'Do customers need to download an app?',
    a: 'No. The ordering page is a regular website that opens directly in the browser when a customer scans the QR code. No app store, no account, no friction.',
  },
  {
    q: 'How does the kitchen receive orders?',
    a: "Orders appear on the kitchen screen in real-time using Supabase Realtime. There's no polling or page refresh needed — it updates the moment a customer submits.",
  },
  {
    q: 'Can I use it on a tablet or phone?',
    a: 'Yes. The kitchen and cashier views are optimized for mobile and tablet. The admin dashboard works great on desktop.',
  },
  {
    q: 'What happens when my trial ends?',
    a: "You'll see an upgrade prompt but your data is never deleted — it's all there when you subscribe.",
  },
  {
    q: 'Can I manage multiple locations?',
    a: 'Multi-branch support is on the roadmap. For now each location needs its own account. Get in touch for custom arrangements.',
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Yes. Cancel from the Settings page at any time. No lock-in contracts, no cancellation fees.',
  },
]
</script>

<style scoped>
/*
  All color, font, spacing, radius, and shadow values come from
  CSS custom properties defined in src/assets/main.css @theme.
  Nothing is hard-coded here — change the token, change everything.
*/

/* ── Nav ──────────────────────────────────────────────── */
.nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  padding: 0 40px;
  transition:
    background 0.25s,
    box-shadow 0.25s;
}
.nav.scrolled {
  background: color-mix(in srgb, var(--color-bg-base) 94%, transparent);
  backdrop-filter: blur(14px);
  box-shadow: 0 1px 0 var(--color-border-subtle);
}
.nav-inner {
  max-width: var(--width-layout);
  margin: 0 auto;
  height: 72px;
  display: flex;
  align-items: center;
  gap: 32px;
}
.nav-logo {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}
.logo-text {
  display: flex;
}
.logo-white {
  font-family: var(--font-display);
  font-size: 18px;
  font-weight: 700;
  color: var(--color-text-primary);
  letter-spacing: -0.3px;
}
.logo-orange {
  font-family: var(--font-display);
  font-size: 18px;
  font-weight: 700;
  color: var(--color-accent);
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
  color: var(--color-text-muted);
  text-decoration: none;
  transition: color 0.15s;
}
.nav-link:hover {
  color: var(--color-text-primary);
}
.nav-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

/* ── Buttons ──────────────────────────────────────────── */
.btn-ghost {
  font-family: var(--font-body);
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-secondary);
  text-decoration: none;
  padding: 8px 16px;
  border-radius: var(--radius-pill);
  transition: all 0.15s;
}
.btn-ghost:hover {
  color: var(--color-text-primary);
  background: var(--color-border-subtle);
}

.btn-pill {
  font-family: var(--font-body);
  font-size: 14px;
  font-weight: 600;
  color: #fff;
  background: var(--color-accent);
  text-decoration: none;
  padding: 9px 20px;
  border-radius: var(--radius-pill);
  display: inline-flex;
  align-items: center;
  gap: 7px;
  transition: all 0.18s;
  border: none;
  cursor: pointer;
}
.btn-pill:hover {
  background: var(--color-accent-hover);
  transform: translateY(-2px) scale(1.02);
  box-shadow: var(--shadow-glow);
}
.btn-lg {
  font-size: 15px;
  padding: 13px 26px;
}

.btn-ghost-lg {
  font-family: var(--font-body);
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text-muted);
  text-decoration: none;
  padding: 13px 24px;
  border-radius: var(--radius-pill);
  border: 1.5px solid var(--color-border-medium);
  display: inline-flex;
  align-items: center;
  gap: 7px;
  transition: all 0.18s;
}
.btn-ghost-lg:hover {
  color: var(--color-text-primary);
  border-color: var(--color-border-bright);
  transform: translateY(-2px);
}

.nav-mobile-btn {
  display: none;
  background: none;
  border: none;
  color: var(--color-text-muted);
  cursor: pointer;
  margin-left: auto;
  padding: 4px;
}
.nav-mobile-btn:hover {
  color: var(--color-text-primary);
}
.mobile-menu {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px 0 20px;
  border-top: 1px solid var(--color-border-subtle);
  background: color-mix(in srgb, var(--color-bg-base) 97%, transparent);
}
.mobile-link {
  font-size: 15px;
  font-weight: 500;
  color: var(--color-text-secondary);
  text-decoration: none;
  padding: 10px 4px;
  transition: color 0.15s;
}
.mobile-link:hover {
  color: var(--color-text-primary);
}
.mobile-cta {
  margin-top: 8px;
  text-align: center;
}

/* ── Hero ─────────────────────────────────────────────── */
.hero {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  overflow: hidden;
}
.hero-bg-img {
  position: absolute;
  inset: 0;
  z-index: 0;
  background: url('https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1600&q=80')
    center/cover no-repeat;
  filter: brightness(0.35);
}
.hero-overlay {
  position: absolute;
  inset: 0;
  z-index: 1;
  background: linear-gradient(
    to right,
    color-mix(in srgb, var(--color-bg-base) 97%, transparent) 35%,
    color-mix(in srgb, var(--color-bg-base) 70%, transparent) 60%,
    color-mix(in srgb, var(--color-bg-base) 15%, transparent) 100%
  );
}
.hero-inner {
  position: relative;
  z-index: 2;
  max-width: var(--width-layout);
  margin: 0 auto;
  padding: 120px 40px 80px;
  width: 100%;
  display: flex;
  align-items: center;
  gap: 60px;
}
.hero-left {
  flex: 0 0 46%;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  width: fit-content;
  padding: 6px 14px;
  border-radius: var(--radius-pill);
  background: var(--color-accent-muted);
  border: 1px solid var(--color-accent-border);
  font-size: 12.5px;
  font-weight: 600;
  color: var(--color-accent);
}
.badge-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--color-accent);
  animation: var(--animate-pulse-dot);
}

.hero-title {
  font-family: var(--font-display);
  font-size: clamp(44px, 6vw, 72px);
  font-weight: 800;
  line-height: 1.05;
  letter-spacing: -0.04em;
  color: var(--color-text-primary);
}
.hero-title em {
  font-style: italic;
  color: var(--color-accent);
}
.hero-body {
  font-size: 17px;
  color: var(--color-text-secondary);
  line-height: 1.65;
  max-width: 420px;
}
.hero-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
.microcopy {
  font-size: 13px;
  color: var(--color-text-faint);
}

/* Order card */
.hero-right {
  flex: 1;
  display: flex;
  justify-content: center;
}
.order-card {
  background: var(--color-bg-surface);
  border: 1.5px solid var(--color-border-subtle);
  border-radius: var(--radius-panel);
  padding: 24px;
  width: 100%;
  max-width: 340px;
  box-shadow: var(--shadow-float);
  display: flex;
  flex-direction: column;
  gap: 16px;
  animation: var(--animate-float-card);
}
.order-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.order-table {
  font-family: var(--font-display);
  font-size: 18px;
  font-weight: 700;
  color: var(--color-text-primary);
}
.order-live {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-muted);
}
.live-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--color-status-success);
  animation: var(--animate-pulse-dot);
}
.order-items {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.order-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.order-item-left {
  display: flex;
  align-items: center;
  gap: 8px;
}
.item-qty {
  font-size: 13px;
  font-weight: 700;
  color: var(--color-accent);
  min-width: 22px;
}
.item-name {
  font-size: 14px;
  color: var(--color-text-secondary);
}
.item-price {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-muted);
}
.divider {
  height: 1px;
  background: var(--color-border-subtle);
}
.order-total {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-muted);
}
.total-amount {
  font-size: 18px;
  font-weight: 700;
  color: var(--color-text-primary);
}
.btn-place-order {
  width: 100%;
  background: var(--color-accent);
  color: #fff;
  border: none;
  padding: 13px 20px;
  border-radius: var(--radius-pill);
  font-family: var(--font-body);
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.18s;
}
.btn-place-order:hover {
  background: var(--color-accent-hover);
  transform: translateY(-1px);
}
.order-note {
  text-align: center;
  font-size: 11px;
  color: var(--color-text-faint);
}

/* ── Sections ─────────────────────────────────────────── */
.section {
  padding: 96px 40px;
  position: relative;
  z-index: 2;
}
.section-elevated {
  background: var(--color-bg-elevated);
}
.section-inner {
  max-width: var(--width-layout);
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 48px;
}
.section-inner-narrow {
  max-width: var(--width-narrow);
}

.section-label {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--color-accent);
  background: var(--color-accent-muted);
  padding: 5px 14px;
  border-radius: var(--radius-pill);
  border: 1px solid var(--color-accent-border);
}
.section-title {
  font-family: var(--font-display);
  font-size: clamp(30px, 4.5vw, 50px);
  font-weight: 700;
  letter-spacing: -0.03em;
  color: var(--color-text-primary);
  text-align: center;
  line-height: 1.1;
}
.section-title.text-left {
  text-align: left;
}
.section-subtitle {
  font-size: 16px;
  color: var(--color-text-muted);
  text-align: center;
  margin-top: -24px;
}

/* ── Steps ────────────────────────────────────────────── */
.steps-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  width: 100%;
}
.step-card {
  background: var(--color-bg-surface);
  border: 1.5px solid var(--color-border-subtle);
  border-radius: var(--radius-card);
  padding: 32px 26px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  transition:
    border-color 0.2s,
    transform 0.2s,
    box-shadow 0.2s;
}
.step-card:hover {
  border-color: var(--color-accent-border-strong);
  transform: translateY(-3px);
  box-shadow: var(--shadow-card);
}
.step-icon-wrap {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: var(--color-accent-muted);
  border: 1px solid var(--color-accent-border);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-accent);
}
.step-num {
  font-family: var(--font-display);
  font-size: 38px;
  font-weight: 800;
  color: var(--color-accent-border-strong);
  letter-spacing: -2px;
  line-height: 1;
}
.step-title {
  font-family: var(--font-display);
  font-size: 20px;
  font-weight: 700;
  color: var(--color-text-primary);
}
.step-body {
  font-size: 14px;
  color: var(--color-text-muted);
  line-height: 1.65;
}

/* ── Feature rows ─────────────────────────────────────── */
.feature-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 64px;
  width: 100%;
  align-items: center;
}
.feature-row.reverse {
  direction: rtl;
}
.feature-row.reverse > * {
  direction: ltr;
}
.feature-text {
  display: flex;
  flex-direction: column;
  gap: 20px;
  align-items: flex-start;
}
.feature-desc {
  font-size: 15px;
  color: var(--color-text-secondary);
  line-height: 1.7;
  max-width: 420px;
}
.feature-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.feature-list li {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  color: var(--color-text-secondary);
}
.check-icon {
  color: var(--color-accent);
  font-weight: 700;
  font-size: 13px;
}
.feature-mockup {
  display: flex;
  justify-content: center;
}

/* Phone mockup */
.phone-mockup {
  background: var(--color-bg-surface);
  border: 1.5px solid var(--color-border-subtle);
  border-radius: var(--radius-phone);
  width: 100%;
  max-width: 290px;
  overflow: hidden;
  box-shadow: var(--shadow-float);
}
.phone-header {
  background: var(--color-bg-elevated);
  padding: 12px 16px;
  display: flex;
  gap: 6px;
  align-items: center;
  border-bottom: 1px solid var(--color-border-subtle);
}
.phone-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-border-medium);
}
.phone-body {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.phone-restaurant {
  font-family: var(--font-display);
  font-size: 15px;
  font-weight: 700;
  color: var(--color-text-primary);
}
.phone-table-tag {
  display: inline-block;
  font-size: 11px;
  font-weight: 700;
  color: var(--color-accent);
  background: var(--color-accent-muted);
  border: 1px solid var(--color-accent-border);
  padding: 3px 10px;
  border-radius: var(--radius-pill);
}
.phone-cats {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.cat {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-muted);
  padding: 5px 12px;
  border-radius: var(--radius-pill);
  border: 1px solid var(--color-border-subtle);
  cursor: pointer;
}
.cat.active {
  color: var(--color-text-primary);
  background: var(--color-accent-muted);
  border-color: var(--color-accent-border);
}
.phone-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid var(--color-border-subtle);
}
.phone-item:last-child {
  border-bottom: none;
}
.phone-item-name {
  font-size: 13px;
  color: var(--color-text-secondary);
  font-weight: 500;
}
.phone-item-price {
  font-size: 12px;
  color: var(--color-text-muted);
  margin-top: 2px;
}
.phone-add-btn {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--color-accent);
  border: none;
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
}
.phone-add-btn:hover {
  background: var(--color-accent-hover);
}

/* Kitchen display */
.kd-card {
  background: var(--color-bg-surface);
  border: 1.5px solid var(--color-border-subtle);
  border-radius: 14px;
  width: 100%;
  max-width: 370px;
  overflow: hidden;
  box-shadow: var(--shadow-float);
}
.kd-header {
  background: var(--color-bg-elevated);
  padding: 14px 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--color-border-subtle);
}
.kd-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 700;
  color: var(--color-text-secondary);
}
.kd-count {
  font-size: 12px;
  font-weight: 700;
  color: var(--color-accent);
  background: var(--color-accent-muted);
  padding: 3px 10px;
  border-radius: var(--radius-pill);
  border: 1px solid var(--color-accent-border);
}
.kd-body {
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.kd-order {
  background: var(--color-border-subtle);
  border: 1px solid var(--color-border-subtle);
  border-radius: 8px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.kd-order.new {
  border-color: var(--color-accent-border);
  background: var(--color-accent-muted);
}
.kd-order.cooking {
  border-color: rgba(250, 204, 21, 0.2);
  background: rgba(250, 204, 21, 0.04);
}
.kd-order.done {
  border-color: rgba(74, 222, 128, 0.18);
  opacity: 0.55;
}
.kd-order-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.kd-table {
  font-family: var(--font-display);
  font-size: 15px;
  font-weight: 700;
  color: var(--color-text-primary);
}
.kd-time {
  font-size: 11px;
  color: var(--color-text-muted);
  font-weight: 600;
}
.kd-items {
  font-size: 12px;
  color: var(--color-text-muted);
  line-height: 1.5;
}
.kd-btn {
  font-size: 12px;
  font-weight: 700;
  padding: 5px 14px;
  border-radius: var(--radius-pill);
  border: none;
  cursor: pointer;
  transition: all 0.15s;
}
.kd-btn.accept {
  background: var(--color-accent-muted);
  color: var(--color-accent);
  border: 1px solid var(--color-accent-border);
}
.kd-btn.accept:hover {
  background: var(--color-accent-border);
}
.kd-btn.ready {
  background: rgba(250, 204, 21, 0.12);
  color: var(--color-status-warning);
  border: 1px solid rgba(250, 204, 21, 0.2);
}
.kd-done {
  font-size: 12px;
  font-weight: 700;
  color: var(--color-status-success);
}

/* Analytics */
.analytics-card {
  background: var(--color-bg-surface);
  border: 1.5px solid var(--color-border-subtle);
  border-radius: var(--radius-panel);
  padding: 24px;
  width: 100%;
  max-width: 330px;
  box-shadow: var(--shadow-float);
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.analytics-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.analytics-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-muted);
}
.live-badge {
  font-size: 11px;
  font-weight: 700;
  color: var(--color-status-success);
  background: rgba(74, 222, 128, 0.1);
  padding: 3px 10px;
  border-radius: var(--radius-pill);
}
.analytics-big {
  font-family: var(--font-display);
  font-size: 42px;
  font-weight: 800;
  color: var(--color-text-primary);
  letter-spacing: -2px;
  line-height: 1;
}
.analytics-delta {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-status-success);
}
.chart {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.chart-bars {
  display: flex;
  align-items: flex-end;
  gap: 4px;
  height: 64px;
}
.chart-bar {
  flex: 1;
  background: var(--color-border-subtle);
  border-radius: 3px 3px 0 0;
  min-width: 0;
}
.chart-bar.active {
  background: var(--color-accent);
}
.chart-labels {
  display: flex;
  justify-content: space-between;
}
.chart-labels span {
  font-size: 10px;
  color: var(--color-text-faint);
}
.analytics-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  border-top: 1px solid var(--color-border-subtle);
  padding-top: 14px;
}
.stat {
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.stat-val {
  font-family: var(--font-display);
  font-size: 18px;
  font-weight: 700;
  color: var(--color-text-primary);
}
.stat-lbl {
  font-size: 11px;
  color: var(--color-text-muted);
}

/* ── Testimonials ─────────────────────────────────────── */
.testimonials-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  width: 100%;
  max-width: 800px;
}
.t-card {
  background: var(--color-bg-surface);
  border: 1.5px solid var(--color-border-subtle);
  border-radius: var(--radius-card);
  padding: 28px 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  transition:
    border-color 0.2s,
    transform 0.2s;
}
.t-card:hover {
  border-color: var(--color-accent-border-strong);
  transform: translateY(-2px);
}
.t-stars {
  display: flex;
  gap: 3px;
}
.t-quote {
  font-size: 14.5px;
  color: var(--color-text-secondary);
  line-height: 1.7;
  font-style: italic;
  flex: 1;
}
.t-author {
  display: flex;
  align-items: center;
  gap: 12px;
}
.t-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  flex-shrink: 0;
  background: var(--color-accent-muted);
  border: 1.5px solid var(--color-accent-border);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
  color: var(--color-accent);
}
.t-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
}
.t-role {
  font-size: 12px;
  color: var(--color-text-muted);
  margin-top: 2px;
}

/* ── Pricing ──────────────────────────────────────────── */
.pricing-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  max-width: var(--width-pricing);
  width: 100%;
}
.pricing-card {
  background: var(--color-bg-surface);
  border: 1.5px solid var(--color-border-subtle);
  border-radius: var(--radius-card);
  padding: 32px 28px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  position: relative;
  transition:
    border-color 0.2s,
    transform 0.2s;
}
.pricing-card:hover {
  transform: translateY(-2px);
}
.pricing-card.featured {
  border-color: var(--color-accent);
  border-width: 2px;
}
.pricing-badge {
  position: absolute;
  top: -13px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--color-accent);
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 4px 14px;
  border-radius: var(--radius-pill);
  white-space: nowrap;
}
.pricing-name {
  font-family: var(--font-display);
  font-size: 22px;
  font-weight: 700;
  color: var(--color-text-primary);
}
.pricing-price {
  display: flex;
  align-items: baseline;
  gap: 2px;
  line-height: 1;
}
.price-dollar {
  font-size: 20px;
  font-weight: 600;
  color: var(--color-text-muted);
  margin-top: 4px;
}
.price-num {
  font-family: var(--font-display);
  font-size: 52px;
  font-weight: 800;
  color: var(--color-text-primary);
  letter-spacing: -2px;
}
.price-period {
  font-size: 14px;
  color: var(--color-text-faint);
  margin-left: 4px;
}
.pricing-desc {
  font-size: 13.5px;
  color: var(--color-text-muted);
  line-height: 1.55;
}
.pricing-features {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex: 1;
}
.pricing-features li {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13.5px;
  color: var(--color-text-secondary);
}
.pricing-btn {
  display: block;
  text-align: center;
  padding: 13px 20px;
  border-radius: var(--radius-pill);
  font-family: var(--font-body);
  font-size: 14px;
  font-weight: 700;
  text-decoration: none;
  transition: all 0.18s;
  cursor: pointer;
}
.pricing-btn.secondary {
  background: var(--color-border-subtle);
  color: var(--color-text-secondary);
  border: 1.5px solid var(--color-border-medium);
}
.pricing-btn.secondary:hover {
  background: var(--color-border-medium);
  color: var(--color-text-primary);
  transform: translateY(-1px);
}
.pricing-btn.primary {
  background: var(--color-accent);
  color: #fff;
  border: none;
}
.pricing-btn.primary:hover {
  background: var(--color-accent-hover);
  transform: translateY(-2px);
  box-shadow: var(--shadow-glow);
}
.pricing-note {
  font-size: 14px;
  color: var(--color-text-muted);
  text-align: center;
}
.pricing-contact {
  color: var(--color-accent);
  text-decoration: none;
  font-weight: 600;
}
.pricing-contact:hover {
  text-decoration: underline;
}

/* ── FAQ ──────────────────────────────────────────────── */
.faq-list {
  width: 100%;
  display: flex;
  flex-direction: column;
}
.faq-item {
  border-bottom: 1px solid var(--color-border-subtle);
  cursor: pointer;
  padding: 20px 4px;
}
.faq-item:first-child {
  border-top: 1px solid var(--color-border-subtle);
}
.faq-item.open .faq-q {
  color: var(--color-accent);
}
.faq-q {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text-secondary);
  line-height: 1.4;
  user-select: none;
  transition: color 0.15s;
}
.faq-a {
  font-size: 14px;
  color: var(--color-text-muted);
  line-height: 1.7;
  padding-top: 12px;
}

/* ── CTA ──────────────────────────────────────────────── */
.cta-section {
  position: relative;
  padding: 100px 40px;
  background: var(--color-bg-elevated);
  overflow: hidden;
  z-index: 2;
  display: flex;
  justify-content: center;
  align-items: center;
}
.cta-glow {
  position: absolute;
  width: 600px;
  height: 400px;
  background: radial-gradient(ellipse, var(--color-accent-muted), transparent 70%);
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  filter: blur(60px);
  pointer-events: none;
}
.cta-panel {
  position: relative;
  z-index: 1;
  background: color-mix(in srgb, var(--color-bg-surface) 80%, transparent);
  border: 1.5px solid var(--color-border-subtle);
  border-radius: 20px;
  padding: 56px 64px;
  max-width: 600px;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  text-align: center;
  backdrop-filter: blur(10px);
}
.cta-title {
  font-family: var(--font-display);
  font-size: clamp(36px, 5vw, 56px);
  font-weight: 800;
  letter-spacing: -0.04em;
  color: var(--color-text-primary);
  line-height: 1.05;
}
.cta-body {
  font-size: 16px;
  color: var(--color-text-muted);
  line-height: 1.6;
}
.cta-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: center;
}
.cta-micro {
  font-size: 12px;
  color: var(--color-text-faint);
}

/* ── Footer ───────────────────────────────────────────── */
.footer {
  background: var(--color-bg-base);
  border-top: 1px solid var(--color-border-subtle);
  padding: 32px 40px;
  position: relative;
  z-index: 2;
}
.footer-inner {
  max-width: var(--width-layout);
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
  font-family: var(--font-display);
  font-size: 17px;
  font-weight: 700;
}
.footer-links {
  display: flex;
  gap: 24px;
  flex: 1;
  flex-wrap: wrap;
}
.footer-link {
  font-size: 13px;
  color: var(--color-text-muted);
  text-decoration: none;
  transition: color 0.15s;
}
.footer-link:hover {
  color: var(--color-text-secondary);
}
.footer-copy {
  font-size: 12px;
  color: var(--color-text-faint);
  flex-shrink: 0;
}

/* ── Responsive ───────────────────────────────────────── */
@media (max-width: 960px) {
  .nav-links,
  .nav-actions {
    display: none;
  }
  .nav-mobile-btn {
    display: flex;
  }
  .hero-inner {
    flex-direction: column;
    text-align: center;
    padding: 120px 24px 60px;
  }
  .hero-left {
    flex: none;
    align-items: center;
  }
  .hero-body,
  .feature-desc {
    text-align: center;
    max-width: 100%;
  }
  .hero-right {
    width: 100%;
  }
  .steps-grid {
    grid-template-columns: 1fr;
  }
  .feature-row,
  .feature-row.reverse {
    grid-template-columns: 1fr;
    direction: ltr;
  }
  .feature-text {
    align-items: center;
    text-align: center;
  }
  .section-title.text-left {
    text-align: center;
  }
  .testimonials-grid,
  .pricing-grid {
    grid-template-columns: 1fr;
  }
  .cta-panel {
    padding: 36px 28px;
  }
}
@media (max-width: 600px) {
  .section {
    padding: 72px 20px;
  }
  .nav {
    padding: 0 20px;
  }
  .hero-inner {
    padding: 110px 20px 60px;
  }
  .footer-inner {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
}
</style>
