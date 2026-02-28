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
        <h1 class="legal-title">Terms of Service</h1>
        <p class="legal-meta">Last updated: February 28, 2026</p>
        <p class="legal-intro">
          These Terms of Service govern your access to and use of Qrserve. By creating an account or
          using the service, you agree to be bound by these terms.
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
          <section id="acceptance" class="legal-section">
            <h2>Acceptance of Terms</h2>
            <p>
              By accessing or using Qrserve ("the Service"), you confirm that you are at least 18
              years old, have the legal authority to enter into this agreement, and agree to these
              Terms of Service in full.
            </p>
            <p>
              If you are using Qrserve on behalf of a business or organization, you represent that
              you have authority to bind that entity to these terms.
            </p>
          </section>

          <section id="description" class="legal-section">
            <h2>Service Description</h2>
            <p>
              Qrserve is a Software-as-a-Service (SaaS) platform that provides restaurant management
              tools including QR code-based ordering, kitchen display systems, staff dashboards,
              menu management, and analytics.
            </p>
            <p>
              We reserve the right to modify, suspend, or discontinue any part of the Service at any
              time with reasonable notice.
            </p>
          </section>

          <section id="accounts" class="legal-section">
            <h2>Accounts</h2>
            <p>To use Qrserve, you must create an account. You are responsible for:</p>
            <ul class="legal-list">
              <li>Providing accurate, complete, and up-to-date information during registration</li>
              <li>Maintaining the security and confidentiality of your login credentials</li>
              <li>All activity that occurs under your account</li>
              <li>Notifying us immediately of any unauthorized access or suspected breach</li>
            </ul>
            <p>
              You may not share your account credentials with others or create accounts for the
              purpose of misusing the Service.
            </p>
          </section>

          <section id="subscriptions" class="legal-section">
            <h2>Subscriptions & Payments</h2>
            <p>
              Qrserve is offered on a subscription basis. The following terms apply to all paid
              plans:
            </p>

            <div class="plan-cards">
              <div class="plan-card">
                <div class="plan-name">Starter</div>
                <div class="plan-price">$29<span>/mo</span></div>
                <p>Up to 15 tables, 3 staff accounts, QR ordering, kitchen & cashier views.</p>
              </div>
              <div class="plan-card featured">
                <div class="plan-badge">Recommended</div>
                <div class="plan-name">Pro</div>
                <div class="plan-price">$59<span>/mo</span></div>
                <p>Unlimited tables, 10 staff accounts, all features, analytics, and promotions.</p>
              </div>
            </div>

            <ul class="legal-list" style="margin-top: 24px">
              <li>
                <strong>Billing cycle:</strong> Subscriptions are billed monthly in advance on your
                subscription start date
              </li>
              <li>
                <strong>Auto-renewal:</strong> Your subscription renews automatically at the end of
                each billing period unless you cancel before the renewal date
              </li>
              <li>
                <strong>Free trial:</strong> We offer a 14-day free trial. No credit card is
                required to start a trial. If you add a payment method and do not cancel before the
                trial ends, you will be charged for the next billing period
              </li>
              <li>
                <strong>Price changes:</strong> We may change subscription prices with at least 30
                days' advance notice. Continued use after the effective date constitutes acceptance
              </li>
              <li>
                <strong>Refunds:</strong> We do not offer refunds for partial billing periods. If
                you cancel mid-cycle, you retain access until the end of the paid period
              </li>
              <li>
                <strong>Failed payments:</strong> If your payment fails, we will attempt to retry.
                Continued failure may result in suspension of your account
              </li>
              <li>
                <strong>Payment processing:</strong> Payments are securely processed by our
                third-party provider. We do not store your full card details on our servers
              </li>
            </ul>
          </section>

          <section id="trial" class="legal-section">
            <h2>Free Trial</h2>
            <p>
              New accounts are eligible for one 14-day free trial. The trial gives you full access
              to the Starter or Pro plan features as selected. We reserve the right to limit or
              revoke trial access if we detect abuse, multiple trial registrations, or violation of
              these terms.
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
              No credit card required to start your free trial.
            </div>
          </section>

          <section id="cancellation" class="legal-section">
            <h2>Cancellation</h2>
            <p>
              You may cancel your subscription at any time from the Settings page in your account
              dashboard.
            </p>
            <ul class="legal-list">
              <li>Cancellation takes effect at the end of the current billing period</li>
              <li>You retain full access to the Service until your paid period ends</li>
              <li>
                After cancellation, your data is retained for 24 months then deleted, unless you
                request earlier deletion
              </li>
              <li>We may suspend or terminate accounts that violate these Terms without refund</li>
            </ul>
          </section>

          <section id="acceptable-use" class="legal-section">
            <h2>Acceptable Use</h2>
            <p>You agree not to use Qrserve to:</p>
            <ul class="legal-list">
              <li>Violate any applicable laws or regulations</li>
              <li>Transmit harmful, fraudulent, or misleading content</li>
              <li>Attempt to gain unauthorized access to our systems or other users' accounts</li>
              <li>Use the Service to harm, harass, or deceive customers or other users</li>
              <li>Reverse engineer, scrape, or replicate any part of the Service</li>
              <li>
                Resell, sublicense, or commercially exploit the Service without our written consent
              </li>
              <li>Upload malicious code, viruses, or any harmful software</li>
            </ul>
            <p>
              We reserve the right to suspend or terminate accounts that violate these terms without
              notice.
            </p>
          </section>

          <section id="your-data" class="legal-section">
            <h2>Your Data</h2>
            <p>
              You retain full ownership of all content and data you input into Qrserve — including
              menu items, order data, and customer information. By using the Service, you grant us a
              limited license to store, process, and display your data solely to provide the Service
              to you.
            </p>
            <p>
              We will not use your restaurant data, menus, or customer information for any
              commercial purpose outside of operating the Service. See our
              <RouterLink to="/privacy" class="inline-link">Privacy Policy</RouterLink> for full
              details on how we handle your data.
            </p>
          </section>

          <section id="uptime" class="legal-section">
            <h2>Service Availability</h2>
            <p>
              We aim to maintain high availability of the Service but do not guarantee uninterrupted
              access. We may perform scheduled or emergency maintenance which could result in
              temporary downtime. We will endeavor to notify users of planned maintenance in
              advance.
            </p>
            <p>
              We are not liable for losses arising from downtime, service interruptions, or
              technical failures beyond our reasonable control.
            </p>
          </section>

          <section id="intellectual-property" class="legal-section">
            <h2>Intellectual Property</h2>
            <p>
              All aspects of Qrserve — including the interface, design, code, branding, and features
              — are the intellectual property of Qrserve and its creator. You may not copy,
              reproduce, or distribute any part of the Service without written permission.
            </p>
            <p>
              Your own content (menus, logos, descriptions) remains your property. We claim no
              ownership over content you create.
            </p>
          </section>

          <section id="limitation" class="legal-section">
            <h2>Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by applicable law, Qrserve and its creator shall not
              be liable for any indirect, incidental, special, or consequential damages — including
              loss of profits, data, or business — arising from your use of or inability to use the
              Service.
            </p>
            <p>
              Our total liability to you for any claims arising from these Terms shall not exceed
              the amount you paid to us in the 3 months preceding the claim.
            </p>
          </section>

          <section id="changes" class="legal-section">
            <h2>Changes to These Terms</h2>
            <p>
              We may update these Terms from time to time. When we make material changes, we will
              notify you via email or a prominent notice in the Service at least 14 days before the
              changes take effect. Continued use of Qrserve after that date constitutes acceptance
              of the updated Terms.
            </p>
          </section>

          <section id="governing-law" class="legal-section">
            <h2>Governing Law</h2>
            <p>
              These Terms are governed by the laws of Cambodia. Any disputes arising from or related
              to these Terms shall be resolved through good-faith negotiation, and if unresolved,
              through the appropriate courts of Cambodia.
            </p>
          </section>

          <section id="contact" class="legal-section">
            <h2>Contact Us</h2>
            <p>If you have questions about these Terms, please contact us:</p>
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
          <RouterLink to="/privacy" class="footer-link">Privacy Policy</RouterLink>
          <RouterLink to="/terms" class="footer-link active">Terms of Service</RouterLink>
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
  { id: 'acceptance', title: 'Acceptance of Terms' },
  { id: 'description', title: 'Service Description' },
  { id: 'accounts', title: 'Accounts' },
  { id: 'subscriptions', title: 'Subscriptions & Payments' },
  { id: 'trial', title: 'Free Trial' },
  { id: 'cancellation', title: 'Cancellation' },
  { id: 'acceptable-use', title: 'Acceptable Use' },
  { id: 'your-data', title: 'Your Data' },
  { id: 'uptime', title: 'Service Availability' },
  { id: 'intellectual-property', title: 'Intellectual Property' },
  { id: 'limitation', title: 'Limitation of Liability' },
  { id: 'changes', title: 'Changes to These Terms' },
  { id: 'governing-law', title: 'Governing Law' },
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

/* Plan cards */
.plan-cards {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-top: 20px;
}
.plan-card {
  background: var(--color-bg-surface);
  border: 1.5px solid var(--color-border-subtle);
  border-radius: 12px;
  padding: 20px;
  position: relative;
  transition: border-color 0.2s;
}
.plan-card.featured {
  border-color: var(--color-accent);
  border-width: 2px;
}
.plan-badge {
  position: absolute;
  top: -11px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--color-accent);
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 3px 12px;
  border-radius: 50px;
  white-space: nowrap;
}
.plan-name {
  font-family: var(--font-display);
  font-size: 18px;
  font-weight: 700;
  color: var(--color-text-primary);
  margin-bottom: 6px;
}
.plan-price {
  font-family: var(--font-display);
  font-size: 36px;
  font-weight: 800;
  color: var(--color-text-primary);
  letter-spacing: -1px;
  margin-bottom: 8px;
}
.plan-price span {
  font-size: 14px;
  color: var(--color-text-faint);
  font-weight: 500;
}
.plan-card p {
  font-size: 13px;
  color: var(--color-text-muted);
  line-height: 1.55;
  margin: 0;
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

.inline-link {
  color: var(--color-accent);
  text-decoration: underline;
  text-decoration-color: var(--color-accent-border);
  transition: opacity 0.15s;
}
.inline-link:hover {
  opacity: 0.8;
}

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
  .plan-cards {
    grid-template-columns: 1fr;
  }
}
</style>
