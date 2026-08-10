import { motion } from 'framer-motion'
import type { DepartmentSnapshot } from '../../../shared/types'

interface OverviewOrbitProps {
  departments: DepartmentSnapshot[]
  onSelect: (id: string) => void
}

const RADIUS = 300

function nodePosition(index: number, total: number): { x: number; y: number } {
  const angle = (index / total) * 2 * Math.PI - Math.PI / 2
  return { x: Math.cos(angle) * RADIUS, y: Math.sin(angle) * RADIUS }
}

export default function OverviewOrbit({ departments, onSelect }: OverviewOrbitProps): JSX.Element {
  return (
    <div className="orbit">
      <svg className="orbit-ring" viewBox="-320 -320 640 640" aria-hidden="true">
        <circle cx="0" cy="0" r={RADIUS} className="orbit-ring-path" />
      </svg>

      <motion.div
        className="orbit-hub"
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <span className="orbit-hub-label">A.T.H.E.N.A</span>
        <span className="orbit-hub-sub">{departments.length} departments</span>
      </motion.div>

      {departments.map((dept, index) => {
        const { x, y } = nodePosition(index, departments.length)
        const isActive = dept.recentActivity.length > 0 && dept.stage !== 'not built'
        return (
          <motion.button
            key={dept.id}
            className={`orbit-node ${isActive ? 'orbit-node-active' : 'orbit-node-idle'}`}
            style={{ x, y }}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{
              opacity: 1,
              scale: isActive ? [1, 1.06, 1] : 1
            }}
            transition={{
              opacity: { duration: 0.4, delay: index * 0.04 },
              scale: isActive
                ? { duration: 2.2, repeat: Infinity, ease: 'easeInOut' }
                : { duration: 0.4, delay: index * 0.04 }
            }}
            whileHover={{ scale: 1.12 }}
            onClick={() => onSelect(dept.id)}
          >
            <span className="orbit-node-name">{dept.name}</span>
            <span className="orbit-node-status">
              {dept.stage === 'not built' ? 'not built' : isActive ? 'active' : 'idle'}
            </span>
          </motion.button>
        )
      })}
    </div>
  )
}
