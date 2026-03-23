import { useRef, useState, useCallback } from 'react'
import { createWorker } from 'tesseract.js'
import styles from './CameraCapture.module.css'

// Extract a likely Indian number plate from raw OCR text
function extractPlate(rawText) {
  const cleaned = rawText.toUpperCase().replace(/\s+/g, '').replace(/[^A-Z0-9]/g, '')
  // Indian plate pattern: XX00XX0000 or similar
  const match = cleaned.match(/[A-Z]{2}[0-9]{1,2}[A-Z]{1,3}[0-9]{3,4}/)
  return match ? match[0] : cleaned.slice(0, 10)
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
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setMode('camera')
    } catch {
      setError('Camera permission denied. Please enter plate manually.')
    }
  }, [])

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
    ctx.drawImage(video, 0, 0)

    // Stop camera, go to scanning mode
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    setMode('scanning')
    setOcrProgress(0)

    try {
      const worker = await createWorker('eng', 1, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setOcrProgress(Math.round((m.progress || 0) * 100))
          }
        }
      })
      const { data: { text } } = await worker.recognize(canvas)
      await worker.terminate()

      const plate = extractPlate(text)
      setPlateValue(plate)
      onPlateDetected?.(plate)
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
          {mode === 'camera' && <video ref={videoRef} className={styles.video} playsInline muted />}

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
