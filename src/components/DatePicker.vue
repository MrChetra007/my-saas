<template>
  <div class="dp" ref="root">
    <div
      class="dp-field"
      :class="{ 'is-open': open, 'is-disabled': disabled }"
      role="button"
      tabindex="0"
      @click="toggle"
      @keydown.enter.prevent="toggle"
      @keydown.space.prevent="toggle"
    >
      <CalendarDays :size="15" class="dp-icon" />
      <span class="dp-text" :class="{ 'is-placeholder': !hasValue }">
        {{ hasValue ? displayText : placeholder }}
      </span>
      <button
        v-if="clearable && hasValue && !disabled"
        type="button"
        class="dp-clear"
        :aria-label="$t('datePicker.clear')"
        @click.stop="clear"
      >
        <X :size="13" />
      </button>
    </div>

    <Teleport to="body">
      <div
        v-if="open"
        ref="popover"
        class="dp-popover"
        :style="{ left: pos.left + 'px', top: pos.top + 'px', width: pos.width + 'px' }"
      >
        <div class="dp-head">
          <button
            type="button"
            class="dp-nav"
            :aria-label="$t('datePicker.prevMonth')"
            @click="prevMonth"
          >
            <ChevronLeft :size="16" />
          </button>
          <div class="dp-month">{{ monthLabel }}</div>
          <button
            type="button"
            class="dp-nav"
            :aria-label="$t('datePicker.nextMonth')"
            @click="nextMonth"
          >
            <ChevronRight :size="16" />
          </button>
        </div>

        <div class="dp-weekdays">
          <span v-for="(w, i) in weekdays" :key="i" class="dp-weekday">{{ w }}</span>
        </div>

        <div class="dp-days">
          <button
            v-for="(day, i) in days"
            :key="i"
            type="button"
            class="dp-day"
            :class="{
              'is-empty': day === null,
              'is-selected': day !== null && isSelected(day),
              'is-today': day !== null && isToday(day),
              'is-disabled': day !== null && isDisabledDay(day),
            }"
            :disabled="day === null || isDisabledDay(day)"
            @click="day !== null && selectDay(day)"
          >
            <template v-if="day !== null">{{ dayLabel(day) }}</template>
          </button>
        </div>

        <div class="dp-foot">
          <button type="button" class="dp-foot-btn" @click="selectToday">
            {{ $t('datePicker.today') }}
          </button>
          <button v-if="clearable" type="button" class="dp-foot-btn" @click="clear">
            {{ $t('datePicker.clear') }}
          </button>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { CalendarDays, ChevronLeft, ChevronRight, X } from 'lucide-vue-next'
import { formatLocalizedDate, khmersDayNumber, weekdayLocalizedShort } from '@/lib/localizedDate'

const props = defineProps({
  modelValue: { type: String, default: '' },
  placeholder: { type: String, default: '' },
  min: { type: String, default: '' },
  max: { type: String, default: '' },
  clearable: { type: Boolean, default: true },
  disabled: { type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue'])

const { locale } = useI18n()

function parseISO(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '')
  if (!m) return null
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
}
function toISO(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// ── State ──────────────────────────────────────────────────────────────────
const open = ref(false)
const root = ref(null)
const popover = ref(null)
const pos = ref({ left: 0, top: 0, width: 300 })

const viewYear = ref(new Date().getFullYear())
const viewMonth = ref(new Date().getMonth())

const selected = computed(() => parseISO(props.modelValue))
const hasValue = computed(() => !!selected.value)

const displayText = computed(() => {
  if (!selected.value) return props.placeholder
  return formatLocalizedDate(selected.value, locale.value, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
})

const monthLabel = computed(() =>
  formatLocalizedDate(new Date(viewYear.value, viewMonth.value, 1), locale.value, {
    month: 'long',
    year: 'numeric',
  }),
)

const weekdays = computed(() => {
  // 2021-08-01 is a Sunday → fixed reference week.
  return Array.from({ length: 7 }, (_, i) =>
    weekdayLocalizedShort(new Date(2021, 7, 1 + i), locale.value),
  )
})

const days = computed(() => {
  const y = viewYear.value
  const m = viewMonth.value
  const firstDay = new Date(y, m, 1).getDay()
  const total = new Date(y, m + 1, 0).getDate()
  const cells = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= total; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
})

function isoOf(day) {
  return toISO(new Date(viewYear.value, viewMonth.value, day))
}
function dayLabel(day) {
  return khmersDayNumber(new Date(viewYear.value, viewMonth.value, day), locale.value)
}
function isSelected(day) {
  return isoOf(day) === props.modelValue
}
function isToday(day) {
  return isoOf(day) === toISO(new Date())
}
function isDisabledDay(day) {
  const iso = isoOf(day)
  if (props.min && iso < props.min) return true
  if (props.max && iso > props.max) return true
  return false
}

// ── Actions ────────────────────────────────────────────────────────────────
function toggle() {
  if (props.disabled) return
  open.value = !open.value
}
function selectDay(day) {
  if (isDisabledDay(day)) return
  emit('update:modelValue', isoOf(day))
  open.value = false
}
function selectToday() {
  emit('update:modelValue', toISO(new Date()))
  open.value = false
}
function clear() {
  emit('update:modelValue', '')
  open.value = false
}
function prevMonth() {
  if (viewMonth.value === 0) {
    viewMonth.value = 11
    viewYear.value--
  } else {
    viewMonth.value--
  }
}
function nextMonth() {
  if (viewMonth.value === 11) {
    viewMonth.value = 0
    viewYear.value++
  } else {
    viewMonth.value++
  }
}

// ── Positioning ────────────────────────────────────────────────────────────
function updatePos() {
  const el = root.value
  if (!el) return
  const r = el.getBoundingClientRect()
  const width = Math.min(300, window.innerWidth - 16)
  let left = r.left
  if (left + width > window.innerWidth - 8) left = window.innerWidth - width - 8
  if (left < 8) left = 8
  const h = popover.value?.offsetHeight || 340
  let top = r.bottom + 8
  if (top + h > window.innerHeight - 8) {
    top = r.top - h - 8
    if (top < 8) top = Math.max(8, window.innerHeight - h - 8)
  }
  pos.value = { left, top, width }
}

function onDocPointer(e) {
  if (root.value?.contains(e.target)) return
  if (popover.value?.contains(e.target)) return
  open.value = false
}
function onDocKey(e) {
  if (e.key === 'Escape') open.value = false
}
function attach() {
  window.addEventListener('scroll', updatePos, true)
  window.addEventListener('resize', updatePos)
  document.addEventListener('mousedown', onDocPointer)
  document.addEventListener('keydown', onDocKey)
}
function detach() {
  window.removeEventListener('scroll', updatePos, true)
  window.removeEventListener('resize', updatePos)
  document.removeEventListener('mousedown', onDocPointer)
  document.removeEventListener('keydown', onDocKey)
}

watch(open, (isOpen) => {
  if (isOpen) {
    const base = selected.value || new Date()
    viewYear.value = base.getFullYear()
    viewMonth.value = base.getMonth()
    nextTick(() => {
      updatePos()
      attach()
      updatePos()
    })
  } else {
    detach()
  }
})

onBeforeUnmount(detach)
</script>

<style scoped>
.dp {
  position: relative;
  width: 100%;
}

.dp-field {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 10px 12px;
  background: #0e0e0e;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 10px;
  font-size: 14px;
  color: #ffffff;
  font-family: var(--font-body, 'DM Sans', 'Noto Sans Khmer', sans-serif);
  cursor: pointer;
  transition: all 0.2s ease;
}
.dp-field:hover {
  border-color: rgba(255, 255, 255, 0.22);
}
.dp-field.is-open,
.dp-field:focus-visible {
  outline: none;
  border-color: #c8733a;
  box-shadow: 0 0 0 3px rgba(200, 115, 58, 0.15);
}
.dp-field.is-disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.dp-icon {
  flex-shrink: 0;
  color: rgba(255, 255, 255, 0.4);
}
.dp-text {
  flex: 1;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.dp-text.is-placeholder {
  color: rgba(255, 255, 255, 0.35);
}
.dp-clear {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: rgba(255, 255, 255, 0.4);
  cursor: pointer;
  transition: all 0.15s ease;
}
.dp-clear:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #ffffff;
}

.dp-popover {
  position: fixed;
  z-index: 3000;
  background: #161616;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 14px;
  padding: 14px;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.5);
  font-family: var(--font-body, 'DM Sans', 'Noto Sans Khmer', sans-serif);
  animation: dp-in 0.14s ease;
}
@keyframes dp-in {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

.dp-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}
.dp-month {
  font-size: 14px;
  font-weight: 700;
  color: #ffffff;
}
.dp-nav {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: #0e0e0e;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  transition: all 0.15s ease;
}
.dp-nav:hover {
  background: #c8733a;
  border-color: #c8733a;
  color: #ffffff;
}

.dp-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
  margin-bottom: 4px;
}
.dp-weekday {
  text-align: center;
  font-size: 11px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.4);
  padding: 4px 0;
}

.dp-days {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
}
.dp-day {
  aspect-ratio: 1 / 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.85);
  font-family: var(--font-body, 'DM Sans', 'Noto Sans Khmer', sans-serif);
  cursor: pointer;
  transition: all 0.13s ease;
}
.dp-day:hover:not(.is-empty):not(.is-disabled):not(.is-selected) {
  background: rgba(200, 115, 58, 0.15);
  color: #ffffff;
}
.dp-day.is-today {
  color: #c8733a;
  font-weight: 700;
  box-shadow: inset 0 0 0 1px rgba(200, 115, 58, 0.5);
}
.dp-day.is-selected {
  background: #c8733a;
  color: #ffffff;
  font-weight: 700;
}
.dp-day.is-empty {
  cursor: default;
}
.dp-day.is-disabled {
  color: rgba(255, 255, 255, 0.2);
  cursor: not-allowed;
}

.dp-foot {
  display: flex;
  gap: 8px;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}
.dp-foot-btn {
  flex: 1;
  padding: 8px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: #0e0e0e;
  color: rgba(255, 255, 255, 0.8);
  font-size: 13px;
  font-weight: 600;
  font-family: var(--font-body, 'DM Sans', 'Noto Sans Khmer', sans-serif);
  cursor: pointer;
  transition: all 0.15s ease;
}
.dp-foot-btn:hover {
  border-color: #c8733a;
  color: #c8733a;
}
</style>
