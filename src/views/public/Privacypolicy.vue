<template>
  <div class="legal-page">
    <div class="noise fixed inset-0 z-0 pointer-events-none opacity-45" />

    <!-- Nav -->
    <nav class="nav" :class="{ scrolled }">
      <div class="nav-inner">
        <RouterLink to="/" class="nav-logo">
          <div class="logo-icon"><img src="/favicon.png" alt="" /></div>
          <span class="logo-wordmark">Qrserve</span>
        </RouterLink>
        <RouterLink to="/" class="btn-ghost">← Back to Home</RouterLink>
      </div>
    </nav>

    <!-- Header -->
    <header class="legal-header">
      <div class="legal-header-inner">
        <span class="section-label">Legal</span>
        <h1 class="legal-title">Privacy Policy</h1>
        <p class="legal-meta">Last updated: February 28, 2026</p>
        <p class="legal-intro">
          This Privacy Policy describes how Qrserve collects, uses, and protects your information
          when you use our service. By using Qrserve, you agree to the practices described here.
        </p>
      </div>
    </header>

    <!-- Content -->
    <main class="legal-main">
      <div class="legal-container">
        <!-- TOC -->
        <aside class="toc">
          <div class="toc-inner">
            <p class="toc-title">Contents</p>
            <a v-for="s in sections" :key="s.id" :href="'#' + s.id" class="toc-link">{{
              s.title
            }}</a>
          </div>
        </aside>

        <!-- Sections -->
        <div class="legal-body">
          <section id="information-we-collect" class="legal-section">
            <h2>Information We Collect</h2>
            <p>When you use Qrserve, we collect the following types of information:</p>
            <div class="info-card">
              <div class="info-row">
                <div class="info-icon">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                  >
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
                <div>
                  <strong>Account Information</strong>
                  <p>Name, email address, and password when you register for an account.</p>
                </div>
              </div>
              <div class="info-row">
                <div class="info-icon">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                  >
                    <rect x="1" y="4" width="22" height="16" rx="2" />
                    <line x1="1" y1="10" x2="23" y2="10" />
                  </svg>
                </div>
                <div>
                  <strong>Billing & Subscription Data</strong>
                  <p>
                    Payment method details, subscription plan, billing history, and transaction
                    records. Card details are processed securely by our payment provider and are not
                    stored on our servers.
                  </p>
                </div>
              </div>
              <div class="info-row">
                <div class="info-icon">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                  >
                    <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 002-2V2" />
                    <path d="M7 2v20" />
                    <path d="M21 15V2" />
                    <circle cx="18" cy="18" r="3" />
                  </svg>
                </div>
                <div>
                  <strong>Restaurant & Business Data</strong>
                  <p>
                    Menu items, table configurations, order history, staff accounts, and analytics
                    data associated with your restaurant account.
                  </p>
                </div>
              </div>
              <div class="info-row">
                <div class="info-icon">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                  >
                    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                  </svg>
                </div>
                <div>
                  <strong>Usage Data</strong>
                  <p>
                    IP address, browser type, pages visited, time spent, device identifiers, and
                    other diagnostic data collected automatically.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section id="how-we-use" class="legal-section">
            <h2>How We Use Your Information</h2>
            <p>We use your information to operate, improve, and support the Qrserve service:</p>
            <ul class="legal-list">
              <li>To create and manage your account and restaurant profile</li>
              <li>To process your subscription payments and manage billing cycles</li>
              <li>To deliver the QR ordering, kitchen display, and analytics features</li>
              <li>
                To send service-related emails such as receipts, invoices, and account notifications
              </li>
              <li>To respond to support requests and customer inquiries</li>
              <li>To detect, prevent, and address fraud or security issues</li>
              <li>To improve our features based on usage patterns and feedback</li>
            </ul>
            <div class="callout">
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              We do not sell your personal data to third parties, ever.
            </div>
          </section>

          <section id="subscriptions-billing" class="legal-section">
            <h2>Subscriptions & Billing</h2>
            <p>
              Qrserve offers paid subscription plans. By subscribing, you authorize us to charge
              your payment method on a recurring basis according to your selected plan.
            </p>
            <ul class="legal-list">
              <li>
                Subscriptions renew automatically at the end of each billing period unless cancelled
              </li>
              <li>You can cancel your subscription at any time from your account Settings page</li>
              <li>
                Cancellation takes effect at the end of the current billing period — you retain
                access until then
              </li>
              <li>We do not offer refunds for partial billing periods unless required by law</li>
              <li>
                Payment is processed securely by our third-party payment provider (Lemon Squeezy).
                We do not store your full card details
              </li>
              <li>
                Billing information including plan type, payment status, and invoices is retained
                for up to 7 years for tax and legal compliance
              </li>
            </ul>
          </section>

          <section id="data-sharing" class="legal-section">
            <h2>Data Sharing</h2>
            <p>We only share your data with third parties in these specific circumstances:</p>
            <ul class="legal-list">
              <li>
                <strong>Payment Processors:</strong> Your billing data is shared with our payment
                provider to process subscription charges
              </li>
              <li>
                <strong>Infrastructure Providers:</strong> We use Supabase for our database and
                authentication, and Vercel for hosting. These providers process data on our behalf
                under strict confidentiality agreements
              </li>
              <li>
                <strong>Legal Requirements:</strong> We may disclose data if required by law, court
                order, or government authority
              </li>
              <li>
                <strong>Business Transfers:</strong> In the event of a merger or acquisition, your
                data may be transferred as part of that transaction with prior notice
              </li>
            </ul>
            <p>
              We do not share your data with advertisers, data brokers, or any other third parties
              beyond those listed above.
            </p>
          </section>

          <section id="cookies" class="legal-section">
            <h2>Cookies</h2>
            <p>
              Qrserve uses cookies to keep you logged in, remember your preferences, and understand
              how the service is used. We use two types:
            </p>
            <div class="cookie-table">
              <div class="cookie-row header">
                <span>Type</span><span>Purpose</span><span>Duration</span>
              </div>
              <div class="cookie-row">
                <span>Essential</span><span>Authentication & session management</span
                ><span>Session</span>
              </div>
              <div class="cookie-row">
                <span>Functional</span><span>Remember your preferences and settings</span
                ><span>Up to 1 year</span>
              </div>
              <div class="cookie-row">
                <span>Analytics</span><span>Understand usage patterns to improve the service</span
                ><span>Up to 24 months</span>
              </div>
            </div>
            <p>
              You can control cookies through your browser settings. Disabling essential cookies may
              affect your ability to use the service.
            </p>
          </section>

          <section id="data-retention" class="legal-section">
            <h2>Data Retention</h2>
            <p>We retain your data only as long as necessary:</p>
            <ul class="legal-list">
              <li>
                <strong>Account data:</strong> Retained for the duration of your account plus 24
                months after closure
              </li>
              <li><strong>Billing records:</strong> Up to 7 years for legal and tax compliance</li>
              <li>
                <strong>Order and restaurant data:</strong> Up to 24 months after account closure
              </li>
              <li><strong>Usage and analytics data:</strong> Up to 24 months from collection</li>
            </ul>
            <p>When retention periods expire, data is securely deleted or anonymized.</p>
          </section>

          <section id="your-rights" class="legal-section">
            <h2>Your Rights</h2>
            <p>You have the following rights regarding your personal data:</p>
            <ul class="legal-list">
              <li>
                <strong>Access:</strong> Request a copy of the personal data we hold about you
              </li>
              <li>
                <strong>Correction:</strong> Update or correct inaccurate data via your account
                settings
              </li>
              <li>
                <strong>Deletion:</strong> Request deletion of your account and associated data
              </li>
              <li><strong>Portability:</strong> Request your data in a portable format</li>
              <li><strong>Objection:</strong> Object to certain processing activities</li>
            </ul>
            <p>
              To exercise any of these rights, contact us at the address below. We will respond
              within 30 days.
            </p>
          </section>

          <section id="security" class="legal-section">
            <h2>Security</h2>
            <p>
              We take reasonable technical and organizational measures to protect your data —
              including encrypted connections (HTTPS), secure authentication via Supabase, and
              restricted access to production systems. However, no internet transmission is 100%
              secure and we cannot guarantee absolute security.
            </p>
          </section>

          <section id="children" class="legal-section">
            <h2>Children's Privacy</h2>
            <p>
              Qrserve is not directed to anyone under the age of 16. We do not knowingly collect
              personal data from children. If you believe a child has provided us with personal
              data, please contact us and we will delete it promptly.
            </p>
          </section>

          <section id="changes" class="legal-section">
            <h2>Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. When we do, we will update the
              "Last updated" date at the top and notify you by email or a prominent notice on the
              service before changes take effect.
            </p>
          </section>

          <section id="contact" class="legal-section">
            <h2>Contact Us</h2>
            <p>
              If you have questions about this Privacy Policy or your personal data, you can reach
              us:
            </p>
            <div class="contact-card">
              <div class="contact-icon">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                >
                  <path
                    d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"
                  />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </div>
              <div>
                <p class="contact-label">Email</p>
                <a href="mailto:sochetra411@gmail.com" class="contact-value"
                  >sochetra411@gmail.com</a
                >
              </div>
            </div>
            <div class="contact-card">
              <div class="contact-icon">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="2" y1="12" x2="22" y2="12" />
                  <path
                    d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"
                  />
                </svg>
              </div>
              <div>
                <p class="contact-label">Website</p>
                <a href="https://qrserve.vercel.app" class="contact-value">qrserve.vercel.app</a>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>

    <!-- Footer -->
    <footer class="legal-footer">
      <div class="legal-footer-inner">
        <RouterLink to="/" class="footer-logo">
          <div class="footer-icon"><img src="/favicon.png" alt="" /></div>
          <span class="footer-wordmark">Qrserve</span>
        </RouterLink>
        <div class="footer-links">
          <RouterLink to="/privacy" class="footer-link active">Privacy Policy</RouterLink>
          <RouterLink to="/terms" class="footer-link">Terms of Service</RouterLink>
          <RouterLink to="/" class="footer-link">Home</RouterLink>
        </div>
        <p class="footer-copy">© {{ new Date().getFullYear() }} Qrserve. All rights reserved.</p>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const scrolled = ref(false)
const handleScroll = () => {
  scrolled.value = window.scrollY > 20
}
onMounted(() => window.addEventListener('scroll', handleScroll))
onUnmounted(() => window.removeEventListener('scroll', handleScroll))

const sections = [
  { id: 'information-we-collect', title: 'Information We Collect' },
  { id: 'how-we-use', title: 'How We Use It' },
  { id: 'subscriptions-billing', title: 'Subscriptions & Billing' },
  { id: 'data-sharing', title: 'Data Sharing' },
  { id: 'cookies', title: 'Cookies' },
  { id: 'data-retention', title: 'Data Retention' },
  { id: 'your-rights', title: 'Your Rights' },
  { id: 'security', title: 'Security' },
  { id: 'children', title: "Children's Privacy" },
  { id: 'changes', title: 'Changes to This Policy' },
  { id: 'contact', title: 'Contact Us' },
]
</script>

<style scoped>
.legal-page {
  min-height: 100vh;
  background: var(--color-bg-base);
  color: var(--color-text-primary);
  font-family: var(--font-body);
}

/* Nav */
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
  max-width: 1100px;
  margin: 0 auto;
  height: 72px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.nav-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
}
.logo-icon {
  width: 36px;
  height: 36px;
  background: var(--color-accent);
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.logo-wordmark {
  font-family: var(--font-display);
  font-size: 22px;
  font-weight: 800;
  color: var(--color-text-primary);
  letter-spacing: -0.5px;
}
.btn-ghost {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-muted);
  text-decoration: none;
  padding: 8px 16px;
  border-radius: 50px;
  transition: all 0.15s;
}
.btn-ghost:hover {
  color: var(--color-text-primary);
  background: var(--color-border-subtle);
}

/* Header */
.legal-header {
  padding: 120px 40px 64px;
  border-bottom: 1px solid var(--color-border-subtle);
  background: var(--color-bg-elevated);
}
.legal-header-inner {
  max-width: 680px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.section-label {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--color-accent);
  background: var(--color-accent-muted);
  padding: 5px 14px;
  border-radius: 50px;
  border: 1px solid var(--color-accent-border);
  width: fit-content;
}
.legal-title {
  font-family: var(--font-display);
  font-size: clamp(36px, 5vw, 56px);
  font-weight: 800;
  letter-spacing: -0.04em;
  color: var(--color-text-primary);
  line-height: 1.05;
}
.legal-meta {
  font-size: 13px;
  color: var(--color-text-faint);
}
.legal-intro {
  font-size: 16px;
  color: var(--color-text-secondary);
  line-height: 1.7;
  max-width: 580px;
}

/* Main layout */
.legal-main {
  padding: 64px 40px 96px;
}
.legal-container {
  max-width: 1100px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 220px 1fr;
  gap: 64px;
  align-items: start;
}

/* TOC */
.toc {
  position: sticky;
  top: 96px;
}
.toc-inner {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.toc-title {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--color-text-faint);
  margin-bottom: 8px;
  padding-left: 12px;
}
.toc-link {
  font-size: 13px;
  color: var(--color-text-muted);
  text-decoration: none;
  padding: 7px 12px;
  border-radius: 8px;
  transition: all 0.15s;
  border-left: 2px solid transparent;
}
.toc-link:hover {
  color: var(--color-text-primary);
  background: var(--color-border-subtle);
  border-left-color: var(--color-accent);
}

/* Body */
.legal-body {
  display: flex;
  flex-direction: column;
  gap: 0;
}
.legal-section {
  padding: 40px 0;
  border-bottom: 1px solid var(--color-border-subtle);
}
.legal-section:last-child {
  border-bottom: none;
}
.legal-section h2 {
  font-family: var(--font-display);
  font-size: 22px;
  font-weight: 700;
  color: var(--color-text-primary);
  margin-bottom: 16px;
  letter-spacing: -0.02em;
}
.legal-section p {
  font-size: 15px;
  color: var(--color-text-secondary);
  line-height: 1.75;
  margin-bottom: 12px;
}
.legal-section p:last-child {
  margin-bottom: 0;
}

.legal-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 12px 0;
}
.legal-list li {
  font-size: 15px;
  color: var(--color-text-secondary);
  line-height: 1.65;
  padding-left: 20px;
  position: relative;
}
.legal-list li::before {
  content: '—';
  position: absolute;
  left: 0;
  color: var(--color-accent);
  font-weight: 700;
}

/* Info cards */
.info-card {
  background: var(--color-bg-surface);
  border: 1.5px solid var(--color-border-subtle);
  border-radius: 12px;
  overflow: hidden;
  margin-top: 16px;
}
.info-row {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 18px 20px;
  border-bottom: 1px solid var(--color-border-subtle);
}
.info-row:last-child {
  border-bottom: none;
}
.info-icon {
  width: 36px;
  height: 36px;
  border-radius: 9px;
  background: var(--color-accent-muted);
  border: 1px solid var(--color-accent-border);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-accent);
  flex-shrink: 0;
}
.info-row strong {
  display: block;
  font-size: 14px;
  font-weight: 700;
  color: var(--color-text-primary);
  margin-bottom: 4px;
}
.info-row p {
  font-size: 13.5px;
  color: var(--color-text-muted);
  line-height: 1.6;
  margin: 0;
}

/* Callout */
.callout {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 18px;
  background: var(--color-accent-muted);
  border: 1px solid var(--color-accent-border);
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  color: var(--color-accent);
  margin-top: 16px;
}

/* Cookie table */
.cookie-table {
  border: 1.5px solid var(--color-border-subtle);
  border-radius: 10px;
  overflow: hidden;
  margin: 16px 0;
}
.cookie-row {
  display: grid;
  grid-template-columns: 120px 1fr 130px;
  gap: 16px;
  padding: 12px 18px;
  border-bottom: 1px solid var(--color-border-subtle);
  font-size: 13.5px;
  color: var(--color-text-secondary);
}
.cookie-row:last-child {
  border-bottom: none;
}
.cookie-row.header {
  background: var(--color-bg-elevated);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-text-muted);
}

/* Contact cards */
.contact-card {
  display: flex;
  align-items: center;
  gap: 14px;
  background: var(--color-bg-surface);
  border: 1.5px solid var(--color-border-subtle);
  border-radius: 10px;
  padding: 16px 20px;
  margin-top: 12px;
  transition: border-color 0.15s;
}
.contact-card:hover {
  border-color: var(--color-accent-border);
}
.contact-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: var(--color-accent-muted);
  border: 1px solid var(--color-accent-border);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-accent);
  flex-shrink: 0;
}
.contact-label {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--color-text-faint);
  margin: 0 0 3px !important;
}
.contact-value {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
  text-decoration: none;
  transition: color 0.15s;
}
.contact-value:hover {
  color: var(--color-accent);
}

/* Footer */
.legal-footer {
  border-top: 1px solid var(--color-border-subtle);
  padding: 28px 40px;
  background: var(--color-bg-base);
}
.legal-footer-inner {
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
  text-decoration: none;
  flex-shrink: 0;
}
.footer-icon {
  width: 28px;
  height: 28px;
  background: var(--color-accent);
  border-radius: 7px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.footer-wordmark {
  font-family: var(--font-display);
  font-size: 17px;
  font-weight: 800;
  color: var(--color-text-primary);
  letter-spacing: -0.3px;
}
.footer-links {
  display: flex;
  gap: 20px;
  flex: 1;
}
.footer-link {
  font-size: 13px;
  color: var(--color-text-muted);
  text-decoration: none;
  transition: color 0.15s;
}
.footer-link:hover,
.footer-link.active {
  color: var(--color-accent);
}
.footer-copy {
  font-size: 12px;
  color: var(--color-text-faint);
}

/* Responsive */
@media (max-width: 860px) {
  .legal-container {
    grid-template-columns: 1fr;
  }
  .toc {
    display: none;
  }
  .legal-main {
    padding: 48px 24px 72px;
  }
  .legal-header {
    padding: 100px 24px 48px;
  }
  .nav {
    padding: 0 24px;
  }
  .cookie-row {
    grid-template-columns: 1fr;
    gap: 4px;
  }
  .cookie-row.header {
    display: none;
  }
}
</style>
