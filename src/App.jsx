import { useState, useRef, useCallback } from 'react'
import Anthropic from '@anthropic-ai/sdk'
import './App.css'

const client = new Anthropic({
  apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY,
  dangerouslyAllowBrowser: true,
})

const SYSTEM_PROMPT = `You are an expert nail artist and color analyst with 15+ years of experience. When given a photo of a hand, analyze:
1. Skin tone (warm/cool/neutral undertone)
2. Hand and finger proportions
3. Lifestyle cues from context

Return ONLY a JSON object with this exact structure (no markdown, no explanation):
{
  "skinTone": "warm/cool/neutral",
  "skinDescription": "one sentence describing the skin tone",
  "recommendedShape": "Almond/Oval/Square/Coffin/Stiletto/Round/Squoval",
  "shapeReason": "one sentence why this shape suits the hand",
  "colorPalette": [
    {"name": "Color Name", "hex": "#XXXXXX", "mood": "elegant/playful/bold/soft"},
    {"name": "Color Name", "hex": "#XXXXXX", "mood": "elegant/playful/bold/soft"},
    {"name": "Color Name", "hex": "#XXXXXX", "mood": "elegant/playful/bold/soft"},
    {"name": "Color Name", "hex": "#XXXXXX", "mood": "elegant/playful/bold/soft"}
  ],
  "designSuggestions": [
    {"title": "Design Name", "description": "brief description", "complexity": "Simple/Medium/Complex"},
    {"title": "Design Name", "description": "brief description", "complexity": "Simple/Medium/Complex"},
    {"title": "Design Name", "description": "brief description", "complexity": "Simple/Medium/Complex"}
  ],
  "stylePersonality": "one evocative sentence about the client's aesthetic"
}`

// Nail shape border-radius map
const shapeBorderRadius = {
  Almond:   '50% 50% 45% 45% / 60% 60% 40% 40%',
  Oval:     '50% 50% 40% 40% / 55% 55% 45% 45%',
  Square:   '4px 4px 4px 4px',
  Coffin:   '40% 40% 4px 4px',
  Stiletto: '50% 50% 20% 20% / 70% 70% 30% 30%',
  Round:    '50% 50% 40% 40% / 50% 50% 50% 50%',
  Squoval:  '30% 30% 8px 8px',
}

// Design patterns per index (0=Simple, 1=Medium, 2=Complex)
function NailPreview({ index, colors, shape, complexity }) {
  const br = shapeBorderRadius[shape] || '50% 50% 40% 40% / 55% 55% 45% 45%'
  const nails = [0, 1, 2, 3, 4]

  function getNailStyle(nailIdx) {
    const base = colors[nailIdx % colors.length] || '#c9a87c'
    const accent = colors[(nailIdx + 2) % colors.length] || '#f0e8e0'

    if (index === 0) {
      // Simple — solid color, accent on ring finger
      return {
        background: nailIdx === 3 ? accent : base,
      }
    }
    if (index === 1) {
      // Medium — french tip effect (lighter tip)
      return {
        background: `linear-gradient(to top, ${base} 65%, ${lighten(base)} 65%)`,
      }
    }
    // Complex — gradient + subtle pattern
    return {
      background: `linear-gradient(135deg, ${base} 0%, ${accent} 50%, ${base} 100%)`,
    }
  }

  return (
    <div className="nail-preview">
      {nails.map(i => (
        <div
          key={i}
          className="nail-shape"
          style={{
            borderRadius: br,
            ...getNailStyle(i),
          }}
        />
      ))}
    </div>
  )
}

function lighten(hex) {
  try {
    const n = parseInt(hex.replace('#', ''), 16)
    const r = Math.min(255, ((n >> 16) & 0xff) + 60)
    const g = Math.min(255, ((n >> 8) & 0xff) + 60)
    const b = Math.min(255, (n & 0xff) + 60)
    return `rgb(${r},${g},${b})`
  } catch {
    return '#f0e8e0'
  }
}

const T = {
  ru: {
    heroTitle1: 'Ваши руки.',
    heroTitle2: 'Идеальный маникюр.',
    heroSub: 'Загрузите фото рук — AI подберёт форму, палитру и дизайн, созданные именно для вас.',
    dropText: 'Перетащите фото или нажмите для выбора',
    dropHint: 'JPG, PNG — лучше при дневном освещении',
    changePhoto: 'Изменить фото',
    analyzeBtn: 'Подобрать дизайн',
    loading: 'Анализирую…',
    error: 'Ошибка при анализе изображения. Проверьте API-ключ или попробуйте снова.',
    backBtn: '← Новый анализ',
    paletteTitle: 'Цветовая палитра',
    designsTitle: 'Дизайн-решения',
    ctaTitle: 'Воплотить в жизнь?',
    ctaSub: 'Ваш AI-анализ отправится мастеру до записи.',
    ctaBtn: 'Kamala Studio Wien',
    saveBtn: 'Сохранить результат',
    footer: 'NAÏL AI — Красота, персонализированная технологией',
    poweredBy: 'Powered by AI',
  },
  en: {
    heroTitle1: 'Your hands.',
    heroTitle2: 'Perfect nails.',
    heroSub: 'Upload a photo of your hands — AI will select the shape, palette and design created just for you.',
    dropText: 'Drag a photo here or click to choose',
    dropHint: 'JPG, PNG — best in daylight',
    changePhoto: 'Change photo',
    analyzeBtn: 'Find my design',
    loading: 'Analyzing…',
    error: 'Error analyzing image. Check your API key or try again.',
    backBtn: '← New analysis',
    paletteTitle: 'Color palette',
    designsTitle: 'Design suggestions',
    ctaTitle: 'Ready to make it real?',
    ctaSub: 'Your AI analysis will be sent to the master before booking.',
    ctaBtn: 'Kamala Studio Wien',
    saveBtn: 'Save result',
    footer: 'NAÏL AI — Beauty personalized by technology',
    poweredBy: 'Powered by AI',
  },
  de: {
    heroTitle1: 'Ihre Hände.',
    heroTitle2: 'Perfekte Nägel.',
    heroSub: 'Laden Sie ein Foto Ihrer Hände hoch — KI wählt Form, Palette und Design speziell für Sie.',
    dropText: 'Foto hierher ziehen oder zum Auswählen klicken',
    dropHint: 'JPG, PNG — am besten bei Tageslicht',
    changePhoto: 'Foto ändern',
    analyzeBtn: 'Design finden',
    loading: 'Analysiere…',
    error: 'Fehler bei der Bildanalyse. Überprüfen Sie den API-Schlüssel oder versuchen Sie es erneut.',
    backBtn: '← Neue Analyse',
    paletteTitle: 'Farbpalette',
    designsTitle: 'Design-Vorschläge',
    ctaTitle: 'Bereit zum Umsetzen?',
    ctaSub: 'Ihre KI-Analyse wird vor der Buchung an die Meisterin gesendet.',
    ctaBtn: 'Kamala Studio Wien',
    saveBtn: 'Ergebnis speichern',
    footer: 'NAÏL AI — Schönheit, personalisiert durch Technologie',
    poweredBy: 'Powered by AI',
  },
}

const shapeIcons = {
  Almond: '🌿',
  Oval: '🥚',
  Square: '⬛',
  Coffin: '🔮',
  Stiletto: '✦',
  Round: '⭕',
  Squoval: '◻️',
}

const complexityStyle = {
  Simple: { color: '#4ade80', bg: 'rgba(74,222,128,0.1)', border: 'rgba(74,222,128,0.3)' },
  Medium: { color: '#facc15', bg: 'rgba(250,204,21,0.1)', border: 'rgba(250,204,21,0.3)' },
  Complex: { color: '#f87171', bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.3)' },
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const base64 = reader.result.split(',')[1]
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default function App() {
  const [screen, setScreen] = useState('upload')
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const [lang, setLang] = useState('ru')
  const t = T[lang]
  const fileInputRef = useRef(null)

  const handleFile = useCallback((file) => {
    if (!file || !file.type.startsWith('image/')) return
    setImageFile(file)
    setError(null)
    if (imagePreview) URL.revokeObjectURL(imagePreview)
    setImagePreview(URL.createObjectURL(file))
  }, [imagePreview])

  const handleFileChange = (e) => handleFile(e.target.files[0])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setIsDragging(false)
    handleFile(e.dataTransfer.files[0])
  }, [handleFile])

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true) }
  const handleDragLeave = () => setIsDragging(false)

  const analyzeImage = async () => {
    if (!imageFile) return
    setLoading(true)
    setError(null)
    try {
      const base64 = await fileToBase64(imageFile)
      const mediaType = imageFile.type || 'image/jpeg'

      const response = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mediaType, data: base64 },
            },
            {
              type: 'text',
              text: 'Analyze this hand photo and provide nail design recommendations.',
            },
          ],
        }],
      })

      let raw = response.content[0].text
      raw = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim()
      const data = JSON.parse(raw)
      setAnalysis(data)
      setScreen('results')
    } catch (err) {
      console.error(err)
      setError('Ошибка при анализе изображения. Проверьте API-ключ или попробуйте снова.')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setScreen('upload')
    setImageFile(null)
    if (imagePreview) URL.revokeObjectURL(imagePreview)
    setImagePreview(null)
    setAnalysis(null)
    setError(null)
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-inner">
          <div className="logo">NAÏL<span>AI</span></div>
          <div className="header-right">
            <div className="lang-switcher">
              {['ru', 'en', 'de'].map(l => (
                <button
                  key={l}
                  className={`lang-btn${lang === l ? ' active' : ''}`}
                  onClick={() => setLang(l)}
                >
                  {l.toUpperCase()}
                </button>
              ))}
            </div>
            <div className="powered-by">{t.poweredBy}</div>
          </div>
        </div>
      </header>

      <main className="main">
        {screen === 'upload' && (
          <UploadScreen
            t={t}
            imagePreview={imagePreview}
            loading={loading}
            error={error}
            isDragging={isDragging}
            fileInputRef={fileInputRef}
            onFileChange={handleFileChange}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onAnalyze={analyzeImage}
          />
        )}
        {screen === 'results' && analysis && (
          <ResultsScreen
            t={t}
            analysis={analysis}
            imagePreview={imagePreview}
            onReset={handleReset}
          />
        )}
      </main>

      <footer className="footer">
        {t.footer}
      </footer>
    </div>
  )
}

function UploadScreen({
  t, imagePreview, loading, error, isDragging,
  fileInputRef, onFileChange, onDrop, onDragOver, onDragLeave, onAnalyze,
}) {
  return (
    <div className="upload-screen">
      <div className="hero">
        <h1 className="hero-title">
          {t.heroTitle1}<br />
          <em>{t.heroTitle2}</em>
        </h1>
        <p className="hero-subtitle">{t.heroSub}</p>
      </div>

      <div
        className={`drop-zone${isDragging ? ' dragging' : ''}${imagePreview ? ' has-image' : ''}`}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onClick={() => !imagePreview && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={onFileChange}
          style={{ display: 'none' }}
        />
        {imagePreview ? (
          <div className="preview-wrap">
            <img src={imagePreview} alt="Preview" className="preview-img" />
            <button
              className="change-btn"
              onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click() }}
            >
              {t.changePhoto}
            </button>
          </div>
        ) : (
          <div className="drop-content">
            <div className="drop-icon">✦</div>
            <p className="drop-text">{t.dropText}</p>
            <p className="drop-hint">{t.dropHint}</p>
          </div>
        )}
      </div>

      {error && <p className="error-msg">{t.error}</p>}

      {imagePreview && !loading && (
        <button className="analyze-btn" onClick={onAnalyze}>
          {t.analyzeBtn}
        </button>
      )}

      {loading && (
        <div className="loading-wrap">
          <div className="loading-pulse">{t.loading}</div>
        </div>
      )}
    </div>
  )
}

function ResultsScreen({ t, analysis, imagePreview, onReset }) {
  const shapeIcon = shapeIcons[analysis.recommendedShape] || '✦'

  return (
    <div className="results-screen">
      <button className="back-btn" onClick={onReset}>{t.backBtn}</button>

      <p className="style-quote">"{analysis.stylePersonality}"</p>

      {/* Top: photo + shape info */}
      <div className="top-grid">
        <div className="top-photo">
          <img src={imagePreview} alt="Ваши руки" className="result-photo" />
        </div>
        <div className="top-info">
          <p className="skin-desc">{analysis.skinDescription}</p>
          <div className="shape-card">
            <span className="shape-emoji">{shapeIcon}</span>
            <div>
              <div className="shape-name">{analysis.recommendedShape}</div>
              <div className="shape-reason">{analysis.shapeReason}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Color Palette */}
      <section className="section">
        <h2 className="section-title">{t.paletteTitle}</h2>
        <div className="palette-row">
          {analysis.colorPalette.map((c, i) => (
            <div key={i} className="color-item">
              <div
                className="color-dot"
                style={{ background: c.hex, boxShadow: `0 0 22px ${c.hex}99` }}
              />
              <div className="color-name">{c.name}</div>
              <div className="color-mood">{c.mood}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Design Suggestions */}
      <section className="section">
        <h2 className="section-title">{t.designsTitle}</h2>
        <div className="designs-row">
          {analysis.designSuggestions.map((d, i) => {
            const s = complexityStyle[d.complexity] || complexityStyle.Simple
            const paletteColors = analysis.colorPalette.map(c => c.hex)
            return (
              <div key={i} className="design-card">
                <NailPreview
                  index={i}
                  colors={paletteColors}
                  shape={analysis.recommendedShape}
                  complexity={d.complexity}
                />
                <span
                  className="complexity-badge"
                  style={{ color: s.color, background: s.bg, borderColor: s.border }}
                >
                  {d.complexity}
                </span>
                <div className="design-title">{d.title}</div>
                <div className="design-desc">{d.description}</div>
              </div>
            )
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="cta">
        <h2 className="cta-title">{t.ctaTitle}</h2>
        <p className="cta-sub">{t.ctaSub}</p>
        <div className="cta-btns">
          <a
            className="cta-fill"
            href="https://www.instagram.com/kamala.studio.wien"
            target="_blank"
            rel="noopener noreferrer"
          >
            {t.ctaBtn}
          </a>
          <button className="cta-outline">{t.saveBtn}</button>
        </div>
      </section>
    </div>
  )
}
