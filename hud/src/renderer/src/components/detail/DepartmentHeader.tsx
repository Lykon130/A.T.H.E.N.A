interface DepartmentHeaderProps {
  name: string
  stage: string
  onBack: () => void
}

export default function DepartmentHeader({ name, stage, onBack }: DepartmentHeaderProps): JSX.Element {
  return (
    <>
      <button className="detail-back" onClick={onBack}>
        ‹ back to orbit
      </button>
      <h1 className="detail-title">{name}</h1>
      <div className="detail-stage">{stage}</div>
    </>
  )
}
