import { Radio, CheckCheck } from 'lucide-react'
import { useAppState } from '../state/AppState'
import { Panel, PanelHeader, Button, AlertStatusBadge, RiskBadge, EmptyState, TableScroll } from '../components/ui/Primitives'
import ComplaintPicker from '../components/ui/ComplaintPicker'
import type { Alert, RecipientType } from '../types'

const RECIPIENT_LABEL: Record<RecipientType, string> = {
  BANK: 'Bank',
  'LAW ENFORCEMENT': 'Law Enforcement',
  'LOCAL RESPONSE UNIT': 'Local Response Unit',
}

const PRIORITY_STYLES: Record<Alert['priority'], string> = {
  STANDARD: 'bg-[#F0F0EC] border-[#D6D6D0] text-[#111111]',
  HIGH: 'bg-[#FFFBEB] border-[#FDE68A] text-[#92400E]',
  CRITICAL: 'bg-[#FEF2F2] border-[#FCA5A5] text-[#991B1B]',
}

export default function Alerts() {
  const { alerts, selectedComplaint, dispatchIntelligence, acknowledgeAlert, complaints } = useAppState()

  const complaintAlerts = selectedComplaint ? alerts.filter((a) => a.complaintId === selectedComplaint.id) : []
  const allPrepared = complaintAlerts.length > 0 && complaintAlerts.every((a) => a.status !== 'PREPARED')
  const canDispatch = selectedComplaint && (selectedComplaint.predictedZone || complaintAlerts.length > 0) && !allPrepared

  function handleDispatch() {
    if (!selectedComplaint) return
    dispatchIntelligence(selectedComplaint.id)
  }

  const sortedAlerts = [...alerts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  return (
    <div className="space-y-7">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#000000]">Alerts & Dispatch</h1>
          <p className="text-base text-[#222222] font-medium mt-1">Prepare and dispatch actionable intelligence to response partners.</p>
        </div>
        <ComplaintPicker />
      </div>

      <Panel>
        <PanelHeader
          title="Dispatch Intelligence"
          subtitle={selectedComplaint ? `For ${selectedComplaint.id}` : undefined}
          action={
            <Button onClick={handleDispatch} disabled={!canDispatch} variant="critical" className="w-full sm:w-auto">
              <Radio size={16} /> Dispatch Intelligence
            </Button>
          }
        />
        <div className="px-5 py-5">
          {!selectedComplaint?.predictedZone ? (
            <div className="text-sm font-semibold text-[#222222]">
              Run predictive analysis for this complaint on the Predictions page before dispatching intelligence.
            </div>
          ) : complaintAlerts.length === 0 ? (
            <div className="text-sm font-semibold text-[#222222]">No prepared alerts yet for this complaint. Dispatch to generate them.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {complaintAlerts.map((a) => (
                <div key={a.id} className={`border rounded-md px-5 py-4 ${PRIORITY_STYLES[a.priority]}`}>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-bold mono uppercase tracking-wider">{RECIPIENT_LABEL[a.recipient]}</span>
                    <AlertStatusBadge status={a.status} />
                  </div>
                  <div className="text-sm font-medium text-[#111111]">{a.intelligence}</div>
                  {a.status !== 'PREPARED' && (
                    <button
                      onClick={() => acknowledgeAlert(a.id)}
                      disabled={a.status === 'ACKNOWLEDGED'}
                      className="mt-3 flex items-center gap-1.5 py-1 text-sm font-bold text-[#102B3F] hover:text-[#1F4057] disabled:text-[#222222] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <CheckCheck size={16} /> {a.status === 'ACKNOWLEDGED' ? 'Acknowledged' : 'Acknowledge'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </Panel>

      <Panel>
        <PanelHeader title="All Alerts" subtitle={`${alerts.length} total records across ${complaints.length} complaints`} />
        {sortedAlerts.length === 0 ? (
          <EmptyState title="No alerts yet" detail="Alerts appear here once intelligence has been dispatched for a complaint." />
        ) : (
          <TableScroll>
            <table className="w-full text-[15px]">
              <thead>
                <tr className="text-left text-xs font-bold text-[#111111] uppercase tracking-wider bg-[#F0F0EC] border-b border-[#D6D6D0]">
                  <th className="px-5 py-3">Alert ID</th>
                  <th className="px-3 py-3">Incident ID</th>
                  <th className="px-3 py-3">Priority</th>
                  <th className="px-3 py-3">Prediction</th>
                  <th className="px-3 py-3">Estimated Time</th>
                  <th className="px-3 py-3">Recipient</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {sortedAlerts.map((a) => (
                  <tr key={a.id} className="border-b border-[#D6D6D0] last:border-0 hover:bg-[#F0F0EC]">
                    <td className="px-5 py-3.5 mono font-bold text-[#111111]">{a.id}</td>
                    <td className="px-3 py-3.5 mono font-semibold text-[#111111]">{a.complaintId}</td>
                    <td className="px-3 py-3.5">
                      <RiskBadge risk={a.priority === 'CRITICAL' ? 'CRITICAL' : a.priority === 'HIGH' ? 'HIGH' : 'MEDIUM'} />
                    </td>
                    <td className="px-3 py-3.5 font-medium text-[#111111]">{a.prediction}</td>
                    <td className="px-3 py-3.5 mono font-semibold text-[#111111]">{a.estimatedTime}</td>
                    <td className="px-3 py-3.5 font-medium text-[#111111]">{RECIPIENT_LABEL[a.recipient]}</td>
                    <td className="px-5 py-3.5"><AlertStatusBadge status={a.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableScroll>
        )}
      </Panel>
    </div>
  )
}

