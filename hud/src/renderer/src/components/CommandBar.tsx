import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import type { DepartmentSnapshot } from '../../../shared/types'
import { parseCommand, type Action } from '../lib/commands'

interface CommandBarProps {
  departments: DepartmentSnapshot[]
  onAction: (action: Action) => void
  onClose: () => void
}

export default function CommandBar({ departments, onAction, onClose }: CommandBarProps): JSX.Element {
  const [value, setValue] = useState('')
  const [noMatch, setNoMatch] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  function submit(): void {
    const action = parseCommand(value, departments)
    if (!action) {
      setNoMatch(true)
      return
    }
    onAction(action)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>): void {
    if (e.key === 'Enter') {
      e.preventDefault()
      submit()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
    } else if (noMatch) {
      setNoMatch(false)
    }
  }

  return (
    <div className="command-overlay" onClick={onClose}>
      <motion.div
        className="command-bar"
        initial={{ opacity: 0, y: -12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -12, scale: 0.98 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
        onClick={(e) => e.stopPropagation()}
      >
        <span className="command-bar-caret">›</span>
        <input
          ref={inputRef}
          className="command-bar-input"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="show departments · show <department> · hide"
          spellCheck={false}
          autoComplete="off"
        />
        {noMatch && <span className="command-bar-hint">no match</span>}
      </motion.div>
    </div>
  )
}
