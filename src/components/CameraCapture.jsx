import { useRef, useState, useCallback, useEffect } from 'react'
import styles from './CameraCapture.module.css'

// Extract plate OR return generic text if it's not a plate
function extractPlate(rawText) {
  if (!rawText) return ''
  const cleanedPlate = rawText.toUpperCase().replace(/\s+/g, '').replace(/[^A-Z0-9]/g, '')
  const match = cleanedPlate.match(/[A-Z]{2}[0-9]{1,2}[A-Z]{1,3}[0-9]{3,4}/)
  
  // If it firmly looks like a plate, return exact plate string
  if (match) return match[0]
  
  // Otherwise, return the generic text they scanned
  return rawText.replace(/\n/g, ' ').trim().slice(0, 30)
}

export default function CameraCapture({ onPlateDetected }) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)

  const [mode, setMode] = useState('idle') // idle | camera | scanning | done
  const [plateValue, setPlateValue] = useState('')
  const [error, setError] = useState('')
  const [ocrProgress, setOcrProgress] = useState(0)

  const openCamera = useCallback(async () => {
    setError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }
      })
      streamRef.current = stream
      setMode('camera')
    } catch {
      setError('Camera permission denied. Please enter plate manually.')
    }
  }, [])

  useEffect(() => {
    if (mode === 'camera' && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current
      videoRef.current.play().catch(e => console.warn('Autoplay prevented:', e))
    }
  }, [mode])

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    setMode('idle')
  }, [])

  const captureAndScan = useCallback(async () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0) // No extreme filters needed for cloud ML models

    // Stop camera, go to scanning mode
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    setMode('scanning')
    setOcrProgress(50) // Fake progress for API wait

    try {
      let text = ''

      // Attempt 1: Native Android Chrome ML Kit (if experimental flags enabled)
      if ('TextDetector' in window) {
        try {
          const detector = new window.TextDetector()
          const texts = await detector.detect(canvas)
          text = texts.map(t => t.rawValue).join(' ')
        } catch (e) { console.warn('Native detector failed', e) }
      }

      // Attempt 2: Cloud Vision OCR API (Engine 2: robust for generic text & numbers)
      if (!text || text.trim().length <= 1) {
        const formData = new FormData()
        formData.append('base64Image', canvas.toDataURL('image/jpeg', 0.8))
        formData.append('apikey', 'helloworld') // Free public dev key
        formData.append('OCREngine', '2') 
        
        const res = await fetch('https://api.ocr.space/parse/image', {
          method: 'POST', body: formData
        })
        const data = await res.json()
        if (data.ParsedResults && data.ParsedResults.length > 0) {
          text = data.ParsedResults[0].ParsedText
        }
      }

      setOcrProgress(100)
      
      const parsed = extractPlate(text)
      if (!parsed) throw new Error('No text found')
      
      setPlateValue(parsed)
      onPlateDetected?.(parsed)
      setMode('done')
    } catch (e) {
      setError('OCR failed. Please enter plate manually.')
      setMode('idle')
    }
  }, [onPlateDetected])

  const handleManualChange = (e) => {
    const val = e.target.value.toUpperCase().replace(/[^A-Z0-9\s]/g, '')
    setPlateValue(val)
    onPlateDetected?.(val)
  }

  const reset = () => {
    setPlateValue('')
    onPlateDetected?.('')
    setMode('idle')
    setError('')
    setOcrProgress(0)
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.plateInput}>
        <span className={styles.plateFlag}>🇮🇳</span>
        <div className={styles.plateDivider} />
        <input
          className={styles.plateText}
          placeholder="MH 12 AB 1234"
          value={plateValue}
          onChange={handleManualChange}
          maxLength={11}
          spellCheck={false}
        />
        {plateValue && (
          <button className={styles.clearBtn} onClick={reset} title="Clear">✕</button>
        )}
      </div>

      {(mode === 'idle' || mode === 'done') && (
        <button className={styles.cameraBtn} onClick={openCamera} title="Scan plate with camera">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="18" height="18">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
            <circle cx="12" cy="13" r="4"/>
          </svg>
          Scan Using Camera
        </button>
      )}

      {error && <p className={styles.error}>{error}</p>}

      {/* Live camera view */}
      {(mode === 'camera' || mode === 'scanning') && (
        <div className={styles.viewfinder}>
          {mode === 'camera' && <video ref={videoRef} className={styles.video} autoPlay playsInline muted />}

          {mode === 'camera' && (
            <div className={styles.viewfinderOverlay}>
              <div className={styles.aimBox} />
              <div className={styles.viewControls}>
                <button className={styles.cancelBtn} onClick={stopCamera}>Cancel</button>
                <button className={styles.captureBtn} onClick={captureAndScan}>
                  <div className={styles.captureInner} />
                </button>
                <div style={{ width: 64 }} />
              </div>
            </div>
          )}

          {mode === 'scanning' && (
            <div className={styles.scanningState}>
              <div className={styles.scanProgress}>
                <div className={styles.scanBar} style={{ width: `${ocrProgress}%` }} />
              </div>
              <p className={styles.scanLabel}>Reading plate… {ocrProgress}%</p>
            </div>
          )}
        </div>
      )}

      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {mode === 'done' && plateValue && (
        <div className={styles.detectedBadge}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Plate extracted — edit below if needed
        </div>
      )}
    </div>
  )
}
