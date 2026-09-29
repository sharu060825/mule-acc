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
        className="w-full sm:w-auto bg-[#FFFFFF] border border-[#D6D6D0] rounded-md px-3.5 py-2 text-[15px] font-semibold mono text-[#111111] focus:outline-none focus:border-[#1F4057] shadow-sm"
      >
        {complaints.map((c) => (
          <option key={c.id} value={c.id}>
            {c.id} — {c.fraudType} — {zoneById(c.victimZone).name}
          </option>
        ))}
      </select>
      {selectedComplaint && (
        <div className="flex items-center gap-2">
          <RiskBadge risk={selectedComplaint.risk} />
          <StatusBadge status={selectedComplaint.status} />
        </div>
      )}
    </div>
  )
}

