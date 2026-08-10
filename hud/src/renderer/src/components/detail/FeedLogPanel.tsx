import type { DepartmentSnapshot } from '../../../../shared/types'

interface FeedLogPanelProps {
  department: DepartmentSnapshot
}

export default function FeedLogPanel({ department }: FeedLogPanelProps): JSX.Element {
  const hasActivity = department.recentActivity.length > 0

  return (
    <>
      <section className="detail-section">
        <h2>Skills</h2>
        {department.skills.length > 0 ? (
          <ul className="detail-skill-list">
            {department.skills.map((skill) => (
              <li key={skill}>{skill}</li>
            ))}
          </ul>
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
        <h2>Log</h2>
        {hasActivity ? (
          <ul className="log-list">
            {department.recentActivity.map((entry, i) => (
              <li key={i} className="log-line">
                <span className="log-time">{entry.timestamp ?? '--:--:--'}</span>
                <span className="log-text">{entry.label}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="detail-empty">no activity yet</p>
        )}
      </section>
    </>
  )
}
