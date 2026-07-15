<template>
  <div class="pap">
    <div class="pap-header">
      <h3 class="pap-title">{{ $t('superAdmin.pendingApprovals.title') }}</h3>
      <span class="pap-count" v-if="items.length">{{ items.length }}</span>
    </div>

    <div v-if="loading" class="pap-loading">
      <div class="pap-skeleton" v-for="i in 3" :key="i" />
    </div>

    <div v-else-if="items.length === 0" class="pap-empty">
      {{ $t('superAdmin.pendingApprovals.empty') }}
    </div>

    <div v-else class="pap-list">
      <div v-for="inv in items" :key="inv.id" class="pap-card">
        <div class="pap-card-top">
          <div class="pap-restaurant">
            <div class="pap-avatar">{{ inv.restaurant_name?.[0]?.toUpperCase() || '?' }}</div>
            <div>
              <div class="pap-restaurant-name">{{ inv.restaurant_name }}</div>
              <div class="pap-plan">{{ inv.plan_id }} — ${{ inv.total_amount }}</div>
            </div>
          </div>
          <span class="pap-time" :title="inv.submitted_at">
            {{ timeAgo(inv.submitted_at) }}
          </span>
        </div>

        <div class="pap-proof" v-if="inv.proof_url">
          <button class="pap-proof-btn" @click="viewProof(inv)">
            {{ $t('superAdmin.pendingApprovals.viewProof') }}
          </button>
        </div>

        <div class="pap-actions">
          <button class="pap-btn pap-btn-approve" :disabled="actioning === inv.id" @click="approve(inv)">
            {{ actioning === inv.id ? $t('superAdmin.pendingApprovals.approving') : $t('superAdmin.pendingApprovals.approve') }}
          </button>
          <button class="pap-btn pap-btn-reject" :disabled="actioning === inv.id" @click="openReject(inv)">
            {{ $t('superAdmin.pendingApprovals.reject') }}
          </button>
        </div>

        <div v-if="rejectTarget === inv.id" class="pap-reject-form">
          <textarea v-model="rejectReason" class="pap-reject-input" :placeholder="$t('superAdmin.pendingApprovals.rejectPlaceholder')" rows="2" />
          <div class="pap-reject-actions">
            <button class="pap-btn pap-btn-cancel" @click="closeReject">{{ $t('superAdmin.pendingApprovals.cancel') }}</button>
            <button class="pap-btn pap-btn-reject" :disabled="!rejectReason.trim()" @click="reject(inv)">
              {{ $t('superAdmin.pendingApprovals.confirmReject') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- ── Proof image lightbox ────────────────────────── -->
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="showProofModal" class="pl-backdrop" @click.self="closeProofModal" @keydown.escape="closeProofModal">
        <div class="pl-modal">
          <button class="pl-close" @click="closeProofModal">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
          <div class="pl-caption" v-if="activeProof">
            <span class="pl-restaurant">{{ activeProof.restaurant_name }}</span>
            <span class="pl-sep">·</span>
            <span class="pl-plan">{{ activeProof.plan_id }} — ${{ activeProof.total_amount }}</span>
          </div>
          <div class="pl-image-wrap">
            <img v-if="activeProofUrl" :src="activeProofUrl" class="pl-image" alt="Payment proof" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'
import { useI18n } from 'vue-i18n'

const authStore = useAuthStore()
const { t } = useI18n()

const emit = defineEmits(['approved', 'rejected'])

const items = ref([])
const loading = ref(true)
const actioning = ref(null)
const showProofModal = ref(false)
const activeProof = ref(null)
const activeProofUrl = ref(null)
const rejectTarget = ref(null)
const rejectReason = ref('')
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL

async function fetchPending() {
  loading.value = true
  try {
    const { data, error } = await supabase
      .from('subscription_invoices')
      .select(`
        id, restaurant_id, plan_id, total_amount, proof_url, submitted_at,
        restaurants!inner(name)
      `)
      .eq('status', 'pending_review')
      .order('submitted_at', { ascending: false })

    if (error) throw error
    items.value = (data || []).map((inv) => ({
      ...inv,
      restaurant_name: inv.restaurants?.name || 'Unknown',
    }))
  } catch (err) {
    console.error('fetchPending error:', err)
  } finally {
    loading.value = false
  }
}

async function viewProof(inv) {
  if (!inv.proof_url) return
  const { data } = await supabase.storage
    .from('payment-proofs')
    .createSignedUrl(inv.proof_url, 300)
  if (data?.signedUrl) {
    activeProof.value = inv
    activeProofUrl.value = data.signedUrl
    showProofModal.value = true
  }
}

function closeProofModal() {
  showProofModal.value = false
}

function onKeydown(e) {
  if (e.key === 'Escape' && showProofModal.value) closeProofModal()
}

async function approve(inv) {
  actioning.value = inv.id
  try {
    const token = (await supabase.auth.getSession()).data.session?.access_token
    const res = await fetch(`${supabaseUrl}/functions/v1/approve-invoice`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ invoice_id: inv.id }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Approval failed')
    items.value = items.value.filter((i) => i.id !== inv.id)
    emit('approved', inv)
  } catch (err) {
    console.error('approve error:', err)
    alert('Failed: ' + err.message)
  } finally {
    actioning.value = null
  }
}

function openReject(inv) {
  rejectTarget.value = inv.id
  rejectReason.value = ''
}

function closeReject() {
  rejectTarget.value = null
  rejectReason.value = ''
}

async function reject(inv) {
  actioning.value = inv.id
  try {
    const token = (await supabase.auth.getSession()).data.session?.access_token
    const res = await fetch(`${supabaseUrl}/functions/v1/reject-invoice`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        invoice_id: inv.id,
        reason: rejectReason.value.trim() || null,
      }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Rejection failed')
    items.value = items.value.filter((i) => i.id !== inv.id)
    closeReject()
    emit('rejected', inv)
  } catch (err) {
    console.error('reject error:', err)
    alert('Failed: ' + err.message)
  } finally {
    actioning.value = null
  }
}

function timeAgo(dateStr) {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return t('superAdmin.pendingApprovals.justNow')
  if (mins < 60) return t('superAdmin.pendingApprovals.minAgo', { n: mins })
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return t('superAdmin.pendingApprovals.hrAgo', { n: hrs })
  const days = Math.floor(hrs / 24)
  return t('superAdmin.pendingApprovals.dayAgo', { n: days })
}

onMounted(() => {
  fetchPending()
  document.addEventListener('keydown', onKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', onKeydown)
})
</script>

<style scoped>
.pap {
  background: #fff;
  border: 1px solid #e8e6e1;
  border-radius: 14px;
  overflow: hidden;
}
.pap-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 16px;
  border-bottom: 1px solid #f0ede8;
}
.pap-title {
  font-size: 15px;
  font-weight: 650;
  color: #1a1917;
  margin: 0;
}
.pap-count {
  font-size: 11px;
  font-weight: 700;
  background: #fff7ed;
  color: #c2410c;
  padding: 2px 8px;
  border-radius: 20px;
}
.pap-loading {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px;
}
.pap-skeleton {
  height: 120px;
  border-radius: 10px;
  background: linear-gradient(90deg, #f3f1ee 25%, #e8e6e1 50%, #f3f1ee 75%);
  background-size: 200% 100%;
  animation: papShimmer 1.4s infinite;
}
@keyframes papShimmer { from { background-position: 200% 0; } to { background-position: -200% 0; } }
.pap-empty {
  padding: 32px 16px;
  text-align: center;
  font-size: 13px;
  color: #a8a49e;
}
.pap-list {
  display: flex;
  flex-direction: column;
}
.pap-card {
  padding: 14px 16px;
  border-bottom: 1px solid #f0ede8;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.pap-card:last-child { border-bottom: none; }
.pap-card-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}
.pap-restaurant {
  display: flex;
  align-items: center;
  gap: 10px;
}
.pap-avatar {
  width: 34px;
  height: 34px;
  min-width: 34px;
  border-radius: 9px;
  background: #f97316;
  color: white;
  font-size: 14px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}
.pap-restaurant-name {
  font-size: 13.5px;
  font-weight: 600;
  color: #1a1917;
}
.pap-plan {
  font-size: 12px;
  color: #6b6963;
  margin-top: 2px;
}
.pap-time {
  font-size: 11px;
  color: #a8a49e;
  white-space: nowrap;
  flex-shrink: 0;
}
.pap-proof {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.pap-proof-btn {
  align-self: flex-start;
  font-size: 12px;
  font-weight: 600;
  color: #f97316;
  background: transparent;
  border: 1px solid #fed7aa;
  border-radius: 7px;
  padding: 5px 12px;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.12s;
}
.pap-proof-btn:hover {
  background: #fff7ed;
}
.pap-actions {
  display: flex;
  gap: 8px;
}
.pap-btn {
  height: 34px;
  padding: 0 14px;
  border-radius: 8px;
  font-size: 12.5px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.12s;
  border: none;
}
.pap-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.pap-btn-approve {
  background: #15803d;
  color: white;
}
.pap-btn-approve:hover:not(:disabled) { background: #166534; }
.pap-btn-reject {
  background: #fff1f2;
  color: #e11d48;
  border: 1px solid #fecdd3;
}
.pap-btn-reject:hover:not(:disabled) { background: #ffe4e6; }
.pap-btn-cancel {
  background: #f3f1ee;
  color: #6b6963;
}
.pap-btn-cancel:hover { background: #e8e6e1; }
.pap-reject-form {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px;
  background: #fafaf9;
  border-radius: 8px;
  border: 1px solid #fecdd3;
}
.pap-reject-input {
  border: 1px solid #e8e6e1;
  border-radius: 8px;
  padding: 8px 10px;
  font-size: 13px;
  font-family: inherit;
  color: #1a1917;
  outline: none;
  resize: vertical;
  min-height: 50px;
}
.pap-reject-input:focus {
  border-color: #f97316;
}
.pap-reject-actions {
  display: flex;
  gap: 6px;
  justify-content: flex-end;
}

/* ── Proof lightbox ────────────────────────────── */
.pl-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(5px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}
.pl-modal {
  position: relative;
  display: flex;
  flex-direction: column;
  max-width: 90vw;
  max-height: 90vh;
}
.pl-close {
  position: absolute;
  top: -40px;
  right: 0;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.14s;
  z-index: 1;
}
.pl-close:hover {
  background: rgba(255, 255, 255, 0.2);
}
.pl-caption {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 0 10px;
  color: rgba(255, 255, 255, 0.85);
  font-size: 13px;
}
.pl-restaurant {
  font-weight: 600;
}
.pl-sep {
  color: rgba(255, 255, 255, 0.35);
}
.pl-plan {
  color: rgba(255, 255, 255, 0.7);
}
.pl-image-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  overflow: hidden;
  background: rgba(0, 0, 0, 0.3);
}
.pl-image {
  max-width: 85vw;
  max-height: 78vh;
  object-fit: contain;
  border-radius: 8px;
}

/* ── Modal transition ──────────────────────────── */
.modal-enter-active {
  transition: opacity 0.2s;
}
.modal-leave-active {
  transition: opacity 0.18s;
}
.modal-enter-active .pl-modal {
  transition: transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.2s;
}
.modal-leave-active .pl-modal {
  transition: transform 0.18s ease-in, opacity 0.18s;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
.modal-enter-from .pl-modal {
  transform: scale(0.94) translateY(10px);
  opacity: 0;
}
.modal-leave-to .pl-modal {
  transform: scale(0.97);
  opacity: 0;
}
</style>
