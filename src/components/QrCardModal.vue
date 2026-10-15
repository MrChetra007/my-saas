<template>
  <Teleport to="body">
    <div v-if="open" class="qc-backdrop" @click.self="emit('close')">
      <div class="qc-modal">
        <!-- Header (pinned) -->
        <div class="qc-header">
          <h2 class="qc-title">
            {{
              isBatch
                ? $t('tables.chooseDesignAll', 'Choose a design for all tables')
                : $t('tables.chooseDesign', 'Choose a design')
            }}
          </h2>
          <button class="qc-close" @click="emit('close')">×</button>
        </div>

        <div v-if="QR_TEMPLATES.length === 0" class="qc-empty">
          No templates found in src/assets/images/qr-templates
        </div>

        <!-- Scrollable body (between pinned header and footer) -->
        <div v-else class="qc-body">
          <!-- 1. Live preview -->
          <div class="qc-preview">
            <img v-if="previewUrl" :src="previewUrl" class="qc-preview-img" alt="QR card preview" />
            <div v-else class="qc-spinner" />
          </div>

          <!-- 2-7. Controls -->
          <div class="qc-controls">
            <!-- 2 + 3. Templates -->
            <div class="qc-label">{{ $t('tables.templates', 'Templates') }}</div>
            <div class="qc-templates">
              <button
                v-for="tpl in QR_TEMPLATES"
                :key="tpl.id"
                type="button"
                class="qc-tpl"
                :class="{ 'qc-tpl-active': selectedId === tpl.id }"
                @click="selectedId = tpl.id"
              >
                <img :src="tpl.src" :alt="tpl.name" />
              </button>
            </div>

            <!-- 4. Header language -->
            <div class="qc-label">{{ $t('tables.headerLanguage', 'Header language') }}</div>
            <div class="qc-lang">
              <button
                type="button"
                class="qc-lang-btn"
                :class="{ active: lang === 'en' }"
                @click="lang = 'en'"
              >
                English
              </button>
              <button
                type="button"
                class="qc-lang-btn"
                :class="{ active: lang === 'km' }"
                @click="lang = 'km'"
              >
                ខ្មែរ
              </button>
            </div>

            <!-- 5. Header text -->
            <label class="qc-label" for="qc-headline">{{
              $t('tables.headerText', 'Header text')
            }}</label>
            <input id="qc-headline" v-model="headline" class="qc-input" maxlength="40" />

            <!-- Table label (single-table mode only) -->
            <template v-if="!isBatch">
              <label class="qc-label" for="qc-table">{{
                $t('tables.tableLabel', 'Table label')
              }}</label>
              <input id="qc-table" v-model="tableLabel" class="qc-input" maxlength="30" />
            </template>

            <!-- 6. Footer text -->
            <label class="qc-label" for="qc-footer">{{
              $t('tables.footerText', 'Footer text')
            }}</label>
            <input id="qc-footer" v-model="footer" class="qc-input" maxlength="50" />

            <!-- 7. Helper text -->
            <p v-if="isBatch" class="qc-batch-hint">{{ batchHint }}</p>
          </div>
        </div>

        <!-- Footer (pinned) -->
        <div class="qc-footer">
          <button class="qc-btn-ghost" @click="emit('close')">{{ $t('common.close') }}</button>
          <button
            class="qc-btn-primary"
            :disabled="busy || QR_TEMPLATES.length === 0 || targets.length === 0"
            @click="download"
          >
            {{ primaryLabel }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  QR_TEMPLATES,
  DEFAULT_HEADLINE,
  renderQrCard,
  downloadBlob,
  printQrSheet,
  CARDS_PER_PAGE,
} from '@/lib/qrCard'

const props = defineProps({
  open: { type: Boolean, default: false },
  table: { type: Object, default: null },
  tables: { type: Array, default: null },
  orderUrl: { type: String, default: '' },
  urlFor: { type: Function, default: null },
})
const emit = defineEmits(['close'])
const { t } = useI18n()

const selectedId = ref(QR_TEMPLATES[0]?.id ?? '')
const lang = ref('en')
const headline = ref(DEFAULT_HEADLINE.en)
const tableLabel = ref('')
const footer = ref('Powered by QRServe')
const previewUrl = ref('')
const busy = ref(false)

const selectedTemplate = computed(
  () => QR_TEMPLATES.find((tpl) => tpl.id === selectedId.value) || QR_TEMPLATES[0],
)

// Batch mode: download a designed card for every table at once
const isBatch = computed(() => Array.isArray(props.tables) && props.tables.length > 0)
const targets = computed(() => (isBatch.value ? props.tables : props.table ? [props.table] : []))
const previewTable = computed(() => targets.value[0] || null)
const printCount = computed(() => targets.value.length)

// Text that must always agree with the actual print layout (CARDS_PER_PAGE).
const batchHint = computed(() =>
  t('tables.batchLabelHint', {
    count: printCount.value,
    perPage: CARDS_PER_PAGE,
  }),
)

const primaryLabel = computed(() => {
  if (busy.value) {
    return isBatch.value ? t('tables.preparing', 'Preparing…') : t('common.saving')
  }
  if (!isBatch.value) return t('tables.downloadPng')
  return printCount.value
    ? t('tables.printSheet', { count: printCount.value })
    : t('tables.printSheetPlain', 'Print sheet')
})

function urlForTarget(target) {
  return isBatch.value ? props.urlFor?.(target.id) || '' : props.orderUrl
}

const previewOrderUrl = computed(() => (previewTable.value ? urlForTarget(previewTable.value) : ''))
const previewLabel = computed(() =>
  isBatch.value ? previewTable.value?.name || '' : tableLabel.value,
)

// reset fields each time the modal opens for a table
watch(
  () => [props.open, props.table?.id],
  ([isOpen]) => {
    if (isOpen && props.table) {
      tableLabel.value = props.table.name
    }
  },
  { immediate: true },
)

watch(lang, (l) => {
  headline.value = DEFAULT_HEADLINE[l]
})

// live preview (debounced, ignores stale renders)
let timer = null
let token = 0

function setPreview(url) {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
  previewUrl.value = url
}

watch(
  () => [
    props.open,
    previewOrderUrl.value,
    previewLabel.value,
    selectedId.value,
    headline.value,
    footer.value,
  ],
  () => {
    clearTimeout(timer)
    if (!props.open || !previewOrderUrl.value || !selectedTemplate.value) return
    timer = setTimeout(async () => {
      const my = ++token
      try {
        const blob = await renderQrCard({
          template: selectedTemplate.value,
          qrUrl: previewOrderUrl.value,
          headline: headline.value,
          tableLabel: previewLabel.value,
          footer: footer.value,
          scale: 1,
        })
        if (my !== token) return
        setPreview(URL.createObjectURL(blob))
      } catch (e) {
        console.error('QR preview failed', e)
      }
    }, 150)
  },
  { immediate: true },
)

watch(
  () => props.open,
  (isOpen) => {
    if (!isOpen) setPreview('')
  },
)

onBeforeUnmount(() => {
  clearTimeout(timer)
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
})

async function renderCards(scale) {
  const cards = []
  for (const target of targets.value) {
    const url = urlForTarget(target)
    if (!url) continue
    const label = isBatch.value ? target.name || '' : tableLabel.value
    const blob = await renderQrCard({
      template: selectedTemplate.value,
      qrUrl: url,
      headline: headline.value,
      tableLabel: label,
      footer: footer.value,
      scale,
    })
    cards.push({ blob, label })
  }
  return cards
}

async function download() {
  if (!selectedTemplate.value || !targets.value.length) return
  busy.value = true
  try {
    if (isBatch.value) {
      const cards = await renderCards(1.5)
      printQrSheet(
        cards.map((c) => c.blob),
        { title: 'Table QR Codes' },
      )
    } else {
      const [card] = await renderCards(2)
      if (!card) return
      const safe = (card.label || 'table').trim().toLowerCase().replace(/\s+/g, '-')
      downloadBlob(card.blob, `${safe}-design-${selectedTemplate.value.id}.png`)
    }
  } catch (e) {
    console.error('QR download failed', e)
  } finally {
    busy.value = false
  }
}
</script>

<style scoped>
/* ── Backdrop: bottom sheet on mobile, centered dialog on desktop ── */
.qc-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 1100;
  padding: 0;
}

/* ── Modal: flex column; body scrolls between pinned header & footer ── */
.qc-modal {
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-panel) var(--radius-panel) 0 0;
  box-shadow: var(--shadow-float);
  width: 100%;
  max-height: 100dvh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.qc-header {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 16px;
  border-bottom: 1px solid var(--color-border-subtle);
  background: var(--color-bg-surface);
}
.qc-title {
  font-family: var(--font-display);
  font-size: 17px;
  font-weight: 700;
  margin: 0;
}
.qc-close {
  flex: 0 0 auto;
  background: none;
  border: none;
  color: var(--color-text-muted);
  font-size: 24px;
  line-height: 1;
  cursor: pointer;
  width: 36px;
  height: 36px;
  border-radius: 8px;
}
.qc-close:hover {
  background: var(--color-bg-elevated);
  color: var(--color-text-primary);
}
.qc-empty {
  padding: 40px 24px;
  text-align: center;
  color: var(--color-text-muted);
}

/* Scroll region. Extra bottom padding keeps the last input clear of the footer. */
.qc-body {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px 16px 96px;
}

/* ── 1. Preview card ── */
.qc-preview {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  margin-bottom: 8px;
}
.qc-preview-img {
  display: block;
  width: auto;
  height: auto;
  max-width: 100%;
  max-height: 38dvh;
  aspect-ratio: 3 / 4;
  object-fit: contain;
  border-radius: 12px;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.35);
}
.qc-spinner {
  width: 28px;
  height: 28px;
  margin-top: 40px;
  border: 3px solid var(--color-border-subtle);
  border-top-color: var(--color-accent);
  border-radius: 50%;
  animation: qc-spin 0.9s linear infinite;
}
@keyframes qc-spin {
  to {
    transform: rotate(360deg);
  }
}

/* ── 2-7. Controls ── */
.qc-controls {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.qc-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-secondary);
  margin: 14px 0 8px;
}
.qc-label:first-child {
  margin-top: 0;
}

/* 3. Template thumbnails — horizontal snap scroller */
.qc-templates {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
  padding-bottom: 6px;
}
.qc-tpl {
  flex: 0 0 72px;
  scroll-snap-align: start;
  padding: 0;
  border: 2px solid var(--color-border-subtle);
  border-radius: 10px;
  overflow: hidden;
  background: none;
  cursor: pointer;
  transition:
    border-color 0.14s ease,
    box-shadow 0.14s ease;
}
.qc-tpl img {
  display: block;
  width: 100%;
  aspect-ratio: 3 / 4;
  object-fit: cover;
}
.qc-tpl:hover {
  border-color: var(--color-accent-border);
}
.qc-tpl-active {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px var(--color-accent-muted);
}

/* 4. Language toggle */
.qc-lang {
  display: flex;
  gap: 8px;
}
.qc-lang-btn {
  flex: 1;
  padding: 9px 12px;
  border-radius: var(--radius-pill);
  border: 1px solid var(--color-border-medium);
  background: transparent;
  color: var(--color-text-secondary);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.14s;
}
.qc-lang-btn.active {
  background: var(--color-accent);
  border-color: var(--color-accent);
  color: white;
}

/* 5-6. Inputs */
.qc-input {
  width: 100%;
  padding: 11px 14px;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-medium);
  border-radius: 8px;
  color: var(--color-text-primary);
  font-size: 15px;
}
.qc-input:focus {
  outline: none;
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px var(--color-accent-muted);
}

/* 7. Helper text */
.qc-batch-hint {
  font-size: 12px;
  line-height: 1.5;
  color: var(--color-text-muted);
  margin: 12px 0 2px;
}

/* ── Footer (pinned) ── */
.qc-footer {
  flex: 0 0 auto;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 12px 16px calc(12px + env(safe-area-inset-bottom, 0px));
  border-top: 1px solid var(--color-border-subtle);
  background: var(--color-bg-elevated);
}
.qc-btn-primary {
  flex: 1;
  background: var(--color-accent);
  color: white;
  border: none;
  padding: 12px 20px;
  font-weight: 600;
  font-size: 14px;
  border-radius: var(--radius-pill);
  cursor: pointer;
}
.qc-btn-primary:hover:not(:disabled) {
  background: var(--color-accent-hover);
}
.qc-btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.qc-btn-ghost {
  flex: 0 0 auto;
  background: transparent;
  border: 1px solid var(--color-border-medium);
  color: var(--color-text-secondary);
  padding: 12px 18px;
  border-radius: var(--radius-pill);
  font-weight: 500;
  cursor: pointer;
}
.qc-btn-ghost:hover {
  border-color: var(--color-accent);
  color: var(--color-accent);
}

/* ── Desktop: centered dialog, two columns (sticky preview | controls) ── */
@media (min-width: 768px) {
  .qc-backdrop {
    align-items: center;
    padding: 20px;
  }
  .qc-modal {
    max-width: 820px;
    max-height: 92dvh;
    border-radius: var(--radius-panel);
  }
  .qc-header {
    padding: 18px 24px;
  }
  .qc-title {
    font-size: 20px;
  }
  .qc-body {
    flex-direction: row;
    gap: 24px;
    padding: 24px;
  }
  .qc-preview {
    position: sticky;
    top: 0;
    align-self: flex-start;
    flex: 0 0 300px;
    margin-bottom: 0;
  }
  .qc-preview-img {
    width: 100%;
    max-height: none;
  }
  .qc-controls {
    flex: 1 1 auto;
  }
  .qc-footer {
    padding: 16px 24px;
  }
}
</style>
