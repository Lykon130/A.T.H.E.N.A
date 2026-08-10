import type { DepartmentSnapshot } from '../../../../shared/types'

interface PipelinePanelProps {
  department: DepartmentSnapshot
}

export default function PipelinePanel({ department }: PipelinePanelProps): JSX.Element {
  const hasActivity = department.recentActivity.length > 0

  return (
    <>
      <section className="detail-section">
        <h2>Pipeline</h2>
        {department.skills.length > 0 ? (
          <div className="pipeline-track">
            {department.skills.map((skill, i) => (
              <div className="pipeline-stage" key={skill}>
                <div className="pipeline-stage-index">{i + 1}</div>
                <div className="pipeline-stage-name">{skill}</div>
                {i < department.skills.length - 1 && <div className="pipeline-stage-arrow">→</div>}
              </div>
            ))}
          </div>
        ) : (
          <p className="detail-empty">no pipeline stages defined yet</p>
        )}
      </section>

      <section className="detail-section">
        <h2>Vault footprint</h2>
        <p className="detail-footprint">
          {department.rawFileCount} raw file{department.rawFileCount === 1 ? '' : 's'} ·{' '}
          {department.outputFileCount} output file{department.outputFileCount === 1 ? '' : 's'}
        </p>
      </section>

      <section className="detail-section">
        <h2>Recent activity</h2>
        {hasActivity ? (
          <ul className="detail-activity-list">
            {department.recentActivity.map((entry, i) => (
              <li key={i}>
                {entry.timestamp && <span className="detail-activity-time">{entry.timestamp}</span>}
                <span>{entry.label}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="detail-empty">no activity yet — nothing has moved through the pipeline</p>
        )}
      </section>
    </>
  )
}
