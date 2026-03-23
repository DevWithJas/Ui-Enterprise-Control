import styles from './CategorySelector.module.css'

const categories = [
  {
    id: 'vip',
    label: 'VIP',
    subTypes: null,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v3"/>
        <rect x="9" y="11" width="14" height="10" rx="2"/>
        <circle cx="12" cy="16" r="1"/>
      </svg>
    ),
  },
  {
    id: 'service',
    label: 'Service',
    subTypes: ['Free Service', 'Paid Service', 'Running Repair'],
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
      </svg>
    ),
  },
  {
    id: 'bodyshop',
    label: 'Body Shop',
    subTypes: ['Accidental Repair', 'Other'],
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
      </svg>
    ),
  },
  {
    id: 'sales',
    label: 'Sales',
    subTypes: ['Sales Inquiry', 'Sales Delivery'],
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
        <polyline points="16 7 22 7 22 13"/>
      </svg>
    ),
  },
  {
    id: 'unregistered',
    label: 'Unregistered',
    subTypes: null,
    wide: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10"/>
        <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
      </svg>
    ),
  },
]

export default function CategorySelector({ selected, subType, onSelect, onSubType }) {
  const selectedCat = categories.find(c => c.id === selected)

  return (
    <div className={styles.wrapper}>
      <div className={styles.grid}>
        {categories.map((cat) => {
          const active = selected === cat.id
          return (
            <button
              key={cat.id}
              className={`${styles.card} ${active ? styles.active : ''} ${cat.wide ? styles.wide : ''}`}
              onClick={() => {
                if (active) { onSelect(null); onSubType(null) }
                else { onSelect(cat.id); onSubType(null) }
              }}
            >
              <div className={styles.iconWrap}>{cat.icon}</div>
              <p className={styles.label}>{cat.label}</p>
              {active && (
                <span className={styles.check}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" width="10" height="10">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </span>
              )}
            </button>
          )
        })}
      </div>

      {selectedCat?.subTypes && (
        <div className={styles.subTypeRow}>
          {selectedCat.subTypes.map(st => (
            <button
              key={st}
              className={`${styles.pill} ${subType === st ? styles.pillActive : ''}`}
              onClick={() => onSubType(st === subType ? null : st)}
            >
              {st}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
