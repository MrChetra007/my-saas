<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { RouterLink } from 'vue-router'

const isScrolled = ref(false)
const openFaq = ref(null)
const mobileMenuOpen = ref(false)

onMounted(() => {
  window.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})

function handleScroll() {
  isScrolled.value = window.scrollY > 20
}

function toggleFaq(index) {
  openFaq.value = openFaq.value === index ? null : index
}

function toggleMobileMenu() {
  mobileMenuOpen.value = !mobileMenuOpen.value
}

const features = [
  {
    icon: '⚡',
    title: 'Real-Time Orders',
    desc: 'Orders go from customer to kitchen instantly. No delays, no missed tickets, no shouting across the room.',
  },
  {
    icon: '📱',
    title: 'QR Table Ordering',
    desc: 'Customers scan, browse, and order from their phone. No app download. No waiting for a waiter.',
  },
  {
    icon: '👨‍🍳',
    title: 'Kitchen Display',
    desc: 'A dedicated kitchen view shows pending, cooking, and ready orders in big, clear cards.',
  },
  {
    icon: '👥',
    title: 'Role-Based Access',
    desc: "Admin, Kitchen, Cashier, Waiter — each role sees exactly what they need and nothing they don't.",
  },
  {
    icon: '🗂️',
    title: 'Menu Management',
    desc: 'Add categories, items, photos, prices and toggle availability in seconds. No technical skill required.',
  },
  {
    icon: '💳',
    title: 'Payment Tracking',
    desc: 'Cashiers mark orders as paid with one tap. Full order history always available.',
  },
]

const steps = [
  {
    number: '01',
    title: 'Sign up & set up',
    desc: 'Create your account, add your restaurant info and build your menu in minutes.',
  },
  {
    number: '02',
    title: 'Generate QR codes',
    desc: 'Create your tables and download a QR code for each one. Print and place them.',
  },
  {
    number: '03',
    title: 'Customers order',
    desc: 'Guests scan the QR, browse your live menu, and place their order directly.',
  },
  {
    number: '04',
    title: 'Kitchen gets it live',
    desc: 'Your kitchen display lights up instantly. Accept, cook, mark ready — done.',
  },
]

const plans = [
  {
    name: 'Starter',
    price: '$19',
    desc: 'Perfect for small cafes and food trucks',
    features: [
      'Up to 15 tables',
      '3 staff accounts',
      '1 location',
      'QR ordering',
      'Kitchen display',
      'Email support',
    ],
    cta: 'Start free trial',
    highlight: false,
  },
  {
    name: 'Pro',
    price: '$49',
    desc: 'For growing restaurants',
    features: [
      'Unlimited tables',
      '10 staff accounts',
      '3 locations',
      'Everything in Starter',
      'Order analytics',
      'Priority support',
    ],
    cta: 'Start free trial',
    highlight: true,
  },
  {
    name: 'Business',
    price: '$99',
    desc: 'For restaurant groups',
    features: [
      'Unlimited everything',
      'Unlimited staff',
      'Unlimited locations',
      'Everything in Pro',
      'Custom onboarding',
      'Dedicated support',
    ],
    cta: 'Start free trial',
    highlight: false,
  },
]

const faqs = [
  {
    q: 'Do my customers need to download an app?',
    a: 'No. Customers scan the QR code and order directly in their browser. No downloads, no accounts, no friction.',
  },
  {
    q: 'How does the 14-day trial work?',
    a: 'Sign up and get full Pro access for 14 days, no credit card required. At the end you pick a plan or your account pauses.',
  },
  {
    q: 'Can I manage multiple restaurant locations?',
    a: 'Yes! The Pro plan supports up to 3 locations and Business supports unlimited. Each location has its own menu and tables.',
  },
  {
    q: 'What happens to orders if the internet goes down?',
    a: 'We recommend having a backup connection for mission-critical operations. The app requires internet for real-time syncing between kitchen and customers.',
  },
  {
    q: 'Can my kitchen staff use it on a phone or tablet?',
    a: 'Absolutely. The kitchen view is fully mobile-responsive and designed to be readable from a distance on any device.',
  },
]
</script>

<template>
  <div class="bg-[#0A0A0A] text-white min-h-screen font-sans antialiased">
    <!-- Font imports -->
    <component :is="'style'">
      @import
      url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
      @import
      url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800;900&display=swap');
      * { box-sizing: border-box; margin: 0; padding: 0; } html { scroll-behavior: smooth;
      -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; } body { font-family:
      'Inter', sans-serif; } .playfair { font-family: 'Playfair Display', serif; font-weight: 800;
      letter-spacing: -0.02em; } .gradient-text { background: linear-gradient(135deg, #F97316 0%,
      #FBBF24 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;
      background-clip: text; } .card-hover { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
      .card-hover:hover { transform: translateY(-4px); box-shadow: 0 20px 40px -20px rgba(249, 115,
      22, 0.3); } .glow { box-shadow: 0 0 40px rgba(249, 115, 22, 0.15); } .nav-blur {
      backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); } @keyframes float { 0%,
      100% { transform: translateY(0px); } 50% { transform: translateY(-10px); } } .float {
      animation: float 4s ease-in-out infinite; } @keyframes fadeUp { from { opacity: 0; transform:
      translateY(20px); } to { opacity: 1; transform: translateY(0); } } .fade-up { animation:
      fadeUp 0.5s ease forwards; } .fade-up-2 { animation: fadeUp 0.5s 0.1s ease forwards; opacity:
      0; } .fade-up-3 { animation: fadeUp 0.5s 0.2s ease forwards; opacity: 0; } .noise { position:
      fixed; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 100;
      opacity: 0.02; background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256'
      xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence
      type='fractalNoise' baseFrequency='0.9' numOctaves='4'
      stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25'
      filter='url(%23noise)'/%3E%3C/svg%3E"); }
    </component>

    <!-- Noise overlay -->
    <div class="noise"></div>

    <!-- ── NAVBAR ────────────────────────────────────── -->
    <nav
      class="fixed top-0 left-0 right-0 z-50 nav-blur transition-all duration-300"
      :class="isScrolled ? 'bg-black/90 border-b border-white/10 py-3' : 'bg-transparent py-4'"
    >
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        <!-- Logo -->
        <span
          class="text-xl sm:text-2xl font-bold tracking-tight bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent"
        >
          🍽️ RestaurantOS
        </span>

        <!-- Desktop Navigation -->
        <div class="hidden md:flex items-center gap-8">
          <a
            href="#features"
            class="text-sm text-white/70 hover:text-white transition-colors font-medium"
            >Features</a
          >
          <a
            href="#how"
            class="text-sm text-white/70 hover:text-white transition-colors font-medium"
            >How it works</a
          >
          <a
            href="#pricing"
            class="text-sm text-white/70 hover:text-white transition-colors font-medium"
            >Pricing</a
          >
          <a
            href="#faq"
            class="text-sm text-white/70 hover:text-white transition-colors font-medium"
            >FAQ</a
          >
        </div>

        <!-- Desktop Auth Buttons -->
        <div class="hidden md:flex items-center gap-3">
          <RouterLink
            to="/login"
            class="text-sm text-white/70 hover:text-white transition-colors px-4 py-2 font-medium"
          >
            Sign in
          </RouterLink>
          <RouterLink
            to="/signup"
            class="text-sm bg-orange-500 hover:bg-orange-400 text-white font-semibold px-5 py-2.5 rounded-full transition-all hover:scale-105 shadow-lg shadow-orange-500/25"
          >
            Start free trial
          </RouterLink>
        </div>

        <!-- Mobile Menu Button -->
        <button
          @click="toggleMobileMenu"
          class="md:hidden text-white/70 hover:text-white focus:outline-none"
          aria-label="Toggle menu"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              v-if="!mobileMenuOpen"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 6h16M4 12h16M4 18h16"
            />
            <path
              v-else
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <!-- Mobile Menu -->
      <div
        v-if="mobileMenuOpen"
        class="md:hidden absolute top-full left-0 right-0 bg-black/95 backdrop-blur-lg border-b border-white/10 py-4 px-4"
      >
        <div class="flex flex-col space-y-3">
          <a
            @click="mobileMenuOpen = false"
            href="#features"
            class="text-white/70 hover:text-white transition-colors py-2 px-4 rounded-lg hover:bg-white/5 font-medium"
          >
            Features
          </a>
          <a
            @click="mobileMenuOpen = false"
            href="#how"
            class="text-white/70 hover:text-white transition-colors py-2 px-4 rounded-lg hover:bg-white/5 font-medium"
          >
            How it works
          </a>
          <a
            @click="mobileMenuOpen = false"
            href="#pricing"
            class="text-white/70 hover:text-white transition-colors py-2 px-4 rounded-lg hover:bg-white/5 font-medium"
          >
            Pricing
          </a>
          <a
            @click="mobileMenuOpen = false"
            href="#faq"
            class="text-white/70 hover:text-white transition-colors py-2 px-4 rounded-lg hover:bg-white/5 font-medium"
          >
            FAQ
          </a>
          <div class="border-t border-white/10 my-2 pt-2"></div>
          <RouterLink
            @click="mobileMenuOpen = false"
            to="/login"
            class="text-white/70 hover:text-white transition-colors py-2 px-4 rounded-lg hover:bg-white/5 font-medium"
          >
            Sign in
          </RouterLink>
          <RouterLink
            @click="mobileMenuOpen = false"
            to="/signup"
            class="bg-orange-500 hover:bg-orange-400 text-white font-semibold py-3 px-4 rounded-lg text-center transition-colors"
          >
            Start free trial
          </RouterLink>
        </div>
      </div>
    </nav>

    <!-- ── HERO ──────────────────────────────────────── -->
    <section
      class="relative min-h-screen flex items-center justify-center overflow-hidden px-4 sm:px-6 lg:px-8 pt-20"
    >
      <!-- Background glow blobs - adjusted for mobile -->
      <div
        class="absolute top-1/4 left-1/2 -translate-x-1/2 w-[300px] sm:w-[400px] md:w-[600px] h-[300px] sm:h-[400px] md:h-[600px] bg-orange-500/10 rounded-full blur-[80px] sm:blur-[100px] md:blur-[120px] pointer-events-none"
      ></div>
      <div
        class="absolute top-1/3 left-1/4 w-[200px] sm:w-[250px] md:w-[300px] h-[200px] sm:h-[250px] md:h-[300px] bg-amber-500/8 rounded-full blur-[60px] sm:blur-[70px] md:blur-[80px] pointer-events-none"
      ></div>

      <div class="relative z-10 text-center max-w-4xl mx-auto">
        <!-- Badge -->
        <div
          class="fade-up inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-3 sm:px-4 py-1.5 text-xs sm:text-sm text-white/60 mb-6 sm:mb-8"
        >
          <span class="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-400 rounded-full"></span>
          14-day free trial · No credit card required
        </div>

        <!-- Headline - responsive text sizes -->
        <h1
          class="fade-up-2 playfair text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black leading-tight mb-4 sm:mb-6 px-2"
        >
          Your restaurant,<br />
          <span class="gradient-text">running smoother.</span>
        </h1>

        <!-- Subheadline -->
        <p
          class="fade-up-3 text-base sm:text-lg md:text-xl text-white/50 max-w-2xl mx-auto mb-8 sm:mb-10 leading-relaxed px-4"
        >
          QR ordering, live kitchen display, and role-based staff management — all in one clean,
          simple platform. No hardware. No complexity.
        </p>

        <!-- CTA Buttons - stacked on mobile -->
        <div
          class="fade-up-3 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 px-4"
        >
          <RouterLink
            to="/signup"
            class="w-full sm:w-auto bg-orange-500 hover:bg-orange-400 text-white font-semibold px-6 sm:px-8 py-3.5 sm:py-4 rounded-full text-sm sm:text-base transition-all hover:scale-105 glow"
          >
            Start your free trial →
          </RouterLink>
          <a
            href="#how"
            class="text-white/50 hover:text-white text-sm sm:text-base transition-colors py-2"
          >
            See how it works ↓
          </a>
        </div>

        <!-- Hero mockup - adjusted for mobile -->
        <div class="float mt-12 sm:mt-16 md:mt-20 relative mx-auto max-w-3xl px-4">
          <div
            class="bg-[#111] border border-white/10 rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-2xl"
          >
            <div class="bg-[#0D0D0D] rounded-lg sm:rounded-xl p-3 sm:p-4">
              <div class="flex items-center justify-between mb-3 sm:mb-4">
                <span class="text-xs sm:text-sm font-medium text-white/80">🍳 Kitchen Display</span>
                <span
                  class="text-[10px] sm:text-xs text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full"
                  >● Live</span
                >
              </div>
              <!-- Grid - 1 column on mobile, 3 on desktop -->
              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                <div
                  v-for="(order, i) in [
                    {
                      table: 'Table 3',
                      items: ['Grilled Salmon', 'Caesar Salad'],
                      status: 'pending',
                      time: '2 min ago',
                    },
                    {
                      table: 'Table 7',
                      items: ['Ribeye Steak', 'Red Wine'],
                      status: 'cooking',
                      time: '8 min ago',
                    },
                    {
                      table: 'Table 1',
                      items: ['Margherita Pizza'],
                      status: 'ready',
                      time: '12 min ago',
                    },
                  ]"
                  :key="i"
                  class="bg-[#1A1A1A] rounded-lg sm:rounded-xl p-2 sm:p-3 border text-left"
                  :class="
                    order.status === 'pending'
                      ? 'border-orange-500/40'
                      : order.status === 'cooking'
                        ? 'border-blue-500/40'
                        : 'border-green-500/40'
                  "
                >
                  <div class="flex items-center justify-between mb-1.5 sm:mb-2">
                    <span class="text-xs sm:text-sm font-semibold text-white">{{
                      order.table
                    }}</span>
                    <span
                      class="text-[10px] sm:text-xs px-1.5 py-0.5 rounded-full font-medium"
                      :class="
                        order.status === 'pending'
                          ? 'bg-orange-500/20 text-orange-400'
                          : order.status === 'cooking'
                            ? 'bg-blue-500/20 text-blue-400'
                            : 'bg-green-500/20 text-green-400'
                      "
                    >
                      {{ order.status }}
                    </span>
                  </div>
                  <div class="space-y-0.5 mb-1.5 sm:mb-2">
                    <p
                      v-for="item in order.items"
                      :key="item"
                      class="text-[10px] sm:text-xs text-white/40"
                    >
                      {{ item }}
                    </p>
                  </div>
                  <p class="text-[8px] sm:text-xs text-white/20">{{ order.time }}</p>
                </div>
              </div>
            </div>
          </div>
          <!-- Glow under card -->
          <div
            class="absolute -bottom-6 sm:-bottom-8 left-1/2 -translate-x-1/2 w-3/4 h-8 sm:h-12 bg-orange-500/20 blur-xl sm:blur-2xl rounded-full"
          ></div>
        </div>
      </div>
    </section>

    <!-- ── FEATURES ───────────────────────────────────── -->
    <section id="features" class="py-16 sm:py-20 md:py-28 px-4 sm:px-6 lg:px-8">
      <div class="max-w-7xl mx-auto">
        <div class="text-center mb-12 sm:mb-16">
          <p
            class="text-orange-400 text-xs sm:text-sm font-semibold tracking-widest uppercase mb-2 sm:mb-3"
          >
            Everything you need
          </p>
          <h2 class="playfair text-3xl sm:text-4xl md:text-5xl font-black px-2">
            Built for the real kitchen
          </h2>
          <p class="text-white/40 mt-3 sm:mt-4 max-w-xl mx-auto text-sm sm:text-base px-4">
            Not a generic SaaS tool. Every feature was designed around how restaurants actually
            operate.
          </p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          <div
            v-for="(f, i) in features"
            :key="i"
            class="card-hover bg-[#111] border border-white/10 rounded-xl sm:rounded-2xl p-5 sm:p-6 hover:border-orange-500/30"
          >
            <div class="text-2xl sm:text-3xl mb-3 sm:mb-4">{{ f.icon }}</div>
            <h3 class="font-semibold text-white text-base sm:text-lg mb-1.5 sm:mb-2">
              {{ f.title }}
            </h3>
            <p class="text-xs sm:text-sm text-white/40 leading-relaxed">{{ f.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ── HOW IT WORKS ───────────────────────────────── -->
    <section id="how" class="py-16 sm:py-20 md:py-28 px-4 sm:px-6 lg:px-8 border-t border-white/10">
      <div class="max-w-4xl mx-auto">
        <div class="text-center mb-12 sm:mb-16">
          <p
            class="text-orange-400 text-xs sm:text-sm font-semibold tracking-widest uppercase mb-2 sm:mb-3"
          >
            Simple by design
          </p>
          <h2 class="playfair text-3xl sm:text-4xl md:text-5xl font-black">
            Up and running in one afternoon
          </h2>
        </div>

        <div class="space-y-4 sm:space-y-6">
          <div
            v-for="(step, i) in steps"
            :key="i"
            class="flex flex-col sm:flex-row gap-4 sm:gap-6 items-start card-hover bg-[#111] border border-white/10 rounded-xl sm:rounded-2xl p-5 sm:p-6 hover:border-orange-500/20"
          >
            <div class="playfair text-3xl sm:text-4xl font-black gradient-text shrink-0">
              {{ step.number }}
            </div>
            <div>
              <h3 class="font-semibold text-white text-base sm:text-lg mb-1">{{ step.title }}</h3>
              <p class="text-xs sm:text-sm text-white/40 leading-relaxed">{{ step.desc }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ── PRICING ────────────────────────────────────── -->
    <section
      id="pricing"
      class="py-16 sm:py-20 md:py-28 px-4 sm:px-6 lg:px-8 border-t border-white/10"
    >
      <div class="max-w-7xl mx-auto">
        <div class="text-center mb-12 sm:mb-16">
          <p
            class="text-orange-400 text-xs sm:text-sm font-semibold tracking-widest uppercase mb-2 sm:mb-3"
          >
            Pricing
          </p>
          <h2 class="playfair text-3xl sm:text-4xl md:text-5xl font-black">
            Simple, honest pricing
          </h2>
          <p class="text-white/40 mt-3 sm:mt-4 text-sm sm:text-base">
            All plans start with a 14-day free trial. No credit card required.
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-5 max-w-lg md:max-w-none mx-auto">
          <div
            v-for="(plan, i) in plans"
            :key="i"
            class="card-hover relative rounded-xl sm:rounded-2xl p-6 sm:p-6 border"
            :class="
              plan.highlight
                ? 'bg-orange-500/10 border-orange-500/40 glow scale-105 md:scale-100'
                : 'bg-[#111] border-white/10'
            "
          >
            <!-- Popular badge -->
            <div
              v-if="plan.highlight"
              class="absolute -top-3 left-1/2 -translate-x-1/2 bg-orange-500 text-white text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap"
            >
              Most Popular
            </div>

            <div class="mb-5">
              <h3 class="font-semibold text-white text-lg mb-1">{{ plan.name }}</h3>
              <div class="flex items-baseline gap-1 mb-2">
                <span class="playfair text-3xl sm:text-4xl font-black text-white">{{
                  plan.price
                }}</span>
                <span class="text-white/40 text-xs sm:text-sm">/ month</span>
              </div>
              <p class="text-xs text-white/40">{{ plan.desc }}</p>
            </div>

            <ul class="space-y-2.5 mb-6">
              <li
                v-for="(f, j) in plan.features"
                :key="j"
                class="flex items-center gap-2.5 text-xs sm:text-sm text-white/60"
              >
                <span class="text-green-400 shrink-0 text-sm">✓</span>
                {{ f }}
              </li>
            </ul>

            <RouterLink
              to="/signup"
              class="block text-center font-semibold py-3 rounded-full text-xs sm:text-sm transition-all"
              :class="
                plan.highlight
                  ? 'bg-orange-500 hover:bg-orange-400 text-white'
                  : 'bg-white/5 hover:bg-white/10 text-white border border-white/10'
              "
            >
              {{ plan.cta }}
            </RouterLink>
          </div>
        </div>
      </div>
    </section>

    <!-- ── FAQ ───────────────────────────────────────── -->
    <section id="faq" class="py-16 sm:py-20 md:py-28 px-4 sm:px-6 lg:px-8 border-t border-white/10">
      <div class="max-w-2xl mx-auto">
        <div class="text-center mb-12 sm:mb-16">
          <p
            class="text-orange-400 text-xs sm:text-sm font-semibold tracking-widest uppercase mb-2 sm:mb-3"
          >
            FAQ
          </p>
          <h2 class="playfair text-3xl sm:text-4xl font-black">Questions? We got you.</h2>
        </div>

        <div class="space-y-3">
          <div
            v-for="(faq, i) in faqs"
            :key="i"
            class="bg-[#111] border border-white/10 rounded-xl overflow-hidden"
          >
            <button
              @click="toggleFaq(i)"
              class="w-full flex items-center justify-between p-4 sm:p-5 text-left hover:bg-white/5 transition-colors"
            >
              <span class="text-xs sm:text-sm font-medium text-white/80 pr-4">{{ faq.q }}</span>
              <span
                class="text-white/30 shrink-0 text-xl transition-transform duration-300"
                :class="openFaq === i ? 'rotate-45' : ''"
                >+</span
              >
            </button>
            <div v-if="openFaq === i" class="px-4 sm:px-5 pb-4 sm:pb-5">
              <p class="text-xs sm:text-sm text-white/40 leading-relaxed">{{ faq.a }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ── CTA BANNER ─────────────────────────────────── -->
    <section class="py-16 sm:py-20 px-4 sm:px-6 lg:px-8">
      <div class="max-w-3xl mx-auto">
        <div
          class="bg-gradient-to-br from-orange-500/15 to-amber-500/5 border border-orange-500/20 rounded-2xl sm:rounded-3xl p-8 sm:p-12 text-center"
        >
          <h2 class="playfair text-3xl sm:text-4xl md:text-5xl font-black mb-4">
            Ready to simplify<br />your restaurant?
          </h2>
          <p class="text-white/40 mb-6 sm:mb-8 text-sm sm:text-base">
            Join hundreds of restaurants running smarter with RestaurantOS.
          </p>
          <RouterLink
            to="/signup"
            class="inline-block w-full sm:w-auto bg-orange-500 hover:bg-orange-400 text-white font-semibold px-8 sm:px-10 py-4 rounded-full text-sm sm:text-base transition-all hover:scale-105"
          >
            Start your 14-day free trial →
          </RouterLink>
          <p class="text-xs text-white/20 mt-4">
            No credit card · Cancel anytime · Setup in minutes
          </p>
        </div>
      </div>
    </section>

    <!-- ── FOOTER ─────────────────────────────────────── -->
    <footer class="border-t border-white/10 py-8 sm:py-10 px-4 sm:px-6 lg:px-8">
      <div
        class="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs sm:text-sm text-white/30"
      >
        <span
          class="font-bold text-base sm:text-lg bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent"
        >
          🍽️ RestaurantOS
        </span>
        <span>© 2025 RestaurantOS. All rights reserved.</span>
        <div class="flex gap-6">
          <a href="#" class="hover:text-white transition-colors">Privacy</a>
          <a href="#" class="hover:text-white transition-colors">Terms</a>
          <a href="#" class="hover:text-white transition-colors">Contact</a>
        </div>
      </div>
    </footer>
  </div>
</template>
