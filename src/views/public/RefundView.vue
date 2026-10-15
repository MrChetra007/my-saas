<template>
  <div class="legal-page">
    <div class="noise fixed inset-0 z-0 pointer-events-none opacity-45" />

    <!-- Nav -->
    <nav class="nav" :class="{ scrolled }">
      <div class="nav-inner">
        <RouterLink to="/" class="nav-logo">
          <div class="logo-icon"><img src="/favicon.png" alt="" /></div>
          <span class="logo-wordmark">QRserve</span>
        </RouterLink>
        <RouterLink to="/" class="btn-ghost">← Back to Home</RouterLink>
      </div>
    </nav>

    <!-- Header -->
    <header class="legal-header">
      <div class="legal-header-inner">
        <span class="section-label">Legal</span>
        <h1 class="legal-title">Refund Policy</h1>
        <p class="legal-meta">Last updated: March 01, 2026</p>
        <p class="legal-intro">
          This Refund Policy explains when and how refunds are handled for QRserve subscriptions. We
          want to be fair and transparent — please read this before subscribing.
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
          <section id="general" class="legal-section">
            <h2>General Policy</h2>
            <p>
              QRserve is a subscription-based SaaS product. Because our service is delivered
              digitally and access is granted immediately upon payment, we generally do not offer
              refunds for subscription payments once a billing period has started.
            </p>
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
              All plans include a 14-day free trial — no credit card required. We encourage you to
              fully evaluate QRserve before subscribing.
            </div>
          </section>

          <section id="no-refund" class="legal-section">
            <h2>No Refunds on Paid Periods</h2>
            <p>
              Once a billing period begins and payment has been processed, we do not offer refunds
              for that period. This applies to:
            </p>
            <ul class="legal-list">
              <li>Monthly subscription payments</li>
              <li>Renewals where the subscription was not cancelled before the renewal date</li>
              <li>
                Partial use of a billing period — if you stop using the service mid-cycle, you
                retain access until the period ends but are not entitled to a refund
              </li>
              <li>Upgrades or plan changes mid-cycle</li>
            </ul>
            <p>
              If you wish to stop being charged, you must cancel your subscription from the Settings
              page before your next renewal date.
            </p>
          </section>

          <section id="exceptions" class="legal-section">
            <h2>Exceptions & Goodwill Refunds</h2>
            <p>
              While our standard policy is no refunds, we review requests on a case-by-case basis
              and may issue a refund at our discretion in the following situations:
            </p>
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
                    <path
                      d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                    />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                </div>
                <div>
                  <strong>Accidental Renewal</strong>
                  <p>
                    If you forgot to cancel and were charged for a renewal you did not intend,
                    contact us within 48 hours of the charge and we will consider a refund.
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
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                </div>
                <div>
                  <strong>Extended Service Outage</strong>
                  <p>
                    If QRserve experienced a significant and verified outage lasting more than 72
                    consecutive hours during your paid period, you may be eligible for a pro-rated
                    credit or partial refund.
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
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <div>
                  <strong>Duplicate Charge</strong>
                  <p>
                    If you were charged more than once for the same billing period due to a
                    technical error, we will issue a full refund for the duplicate charge
                    immediately.
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
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0110 0v4" />
                  </svg>
                </div>
                <div>
                  <strong>Legal Requirements</strong>
                  <p>
                    Where required by applicable consumer protection law, we will issue refunds in
                    compliance with those legal obligations.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section id="free-trial" class="legal-section">
            <h2>Free Trial</h2>
            <p>
              All new accounts are eligible for a 14-day free trial with full access to the selected
              plan. No credit card is required to start a trial.
            </p>
            <ul class="legal-list">
              <li>The trial period begins the moment you create your account</li>
              <li>You will not be charged anything during the trial</li>
              <li>If you subscribe after the trial, your first charge occurs at that point</li>
              <li>
                If you do not subscribe, your access simply ends — no charge, no action needed
              </li>
            </ul>
            <p>
              Because we offer a free trial, refund requests based on "I didn't get a chance to try
              it" are not eligible for consideration.
            </p>
          </section>

          <section id="cancellation" class="legal-section">
            <h2>Cancellation</h2>
            <p>
              You can cancel your subscription at any time from the
              <strong>Settings → Billing</strong>
              page in your account dashboard. Cancellation is immediate and:
            </p>
            <ul class="legal-list">
              <li>Your subscription will not renew at the next billing date</li>
              <li>You retain full access to QRserve until the end of your current paid period</li>
              <li>No further charges will be made after cancellation</li>
              <li>Your data is retained for 24 months after account closure</li>
            </ul>
            <p>
              Cancelling your subscription does not automatically trigger a refund for the current
              billing period.
            </p>
          </section>

          <section id="how-to-request" class="legal-section">
            <h2>How to Request a Refund</h2>
            <p>
              If you believe you are eligible for a refund based on the exceptions above, please
              contact us as soon as possible — ideally within 48 hours of the charge in question.
            </p>
            <p>Include the following in your request:</p>
            <ul class="legal-list">
              <li>The email address associated with your QRserve account</li>
              <li>The date and amount of the charge</li>
              <li>A brief explanation of why you are requesting a refund</li>
            </ul>
            <p>
              We aim to respond to all refund requests within 3 business days. Approved refunds are
              processed through Paddle and typically appear on your statement within 5–10 business
              days depending on your bank.
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
                <p class="contact-label">Email for refund requests</p>
                <a href="mailto:sochetra411@gmail.com" class="contact-value"
                  >sochetra411@gmail.com</a
                >
              </div>
            </div>
          </section>

          <section id="payment-provider" class="legal-section">
            <h2>Payment Provider</h2>
            <p>
              All payments for QRserve subscriptions are processed by
              <strong>Paddle</strong>, who acts as the Merchant of Record. This means Paddle handles
              billing, invoicing, and payment processing on our behalf.
            </p>
            <p>
              If you have a billing dispute or do not recognise a charge, you may also contact
              Paddle directly via their buyer support at
              <a
                href="https://www.paddle.com/help/account-billing"
                class="inline-link"
                target="_blank"
                >paddle.com/help</a
              >.
            </p>
          </section>

          <section id="changes" class="legal-section">
            <h2>Changes to This Policy</h2>
            <p>
              We may update this Refund Policy from time to time. Any changes will be posted on this
              page with an updated date. Continued use of QRserve after changes take effect
              constitutes acceptance of the updated policy.
            </p>
          </section>
        </div>
      </div>
    </main>

    <!-- Footer -->
    <footer class="legal-footer">
      <div class="legal-footer-inner">
        <RouterLink to="/" class="footer-logo">
          <div class="footer-icon"><img src="/favicon.png" alt="" /></div>
          <span class="footer-wordmark">QRserve</span>
        </RouterLink>
        <div class="footer-links">
          <RouterLink to="/privacy" class="footer-link">Privacy Policy</RouterLink>
          <RouterLink to="/terms" class="footer-link">Terms of Service</RouterLink>
          <RouterLink to="/refund" class="footer-link active">Refund Policy</RouterLink>
          <RouterLink to="/" class="footer-link">Home</RouterLink>
        </div>
        <p class="footer-copy">© {{ new Date().getFullYear() }} QRserve. All rights reserved.</p>
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
  { id: 'general', title: 'General Policy' },
  { id: 'no-refund', title: 'No Refunds on Paid Periods' },
  { id: 'exceptions', title: 'Exceptions & Goodwill Refunds' },
  { id: 'free-trial', title: 'Free Trial' },
  { id: 'cancellation', title: 'Cancellation' },
  { id: 'how-to-request', title: 'How to Request a Refund' },
  { id: 'payment-provider', title: 'Payment Provider' },
  { id: 'changes', title: 'Changes to This Policy' },
]
</script>

<style scoped>
.legal-page {
  min-height: 100vh;
  background: var(--color-bg-base);
  color: var(--color-text-primary);
  font-family: var(--font-body);
}

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

.contact-card {
  display: flex;
  align-items: center;
  gap: 14px;
  background: var(--color-bg-surface);
  border: 1.5px solid var(--color-border-subtle);
  border-radius: 10px;
  padding: 16px 20px;
  margin-top: 16px;
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

.inline-link {
  color: var(--color-accent);
  text-decoration: underline;
  text-decoration-color: var(--color-accent-border);
  transition: opacity 0.15s;
}
.inline-link:hover {
  opacity: 0.8;
}

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
}
</style>
