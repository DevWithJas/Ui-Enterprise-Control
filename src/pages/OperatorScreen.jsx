import { useState } from 'react'
import CameraCapture from '../components/CameraCapture'
import CategorySelector from '../components/CategorySelector'
import styles from './OperatorScreen.module.css'

export default function OperatorScreen() {
  const [plate, setPlate] = useState('')
  const [category, setCategory] = useState(null)
  const [subType, setSubType] = useState(null)
  const [visitorName, setVisitorName] = useState('')
  const [visitorPhone, setVisitorPhone] = useState('')
  const [submitted, setSubmitted] = useState(null) // 'entry' | 'exit'
  const [submitting, setSubmitting] = useState(null)

  const isUnregistered = category === 'unregistered'
  const needsSubType = ['service', 'bodyshop', 'sales'].includes(category)
  const isReady = category && (
    isUnregistered
      ? visitorName.trim().length >= 2 && visitorPhone.trim().length >= 10
      : plate.trim().length >= 6 && (!needsSubType || subType)
  )

  const handleAction = (action) => {
    if (!isReady) return
    setSubmitting(action)
    setTimeout(() => { setSubmitting(null); setSubmitted(action) }, 800)
  }

  const handleReset = () => {
    setPlate(''); setCategory(null); setSubType(null)
    setVisitorName(''); setVisitorPhone(''); setSubmitted(null)
  }

  if (submitted) {
    return (
      <div className={styles.successScreen}>
        <div className={`${styles.successBadge} ${submitted === 'exit' ? styles.exitBadge : ''}`}>
          {submitted === 'entry' ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="30" height="30">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
              <polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/>
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="30" height="30">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          )}
        </div>
        <p className={styles.successAction}>{submitted === 'entry' ? 'Vehicle Entered' : 'Vehicle Exited'}</p>
        <p className={styles.successPlate}>{isUnregistered ? visitorName : plate}</p>
        <p className={styles.successMeta}>
          {isUnregistered ? `Unregistered · ${visitorPhone}` : `${category?.charAt(0).toUpperCase() + category?.slice(1)}${subType ? ` · ${subType}` : ''}`}
        </p>
        <p className={styles.successTime}>
          {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </p>
        <button className={styles.newEntryBtn} onClick={handleReset}>+ New Entry</button>
      </div>
    )
  }

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <div className={styles.logoMark}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="1" y="3" width="15" height="13" rx="2"/>
            <path d="M16 8h4l3 3v5h-7V8z"/>
            <circle cx="5.5" cy="18.5" r="2.5"/>
            <circle cx="18.5" cy="18.5" r="2.5"/>
          </svg>
        </div>
        <div className={styles.headerText}>
          <p className={styles.headerTitle}>Gate Operator</p>
          <p className={styles.headerSub}>Vehicle Entry System</p>
        </div>
        <div className={styles.clock}>
          {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
        </div>
      </header>

      <div className={styles.body}>

        {/* ── 01 Number Plate ── */}
        <section className={styles.section}>
          <p className={styles.sectionLabel}><span className={styles.step}>01</span> Number Plate</p>
          <CameraCapture onPlateDetected={setPlate} />
        </section>
        
        <div className={styles.rule} />

        {/* ── 02 Category ── */}
        <section className={styles.section}>
          <p className={styles.sectionLabel}><span className={styles.step}>02</span> Visit Type</p>
          <CategorySelector
            selected={category}
            subType={subType}
            onSelect={setCategory}
            onSubType={setSubType}
          />
        </section>

        <div className={styles.rule} />

        {/* ── 03 Visitor Details (Unregistered) or Entry/Exit ── */}
        <section className={styles.section}>
          <p className={styles.sectionLabel}><span className={styles.step}>03</span> {isUnregistered ? 'Visitor Details & Action' : 'Log Action'}</p>

          {isUnregistered ? (
            <div className={styles.visitorFields}>
              <input
                className={styles.visitorInput}
                placeholder="Full Name"
                value={visitorName}
                onChange={e => setVisitorName(e.target.value)}
                maxLength={60}
              />
              <input
                className={styles.visitorInput}
                placeholder="Phone Number"
                value={visitorPhone}
                onChange={e => setVisitorPhone(e.target.value.replace(/\D/g, ''))}
                maxLength={10}
                type="tel"
                inputMode="numeric"
              />
            </div>
          ) : null}

          <div className={styles.actionRow}>
            <button
              className={`${styles.actionBtn} ${styles.entryBtn} ${!isReady ? styles.actionDisabled : ''}`}
              onClick={() => handleAction('entry')}
              disabled={!isReady || !!submitting}
            >
              {submitting === 'entry' ? <span className={styles.spinner} /> : (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="18" height="18">
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                    <polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/>
                  </svg>
                  Entry
                </>
              )}
            </button>
            <button
              className={`${styles.actionBtn} ${styles.exitBtn} ${!isReady ? styles.actionDisabled : ''}`}
              onClick={() => handleAction('exit')}
              disabled={!isReady || !!submitting}
            >
              {submitting === 'exit' ? <span className={`${styles.spinner} ${styles.spinnerDark}`} /> : (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="18" height="18">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                    <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
                  </svg>
                  Exit
                </>
              )}
            </button>
          </div>

          {!isReady && (
            <p className={styles.hint}>
              {!category ? '· Select a visit type'
                : isUnregistered && visitorName.trim().length < 2 ? '· Enter visitor name'
                : isUnregistered && visitorPhone.trim().length < 10 ? '· Enter valid phone number'
                : !plate ? '· Scan or enter plate'
                : '· Select service type'}
            </p>
          )}
        </section>

      </div>
    </div>
  )
}
