import type { DepartmentSnapshot } from '../../../../shared/types'

interface ReferencePanelProps {
  department: DepartmentSnapshot
}

export default function ReferencePanel({ department }: ReferencePanelProps): JSX.Element {
  const hasActivity = department.recentActivity.length > 0

  return (
    <>
      <section className="detail-section">
        <h2>Skills</h2>
        {department.skills.length > 0 ? (
          <div className="reference-grid">
            {department.skills.map((skill) => (
              <div className="reference-card" key={skill}>
                {skill}
              </div>
            ))}
          </div>
        ) : (
          <p className="detail-empty">no skills defined yet</p>
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
        <h2>Recent notes</h2>
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
          <p className="detail-empty">nothing recorded yet</p>
        )}
      </section>
    </>
  )
}
