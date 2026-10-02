import { useEffect, useId, useRef, useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import BankLogo from './BankLogo'
import './BankSelect.css'

export default function BankSelect({ banks, value, disabled, onChange }) {
  const id = useId()
  const root = useRef(null), trigger = useRef(null), list = useRef(null)
  const typed = useRef({ text: '', at: 0 })
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const [placement, setPlacement] = useState({ above: false, height: 320 })
  const selected = banks.find((bank) => bank.code === value)
  const expanded = open && !disabled && banks.length > 0
  const index = Math.min(active, banks.length - 1)

  useEffect(() => {
    if (!expanded) return undefined
    const outside = (event) => { if (!root.current?.contains(event.target)) setOpen(false) }
    document.addEventListener('pointerdown', outside)
    return () => document.removeEventListener('pointerdown', outside)
  }, [expanded])
  useEffect(() => {
    if (expanded) list.current?.children[index]?.scrollIntoView({ block: 'nearest' })
  }, [index, expanded])

  function show(next = Math.max(0, banks.findIndex((bank) => bank.code === value))) {
    if (disabled || !banks.length) return
    const rect = trigger.current.getBoundingClientRect()
    const below = window.innerHeight - rect.bottom - 8, above = rect.top - 8
    const upward = below < 200 && above > below
    setPlacement({ above: upward, height: Math.max(96, Math.min(320, upward ? above : below)) })
    setActive(next); setOpen(true)
  }
  function select(next) {
    if (disabled || !banks[next]) return
    onChange(banks[next].code); setOpen(false); trigger.current.focus()
  }
  function keyDown(event) {
    if (disabled || !banks.length) return
    const { key } = event
    if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(key)) {
      event.preventDefault()
      const next = key === 'Home' ? 0 : key === 'End' ? banks.length - 1
        : expanded ? (index + (key === 'ArrowDown' ? 1 : -1) + banks.length) % banks.length
          : Math.max(0, banks.findIndex((bank) => bank.code === value))
      if (expanded) setActive(next); else show(next)
    } else if (key === 'Enter' || key === ' ') {
      event.preventDefault()
      if (expanded) select(index); else show()
    } else if (key === 'Escape') { event.preventDefault(); setOpen(false) }
    else if (key === 'Tab') setOpen(false)
    else if (key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      event.preventDefault()
      const now = Date.now(), letter = key.toLocaleLowerCase()
      const previous = now - typed.current.at < 700 ? typed.current.text : ''
      const text = previous === letter ? letter : previous + letter
      typed.current = { text, at: now }
      const start = expanded ? index : Math.max(0, banks.findIndex((bank) => bank.code === value))
      const order = banks.map((_, offset) => (start + offset + 1) % banks.length)
      const next = order.find((position) => banks[position].name.toLocaleLowerCase().startsWith(text))
      if (next !== undefined) { if (expanded) setActive(next); else show(next) }
    }
  }
  return <div className="pay-bank-select" ref={root}>
    <label className="pay-field" id={`${id}-label`} htmlFor={`${id}-trigger`}>Pilih bank</label>
    <input type="hidden" name="bankCode" value={value} />
    <button type="button" className="pay-bank-trigger" id={`${id}-trigger`} ref={trigger} role="combobox"
      aria-labelledby={`${id}-label ${id}-value`} aria-expanded={expanded} aria-controls={`${id}-list`}
      aria-haspopup="listbox" aria-activedescendant={expanded ? `${id}-option-${index}` : undefined}
      disabled={disabled || !banks.length} onKeyDown={keyDown}
      onBlur={(event) => { if (!root.current?.contains(event.relatedTarget)) setOpen(false) }}
      onClick={() => { if (expanded) setOpen(false); else show() }}>
      <BankLogo code={selected?.code} /><span id={`${id}-value`}>{selected?.name ?? 'Pilih bank yang tersedia'}</span><ChevronDown size={18} />
    </button>
    {expanded && <ul className={`pay-bank-options ${placement.above ? 'above' : ''}`} id={`${id}-list`}
      role="listbox" aria-labelledby={`${id}-label`} ref={list} style={{ maxHeight: placement.height }}>
      {banks.map((bank, position) => <li key={bank.code} id={`${id}-option-${position}`} role="option"
        aria-selected={bank.code === value} className={position === index ? 'active' : ''}
        onPointerDown={(event) => event.preventDefault()} onPointerMove={() => setActive(position)} onClick={() => select(position)}>
        <BankLogo code={bank.code} /><span>{bank.name}</span>{bank.code === value && <Check size={18} aria-hidden="true" />}
      </li>)}
    </ul>}
  </div>
}
