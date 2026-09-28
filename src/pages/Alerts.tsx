import { Radio, CheckCheck } from 'lucide-react'
import { useAppState } from '../state/AppState'
import { Panel, PanelHeader, Button, AlertStatusBadge, RiskBadge, EmptyState } from '../components/ui/Primitives'
import ComplaintPicker from '../components/ui/ComplaintPicker'
import type { Alert, RecipientType } from '../types'

const RECIPIENT_LABEL: Record<RecipientType, string> = {
  BANK: 'Bank',
  'LAW ENFORCEMENT': 'Law Enforcement',
  'LOCAL RESPONSE UNIT': 'Local Response Unit',
}

const PRIORITY_STYLES: Record<Alert['priority'], string> = {
  STANDARD: 'text-paper-dim border-line',
  HIGH: 'text-warn-400 border-warn-500/40',
  CRITICAL: 'text-critical-400 border-critical-500/50',
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
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-medium tracking-tight">Alerts & Dispatch</h1>
          <p className="text-sm text-paper-faint mt-1">Prepare and dispatch actionable intelligence to response partners.</p>
        </div>
        <ComplaintPicker />
      </div>

      <Panel>
        <PanelHeader
          title="Dispatch Intelligence"
          subtitle={selectedComplaint ? `For ${selectedComplaint.id}` : undefined}
          action={
            <Button onClick={handleDispatch} disabled={!canDispatch} variant="critical">
              <Radio size={14} /> Dispatch Intelligence
            </Button>
          }
        />
        <div className="px-5 py-4">
          {!selectedComplaint?.predictedZone ? (
            <div className="text-xs text-paper-faint">
              Run predictive analysis for this complaint on the Predictions page before dispatching intelligence.
            </div>
          ) : complaintAlerts.length === 0 ? (
            <div className="text-xs text-paper-faint">No prepared alerts yet for this complaint. Dispatch to generate them.</div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {complaintAlerts.map((a) => (
                <div key={a.id} className={`border rounded-md px-4 py-3 ${PRIORITY_STYLES[a.priority]}`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs mono">{RECIPIENT_LABEL[a.recipient]}</span>
                    <AlertStatusBadge status={a.status} />
                  </div>
                  <div className="text-xs text-paper-faint">{a.intelligence}</div>
                  {a.status !== 'PREPARED' && (
                    <button
                      onClick={() => acknowledgeAlert(a.id)}
                      disabled={a.status === 'ACKNOWLEDGED'}
                      className="mt-2 flex items-center gap-1 text-xs text-intel-400 hover:text-intel-300 disabled:text-paper-faint disabled:cursor-not-allowed"
                    >
                      <CheckCheck size={12} /> {a.status === 'ACKNOWLEDGED' ? 'Acknowledged' : 'Acknowledge'}
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
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-paper-faint border-b border-line-soft">
                  <th className="px-5 py-2.5 font-normal">Alert ID</th>
                  <th className="px-3 py-2.5 font-normal">Incident ID</th>
                  <th className="px-3 py-2.5 font-normal">Priority</th>
                  <th className="px-3 py-2.5 font-normal">Prediction</th>
                  <th className="px-3 py-2.5 font-normal">Estimated Time</th>
                  <th className="px-3 py-2.5 font-normal">Recipient</th>
                  <th className="px-5 py-2.5 font-normal">Status</th>
                </tr>
              </thead>
              <tbody>
                {sortedAlerts.map((a) => (
                  <tr key={a.id} className="border-b border-line-soft last:border-0">
                    <td className="px-5 py-2.5 mono text-paper">{a.id}</td>
                    <td className="px-3 py-2.5 mono text-paper-dim">{a.complaintId}</td>
                    <td className="px-3 py-2.5">
                      <RiskBadge risk={a.priority === 'CRITICAL' ? 'CRITICAL' : a.priority === 'HIGH' ? 'HIGH' : 'MEDIUM'} />
                    </td>
                    <td className="px-3 py-2.5 text-paper-dim">{a.prediction}</td>
                    <td className="px-3 py-2.5 mono text-paper-dim">{a.estimatedTime}</td>
                    <td className="px-3 py-2.5 text-paper-dim">{RECIPIENT_LABEL[a.recipient]}</td>
                    <td className="px-5 py-2.5"><AlertStatusBadge status={a.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  )
}
