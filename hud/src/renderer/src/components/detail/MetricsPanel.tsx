import { useState } from 'react'
import type { DepartmentSnapshot, Metric } from '../../../../shared/types'

interface MetricsPanelProps {
  department: DepartmentSnapshot
}

function MetricTile({ metric }: { metric: Metric }): JSX.Element {
  return (
    <div className="metric-tile">
      <span className="metric-tile-label">{metric.label}</span>
      {metric.value !== undefined ? (
        <span className="metric-tile-value">
          {metric.value}
          {metric.unit && <span className="metric-tile-unit">{metric.unit}</span>}
        </span>
      ) : (
        <span className="metric-tile-value metric-tile-value-empty">—</span>
      )}
    </div>
  )
}

const CHART_W = 400
const CHART_H = 120
const CHART_PAD = 10

function MetricChart({ metric }: { metric: Metric }): JSX.Element {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null)
  const series = metric.series ?? []

  const values = series.map((p) => p.v)
  const minV = Math.min(...values)
  const maxV = Math.max(...values)
  const range = maxV - minV || 1
  const xStep = series.length > 1 ? (CHART_W - CHART_PAD * 2) / (series.length - 1) : 0

  const points = series.map((p, i) => ({
    x: CHART_PAD + i * xStep,
    y: CHART_H - CHART_PAD - ((p.v - minV) / range) * (CHART_H - CHART_PAD * 2),
    t: p.t,
    v: p.v
  }))

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ')
  const areaPath = `${linePath} L${points[points.length - 1]?.x ?? 0},${CHART_H - CHART_PAD} L${points[0]?.x ?? 0},${CHART_H - CHART_PAD} Z`
  const hovered = hoverIdx !== null ? points[hoverIdx] : null

  function handleMove(e: React.MouseEvent<SVGSVGElement>): void {
    const rect = e.currentTarget.getBoundingClientRect()
    const relX = ((e.clientX - rect.left) / rect.width) * CHART_W
    let nearest = 0
    let bestDist = Infinity
    points.forEach((p, i) => {
      const d = Math.abs(p.x - relX)
      if (d < bestDist) {
        bestDist = d
        nearest = i
      }
    })
    setHoverIdx(nearest)
  }

  return (
    <div className="metric-chart">
      <div className="metric-chart-title">{metric.label}</div>
      <svg
        viewBox={`0 0 ${CHART_W} ${CHART_H}`}
        className="metric-chart-svg"
        onMouseMove={handleMove}
        onMouseLeave={() => setHoverIdx(null)}
      >
        <line
          x1={CHART_PAD}
          y1={CHART_H - CHART_PAD}
          x2={CHART_W - CHART_PAD}
          y2={CHART_H - CHART_PAD}
          className="metric-chart-axis"
        />
        <path d={areaPath} className="metric-chart-area" />
        <path d={linePath} className="metric-chart-line" />
        {hovered && (
          <>
            <line x1={hovered.x} y1={CHART_PAD} x2={hovered.x} y2={CHART_H - CHART_PAD} className="metric-chart-crosshair" />
            <circle cx={hovered.x} cy={hovered.y} r={3.5} className="metric-chart-dot" />
          </>
        )}
      </svg>
      {hovered && (
        <div className="metric-chart-tooltip">
          <span className="metric-chart-tooltip-value">
            {hovered.v}
            {metric.unit ?? ''}
          </span>
          <span className="metric-chart-tooltip-time">{hovered.t}</span>
        </div>
      )}
    </div>
  )
}

export default function MetricsPanel({ department }: MetricsPanelProps): JSX.Element {
  const metrics = department.metrics ?? []
  const chartable = metrics.filter((m) => (m.series?.length ?? 0) > 1)
  const hasActivity = department.recentActivity.length > 0

  return (
    <>
      <section className="detail-section">
        <h2>Metrics</h2>
        {metrics.length > 0 ? (
          <div className="metric-tiles">
            {metrics.map((m) => (
              <MetricTile key={m.label} metric={m} />
            ))}
          </div>
        ) : (
          <p className="detail-empty">no metrics yet — none of this department's skills have run yet</p>
        )}
      </section>

      <section className="detail-section">
        <h2>Trend</h2>
        {chartable.length > 0 ? (
          <div className="metric-chart-list">
            {chartable.map((m) => (
              <MetricChart key={m.label} metric={m} />
            ))}
          </div>
        ) : (
          <div className="metric-chart-empty">
            <svg viewBox={`0 0 ${CHART_W} ${CHART_H}`} className="metric-chart-svg">
              <line
                x1={CHART_PAD}
                y1={CHART_H - CHART_PAD}
                x2={CHART_W - CHART_PAD}
                y2={CHART_H - CHART_PAD}
                className="metric-chart-axis metric-chart-axis-dashed"
              />
            </svg>
            <p className="detail-empty">no time-series data yet</p>
          </div>
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
          <p className="detail-empty">no activity yet</p>
        )}
      </section>
    </>
  )
}
