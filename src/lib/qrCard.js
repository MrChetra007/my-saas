import QRCode from 'qrcode'

// Auto-loads every image in assets/images/qr-templates (1.jpeg, 2.jpeg, 3.png, ...)
const modules = import.meta.glob('../assets/images/qr-templates/*.{jpeg,jpg,png,webp}', {
  eager: true,
  import: 'default',
})

// Text colors per template. Key = file name without extension.
// Any template not listed here uses DEFAULT_STYLE, so you can add files first and tune colors later.
const DEFAULT_STYLE = {
  headlineColor: '#222222',
  tableColor: '#222222',
  footerColor: '#666666',
}

const TEMPLATE_STYLES = {
  1: { headlineColor: '#5B4636', tableColor: '#4F6B52', footerColor: '#8A7560' },
  2: { headlineColor: '#ffffff', tableColor: '#ffffff', footerColor: '#ffffff' },
  3: { headlineColor: '#ffffff', tableColor: '#ffffff', footerColor: '#ffffff' },
}

export const QR_TEMPLATES = Object.entries(modules)
  .map(([path, src]) => {
    const file = path.split('/').pop()
    const id = file.replace(/\.[^.]+$/, '')
    return { id, name: `Design ${id}`, src, ...(TEMPLATE_STYLES[id] || DEFAULT_STYLE) }
  })
  .sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }))

export const DEFAULT_HEADLINE = {
  en: 'Scan to Order',
  km: 'ស្កេនដើម្បីបញ្ជាទិញ',
}

// ── Layout (fractions, so any template resolution works) ──
const BASE_W = 1080
const PLATE_X = 0.176 // of width
const PLATE_Y = 0.32 // of height
const PLATE_SIZE = 0.648 // of width
const PLATE_PAD = 50 // quiet zone in BASE_W units
const HEADLINE_Y = 0.176 // of height
const TABLE_Y = 0.749
const FOOTER_Y = 0.847
const TEXT_MAX_W = 0.65 // of width

const FONT = '"Noto Sans Khmer", "DM Sans", sans-serif'

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

function fitFont(ctx, text, weight, startSize, maxWidth, minSize = 24) {
  let size = startSize
  while (size > minSize) {
    ctx.font = `${weight} ${size}px ${FONT}`
    if (ctx.measureText(text).width <= maxWidth) break
    size -= 2
  }
  ctx.font = `${weight} ${size}px ${FONT}`
}

export async function renderQrCard({ template, qrUrl, headline, tableLabel, footer, scale = 1 }) {
  // make sure Khmer glyphs are loaded before drawing
  try {
    await Promise.all([
      document.fonts.load('700 60px "Noto Sans Khmer"', 'តុស្កេន០១២'),
      document.fonts.load('500 30px "Noto Sans Khmer"', 'តុស្កេន០១២'),
      document.fonts.load('700 60px "DM Sans"', 'Table Scan'),
      document.fonts.load('500 30px "DM Sans"', 'Powered'),
    ])
  } catch {
    /* fall back to system fonts */
  }

  const bg = await loadImage(template.src)
  const W = BASE_W
  const H = Math.round(BASE_W * (bg.height / bg.width))

  const canvas = document.createElement('canvas')
  canvas.width = W * scale
  canvas.height = H * scale
  const ctx = canvas.getContext('2d')
  ctx.scale(scale, scale)
  ctx.imageSmoothingQuality = 'high'

  // 1. background design
  ctx.drawImage(bg, 0, 0, W, H)

  // 2. white plate (covers the AI-drawn white square)
  const plateX = W * PLATE_X
  const plateY = H * PLATE_Y
  const plateSize = W * PLATE_SIZE
  ctx.fillStyle = '#FFFFFF'
  ctx.beginPath()
  ctx.roundRect(plateX, plateY, plateSize, plateSize, 28)
  ctx.fill()

  // 3. real QR, generated at the exact final pixel size
  const qrSize = plateSize - PLATE_PAD * 2
  const qrCanvas = document.createElement('canvas')
  await QRCode.toCanvas(qrCanvas, qrUrl, {
    width: Math.round(qrSize * scale),
    margin: 0,
    errorCorrectionLevel: 'M',
    color: { dark: '#000000', light: '#FFFFFF' },
  })
  ctx.drawImage(qrCanvas, plateX + PLATE_PAD, plateY + PLATE_PAD, qrSize, qrSize)

  // 4. text
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  const maxW = W * TEXT_MAX_W

  if (headline) {
    ctx.fillStyle = template.headlineColor
    fitFont(ctx, headline, 700, 96, maxW, 40)
    ctx.fillText(headline, W / 2, H * HEADLINE_Y)
  }

  if (tableLabel) {
    ctx.fillStyle = template.tableColor
    fitFont(ctx, tableLabel, 700, 104, maxW, 40)
    ctx.fillText(tableLabel, W / 2, H * TABLE_Y)
  }

  if (footer) {
    ctx.fillStyle = template.footerColor
    fitFont(ctx, footer, 500, 34, maxW, 20)
    ctx.fillText(footer, W / 2, H * FOOTER_Y)
  }

  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/png'),
  )
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

// Prints card images onto A4 portrait pages, 3 columns x 3 rows (9 per page).
// Uses the top-level window.print() with a print-only container. This is the
// only approach that works on iOS: printing an iframe (iframe.contentWindow
// .print()) makes iOS WebKit print the parent page instead, and some in-app
// browsers block iframe printing entirely.
let qrPrintCleanupTimer = null

export function printQrSheet(blobs, { title = 'QR codes', perPage = 9 } = {}) {
  if (!blobs?.length || typeof document === 'undefined') return

  const urls = blobs.map((b) => URL.createObjectURL(b))

  const pages = []
  for (let i = 0; i < urls.length; i += perPage) {
    const cells = urls
      .slice(i, i + perPage)
      .map((u) => `<div class="qr-print-card"><img src="${u}" alt="" /></div>`)
      .join('')
    pages.push(`<section class="qr-print-sheet">${cells}</section>`)
  }

  document.getElementById('qr-print-root')?.remove()
  document.getElementById('qr-print-style')?.remove()

  const style = document.createElement('style')
  style.id = 'qr-print-style'
  style.textContent = `
    #qr-print-root {
      position: fixed;
      left: -100000px;
      top: 0;
      background: #fff;
    }
    #qr-print-root .qr-print-sheet {
      width: 190mm;
      height: 274mm;
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      grid-template-rows: repeat(3, 1fr);
      gap: 6mm;
      page-break-after: always;
      break-after: page;
    }
    #qr-print-root .qr-print-sheet:last-child {
      page-break-after: auto;
      break-after: auto;
    }
    #qr-print-root .qr-print-card {
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }
    #qr-print-root .qr-print-card img {
      max-width: 100%;
      max-height: 100%;
      display: block;
    }
    @page { size: A4 portrait; margin: 10mm; }
    @media print {
      html, body { margin: 0 !important; padding: 0 !important; background: #fff !important; }
      body.qr-printing > *:not(#qr-print-root) { display: none !important; }
      #qr-print-root { position: static !important; left: auto !important; }
    }
  `

  const root = document.createElement('div')
  root.id = 'qr-print-root'
  root.innerHTML = pages.join('')

  document.head.appendChild(style)
  document.body.appendChild(root)

  const previousTitle = document.title
  document.title = title

  let cleaned = false
  const cleanup = () => {
    if (cleaned) return
    cleaned = true
    document.title = previousTitle
    document.body.classList.remove('qr-printing')
    urls.forEach((u) => URL.revokeObjectURL(u))
    root.remove()
    style.remove()
    if (qrPrintCleanupTimer) {
      clearTimeout(qrPrintCleanupTimer)
      qrPrintCleanupTimer = null
    }
  }

  const run = () => {
    document.body.classList.add('qr-printing')
    // iOS fires afterprint as soon as the dialog opens, so keep the node in the
    // DOM long enough for the print preview to capture it, then clean up.
    window.addEventListener('afterprint', () => setTimeout(cleanup, 5000), { once: true })
    try {
      window.print()
    } catch (e) {
      cleanup()
      throw e
    }
    qrPrintCleanupTimer = setTimeout(cleanup, 60000)
  }

  const images = Array.from(root.querySelectorAll('img'))
  if (images.length === 0) {
    setTimeout(run, 150)
    return
  }

  let remaining = images.length
  const done = () => {
    if (--remaining === 0) setTimeout(run, 150)
  }
  images.forEach((img) => {
    if (img.complete && img.naturalWidth) {
      done()
    } else {
      img.onload = done
      img.onerror = done
    }
  })
}
