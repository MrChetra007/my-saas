<template>
  <div v-if="hasAny" class="support-box" :class="{ 'support-box--compact': compact }">
    <div class="support-head">
      <div class="support-title">{{ $t('support.title') }}</div>
      <p v-if="!compact" class="support-desc">{{ $t('support.desc') }}</p>
    </div>

    <div class="support-links">
      <a v-if="phone" :href="telHref(phone)" class="support-link">
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path
            d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"
          />
        </svg>
        <span
          >{{ $t('support.call') }} <b class="support-val">{{ phone }}</b></span
        >
      </a>

      <a
        v-if="facebook"
        :href="facebookUrl(facebook)"
        target="_blank"
        rel="noopener"
        class="support-link"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path
            d="M13.5 21v-8h2.7l.4-3.1h-3.1V7.9c0-.9.25-1.5 1.54-1.5h1.65V3.6c-.29-.04-1.27-.12-2.41-.12-2.39 0-4.02 1.46-4.02 4.13v2.29H7.6V13h2.68v8h3.22z"
          />
        </svg>
        <span>{{ $t('support.facebook') }}</span>
      </a>

      <a
        v-if="telegram"
        :href="telegramUrl(telegram)"
        target="_blank"
        rel="noopener"
        class="support-link"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path
            d="M21.94 4.6l-3.02 14.24c-.23 1.01-.83 1.26-1.68.78l-4.64-3.42-2.24 2.15c-.25.25-.46.46-.94.46l.33-4.73 8.61-7.78c.37-.33-.08-.52-.58-.19L6.9 12.9 2.4 11.5c-.98-.31-1-.98.2-1.45l18.28-7.05c.81-.3 1.52.19 1.06 1.6z"
          />
        </svg>
        <span>{{ $t('support.telegram') }}</span>
      </a>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { supabase } from '@/lib/supabase'

defineProps({
  compact: { type: Boolean, default: false },
})

const phone = ref('')
const facebook = ref('')
const telegram = ref('')

const hasAny = computed(() => !!(phone.value || facebook.value || telegram.value))

function telHref(v) {
  return `tel:${String(v).replace(/[^\d+]/g, '')}`
}

function facebookUrl(v) {
  return /^https?:\/\//i.test(v) ? v : `https://${v}`
}

function telegramUrl(v) {
  if (/^https?:\/\//i.test(v)) return v
  const handle = v.startsWith('@') ? v.slice(1) : v
  return `https://t.me/${handle}`
}

onMounted(async () => {
  try {
    const { data } = await supabase
      .from('platform_settings')
      .select('support_phone, support_facebook, support_telegram')
      .eq('id', true)
      .maybeSingle()
    if (data) {
      phone.value = (data.support_phone || '').trim()
      facebook.value = (data.support_facebook || '').trim()
      telegram.value = (data.support_telegram || '').trim()
    }
  } catch (e) {
    console.warn('Failed to load support contacts', e)
  }
})
</script>

<style scoped>
.support-box {
  width: 100%;
  margin-top: 16px;
  padding: 14px 16px;
  background: #faf9f7;
  border: 1px solid #e8e6e1;
  border-radius: 12px;
}

.support-box--compact {
  padding: 12px 14px;
  margin-top: 12px;
}

.support-head {
  margin-bottom: 10px;
}

.support-title {
  font-size: 13px;
  font-weight: 650;
  color: #1a1917;
}

.support-desc {
  margin: 4px 0 0;
  font-size: 12px;
  line-height: 1.5;
  color: #78736c;
}

.support-links {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.support-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 11px;
  font-size: 12.5px;
  font-weight: 600;
  color: #1a1917;
  background: #fff;
  border: 1px solid #e2dfd9;
  border-radius: 9px;
  text-decoration: none;
  transition:
    border-color 0.15s,
    background 0.15s;
}

.support-link:hover {
  border-color: #f97316;
  background: #fff7ed;
  color: #c2410c;
}

.support-val {
  font-weight: 650;
  color: #c2410c;
}
</style>
