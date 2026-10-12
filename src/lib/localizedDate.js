// Deterministic date localization so Khmer month/weekday names and numerals
// render correctly even on browsers whose Intl build lacks Khmer data.

const KM_MONTHS = [
  'មករា',
  'កុម្ភៈ',
  'មីនា',
  'មេសា',
  'ឧសភា',
  'មិថុនា',
  'កក្កដា',
  'សីហា',
  'កញ្ញា',
  'តុលា',
  'វិច្ឆិកា',
  'ធ្នូ',
]

// Index 0 = Sunday
const KM_WEEKDAYS_SHORT = ['អា', 'ច', 'អ', 'ពុ', 'ព្រ', 'សុ', 'ស']

const KM_DIGITS = ['០', '១', '២', '៣', '៤', '៥', '៦', '៧', '៨', '៩']

export function toKhmerNumerals(value) {
  return String(value).replace(/[0-9]/g, (d) => KM_DIGITS[Number(d)])
}

export function isKhmer(locale) {
  return locale === 'kh'
}

// opts mirrors a subset of Intl.DateTimeFormat options:
// { day, month, year, hour, minute } — truthy = include.
export function formatLocalizedDate(date, locale, opts = {}) {
  if (!isKhmer(locale)) {
    return new Intl.DateTimeFormat('en-US', opts).format(date)
  }

  const parts = []
  if (opts.day) parts.push(toKhmerNumerals(date.getDate()))
  if (opts.month) parts.push(KM_MONTHS[date.getMonth()])
  if (opts.year) parts.push(toKhmerNumerals(date.getFullYear()))

  let out = parts.join(' ')
  if (opts.hour || opts.minute) {
    const hh = String(date.getHours()).padStart(2, '0')
    const mm = String(date.getMinutes()).padStart(2, '0')
    const time = toKhmerNumerals(opts.minute ? `${hh}:${mm}` : hh)
    out = out ? `${out} ${time}` : time
  }
  return out
}

export function weekdayLocalizedShort(date, locale) {
  if (isKhmer(locale)) return KM_WEEKDAYS_SHORT[date.getDay()]
  return new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(date)
}

export function khmersDayNumber(date, locale) {
  return isKhmer(locale) ? toKhmerNumerals(date.getDate()) : String(date.getDate())
}
