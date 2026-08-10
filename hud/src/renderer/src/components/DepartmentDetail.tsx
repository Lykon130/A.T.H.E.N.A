import { motion } from 'framer-motion'
import type { DepartmentSnapshot } from '../../../shared/types'
import { getArchetype } from '../lib/departmentArchetypes'
import DepartmentHeader from './detail/DepartmentHeader'
import MetricsPanel from './detail/MetricsPanel'
import FeedLogPanel from './detail/FeedLogPanel'
import PipelinePanel from './detail/PipelinePanel'
import ReferencePanel from './detail/ReferencePanel'

interface DepartmentDetailProps {
  department: DepartmentSnapshot
  onBack: () => void
}

export default function DepartmentDetail({ department, onBack }: DepartmentDetailProps): JSX.Element {
  const archetype = getArchetype(department.id)

  return (
    <motion.div
      className="detail"
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 40 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      <DepartmentHeader name={department.name} stage={department.stage} onBack={onBack} />

      {archetype === 'metrics' && <MetricsPanel department={department} />}
      {archetype === 'feed' && <FeedLogPanel department={department} />}
      {archetype === 'pipeline' && <PipelinePanel department={department} />}
      {archetype === 'reference' && <ReferencePanel department={department} />}
    </motion.div>
  )
}
