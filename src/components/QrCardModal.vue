<template>
  <Teleport to="body">
    <div v-if="open" class="qc-backdrop" @click.self="emit('close')">
      <div class="qc-modal">
        <div class="qc-header">
          <h2 class="qc-title">{{ $t('tables.chooseDesign', 'Choose a design') }}</h2>
          <button class="qc-close" @click="emit('close')">×</button>
        </div>

        <div v-if="QR_TEMPLATES.length === 0" class="qc-empty">
          No templates found in src/assets/images/qr-templates
        </div>

        <div v-else class="qc-body">
          <!-- Preview -->
          <div class="qc-preview">
            <img v-if="previewUrl" :src="previewUrl" class="qc-preview-img" alt="QR card preview" />
            <div v-else class="qc-spinner" />
          </div>

          <!-- Controls -->
          <div class="qc-controls">
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

            <label class="qc-label" for="qc-headline">{{
              $t('tables.headerText', 'Header text')
            }}</label>
            <input id="qc-headline" v-model="headline" class="qc-input" maxlength="40" />

            <label class="qc-label" for="qc-table">{{
              $t('tables.tableLabel', 'Table label')
            }}</label>
            <input id="qc-table" v-model="tableLabel" class="qc-input" maxlength="30" />

            <label class="qc-label" for="qc-footer">{{
              $t('tables.footerText', 'Footer text')
            }}</label>
            <input id="qc-footer" v-model="footer" class="qc-input" maxlength="50" />
          </div>
        </div>

        <div class="qc-footer">
          <button class="qc-btn-ghost" @click="emit('close')">{{ $t('common.close') }}</button>
          <button
            class="qc-btn-primary"
            :disabled="busy || QR_TEMPLATES.length === 0"
            @click="download"
          >
            {{ busy ? $t('common.saving') : $t('tables.downloadPng') }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, onBeforeUnmount } from 'vue'
import { QR_TEMPLATES, DEFAULT_HEADLINE, renderQrCard, downloadBlob } from '@/lib/qrCard'

const props = defineProps({
  open: { type: Boolean, default: false },
  table: { type: Object, default: null },
  orderUrl: { type: String, default: '' },
})
const emit = defineEmits(['close'])

const selectedId = ref(QR_TEMPLATES[0]?.id ?? '')
const lang = ref('en')
const headline = ref(DEFAULT_HEADLINE.en)
const tableLabel = ref('')
const footer = ref('Powered by QRServe')
const previewUrl = ref('')
const busy = ref(false)

const selectedTemplate = computed(
  () => QR_TEMPLATES.find((t) => t.id === selectedId.value) || QR_TEMPLATES[0],
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
    props.orderUrl,
    selectedId.value,
    headline.value,
    tableLabel.value,
    footer.value,
  ],
  () => {
    clearTimeout(timer)
    if (!props.open || !props.orderUrl || !selectedTemplate.value) return
    timer = setTimeout(async () => {
      const my = ++token
      try {
        const blob = await renderQrCard({
          template: selectedTemplate.value,
          qrUrl: props.orderUrl,
          headline: headline.value,
          tableLabel: tableLabel.value,
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

async function download() {
  if (!selectedTemplate.value) return
  busy.value = true
  try {
    const blob = await renderQrCard({
      template: selectedTemplate.value,
      qrUrl: props.orderUrl,
      headline: headline.value,
      tableLabel: tableLabel.value,
      footer: footer.value,
      scale: 2, // 2160px wide for print
    })
    const safe = (tableLabel.value || 'table').trim().toLowerCase().replace(/\s+/g, '-')
    downloadBlob(blob, `${safe}-design-${selectedTemplate.value.id}.png`)
  } catch (e) {
    console.error('QR download failed', e)
  } finally {
    busy.value = false
  }
}
</script>

<style scoped>
.qc-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1100;
  padding: 20px;
}
.qc-modal {
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-panel);
  box-shadow: var(--shadow-float);
  width: 100%;
  max-width: 820px;
  max-height: 92vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.qc-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 24px;
  border-bottom: 1px solid var(--color-border-subtle);
}
.qc-title {
  font-family: var(--font-display);
  font-size: 20px;
  font-weight: 700;
  margin: 0;
}
.qc-close {
  background: none;
  border: none;
  color: var(--color-text-muted);
  font-size: 24px;
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

.qc-body {
  display: grid;
  grid-template-columns: minmax(0, 300px) minmax(0, 1fr);
  gap: 24px;
  padding: 24px;
  overflow-y: auto;
}
.qc-preview {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  min-height: 300px;
}
.qc-preview-img {
  width: 100%;
  border-radius: 12px;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.35);
}
.qc-spinner {
  width: 28px;
  height: 28px;
  margin-top: 60px;
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
.qc-templates {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(72px, 1fr));
  gap: 10px;
}
.qc-tpl {
  padding: 0;
  border: 2px solid var(--color-border-subtle);
  border-radius: 10px;
  overflow: hidden;
  background: none;
  cursor: pointer;
  transition: all 0.14s;
}
.qc-tpl img {
  display: block;
  width: 100%;
  aspect-ratio: 9 / 16;
  object-fit: cover;
}
.qc-tpl:hover {
  border-color: var(--color-accent-border);
}
.qc-tpl-active {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px var(--color-accent-muted);
}

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

.qc-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid var(--color-border-subtle);
  background: var(--color-bg-elevated);
}
.qc-btn-primary {
  background: var(--color-accent);
  color: white;
  border: none;
  padding: 10px 20px;
  font-weight: 600;
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
  background: transparent;
  border: 1px solid var(--color-border-medium);
  color: var(--color-text-secondary);
  padding: 10px 18px;
  border-radius: var(--radius-pill);
  font-weight: 500;
  cursor: pointer;
}
.qc-btn-ghost:hover {
  border-color: var(--color-accent);
  color: var(--color-accent);
}

@media (max-width: 680px) {
  .qc-body {
    grid-template-columns: 1fr;
  }
  .qc-preview {
    min-height: 0;
  }
  .qc-preview-img {
    max-width: 240px;
  }
}
</style>
