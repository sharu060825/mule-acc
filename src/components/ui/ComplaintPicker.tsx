import { useAppState } from '../../state/AppState'
import { zoneById } from '../../data/mockData'
import { RiskBadge, StatusBadge } from './Primitives'

export default function ComplaintPicker() {
  const { complaints, selectedComplaintId, selectComplaint, selectedComplaint } = useAppState()

  return (
    <div className="flex items-center gap-3 flex-wrap w-full sm:w-auto">
      <select
        value={selectedComplaintId}
        onChange={(e) => selectComplaint(e.target.value)}
        className="w-full sm:w-auto bg-panel border border-line rounded-md px-3 py-2.5 sm:py-2 text-sm mono text-paper focus:outline-none focus:border-intel-500"
      >
        {complaints.map((c) => (
          <option key={c.id} value={c.id}>
            {c.id} — {c.fraudType} — {zoneById(c.victimZone).name}
          </option>
        ))}
      </select>
      {selectedComplaint && (
        <>
          <RiskBadge risk={selectedComplaint.risk} />
          <StatusBadge status={selectedComplaint.status} />
        </>
      )}
    </div>
  )
}
