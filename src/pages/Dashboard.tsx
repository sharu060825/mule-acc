import { useNavigate } from 'react-router-dom'
import { useAppState } from '../state/AppState'
import { HIGH_RISK_ZONES, zoneById } from '../data/mockData'
import { Metric, Panel, PanelHeader, RiskBadge, StatusBadge, AlertStatusBadge, formatINR, formatTime, EmptyState } from '../components/ui/Primitives'

export default function Dashboard() {
  const { complaints, alerts, predictions, selectComplaint } = useAppState()
  const navigate = useNavigate()

  const activeComplaints = complaints.filter((c) => c.status !== 'RESOLVED')
  const highRisk = complaints.filter((c) => c.risk === 'HIGH' || c.risk === 'CRITICAL')
  const predictedCount = complaints.filter((c) => c.predictedZone).length
  const dispatchedAlerts = alerts.filter((a) => a.status === 'DISPATCHED' || a.status === 'ACKNOWLEDGED')
  const flaggedAccounts = complaints.reduce((sum, c) => sum + c.numberOfDestinations, 0)

  const topPrediction = complaints
    .filter((c) => c.predictedZone && predictions[c.id])
    .sort((a, b) => (predictions[b.id]?.confidence ?? 0) - (predictions[a.id]?.confidence ?? 0))[0]
    ?? complaints.find((c) => c.predictedZone)

  const recentDispatches = alerts
    .filter((a) => a.status === 'DISPATCHED' || a.status === 'ACKNOWLEDGED')
    .sort((a, b) => new Date(b.dispatchedAt ?? 0).getTime() - new Date(a.dispatchedAt ?? 0).getTime())
    .slice(0, 6)

  function openComplaint(id: string) {
    selectComplaint(id)
    navigate('/intelligence')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-medium tracking-tight">Operational Dashboard</h1>
        <p className="text-sm text-paper-faint mt-1">Live intelligence overview across active cybercrime complaints and predicted cash-out activity.</p>
      </div>

      <div className="grid grid-cols-5 gap-4">
        <Metric label="Active Complaints" value={activeComplaints.length} tone="intel" />
        <Metric label="High-Risk Incidents" value={highRisk.length} tone="critical" />
        <Metric label="Predicted Cash-Outs" value={predictedCount} />
        <Metric label="Alerts Dispatched" value={dispatchedAlerts.length} tone="ok" />
        <Metric label="Accounts Flagged" value={flaggedAccounts} />
      </div>

      <div className="grid grid-cols-3 gap-6">
        <Panel className="col-span-2">
          <PanelHeader title="Active Incidents" subtitle={`${activeComplaints.length} complaints currently in the pipeline`} />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-paper-faint border-b border-line-soft">
                  <th className="px-5 py-2.5 font-normal">Complaint ID</th>
                  <th className="px-3 py-2.5 font-normal">Fraud Type</th>
                  <th className="px-3 py-2.5 font-normal">Amount</th>
                  <th className="px-3 py-2.5 font-normal">Risk</th>
                  <th className="px-3 py-2.5 font-normal">Predicted Zone</th>
                  <th className="px-3 py-2.5 font-normal">Est. Withdrawal</th>
                  <th className="px-5 py-2.5 font-normal">Status</th>
                </tr>
              </thead>
              <tbody>
                {activeComplaints.slice(0, 8).map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => openComplaint(c.id)}
                    className="border-b border-line-soft last:border-0 hover:bg-panel-raised cursor-pointer transition-colors"
                  >
                    <td className="px-5 py-2.5 mono text-paper">{c.id}</td>
                    <td className="px-3 py-2.5 text-paper-dim">{c.fraudType}</td>
                    <td className="px-3 py-2.5 mono text-paper-dim">{formatINR(c.amount)}</td>
                    <td className="px-3 py-2.5"><RiskBadge risk={c.risk} /></td>
                    <td className="px-3 py-2.5 text-paper-dim">{c.predictedZone ? zoneById(c.predictedZone).name : '—'}</td>
                    <td className="px-3 py-2.5 mono text-paper-dim">{c.estimatedWithdrawal ?? '—'}</td>
                    <td className="px-5 py-2.5"><StatusBadge status={c.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel>
          <PanelHeader title="Prediction Overview" subtitle="Highest-confidence live prediction" />
          {topPrediction && predictions[topPrediction.id] ? (
            <div className="px-5 py-5 space-y-4">
              <div>
                <div className="text-xs text-paper-faint mb-1">Predicted Zone</div>
                <div className="text-lg font-medium mono text-intel-400">{zoneById(predictions[topPrediction.id].zone).name}</div>
                <div className="text-xs text-paper-faint mono">{predictions[topPrediction.id].zone}</div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-paper-faint mb-1">Confidence</div>
                  <div className="text-lg font-medium mono">{predictions[topPrediction.id].confidence}%</div>
                </div>
                <div>
                  <div className="text-xs text-paper-faint mb-1">Risk</div>
                  <RiskBadge risk={predictions[topPrediction.id].risk} />
                </div>
              </div>
              <div>
                <div className="text-xs text-paper-faint mb-1">Estimated Withdrawal Window</div>
                <div className="text-sm mono text-paper">{predictions[topPrediction.id].windowStart} – {predictions[topPrediction.id].windowEnd}</div>
              </div>
              <button onClick={() => openComplaint(topPrediction.id)} className="text-xs text-intel-400 hover:text-intel-300 mono">
                View complaint {topPrediction.id} →
              </button>
            </div>
          ) : (
            <EmptyState title="No live prediction yet" detail="Run predictive analysis on a complaint from the Predictions page to see it here." />
          )}
        </Panel>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Panel>
          <PanelHeader title="High-Risk Zones" subtitle="Zones ranked by predicted cash-out activity" />
          <div className="divide-y divide-line-soft">
            {HIGH_RISK_ZONES.filter((z) => z.risk === 'HIGH' || z.risk === 'CRITICAL')
              .sort((a, b) => b.predictedActivity - a.predictedActivity)
              .slice(0, 5)
              .map((z) => (
                <div key={z.zone} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <div className="text-sm text-paper">{zoneById(z.zone).name}</div>
                    <div className="text-xs text-paper-faint mono">{z.zone} · {z.complaintCount} complaints</div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-xs text-paper-faint">Historical</div>
                      <div className="text-sm mono text-paper-dim">{z.historicalActivity}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-paper-faint">Predicted</div>
                      <div className="text-sm mono text-warn-400">{z.predictedActivity}</div>
                    </div>
                    <RiskBadge risk={z.risk} />
                  </div>
                </div>
              ))}
          </div>
        </Panel>

        <Panel>
          <PanelHeader title="Recent Dispatches" subtitle="Latest intelligence sent to response partners" />
          {recentDispatches.length === 0 ? (
            <EmptyState title="No dispatches yet" detail="Dispatch intelligence from the Alerts & Dispatch page to populate this feed." />
          ) : (
            <div className="divide-y divide-line-soft">
              {recentDispatches.map((a) => (
                <div key={a.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <div className="text-sm text-paper">{a.complaintId} → {a.recipient}</div>
                    <div className="text-xs text-paper-faint mt-0.5">{a.intelligence}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-paper-faint mono">{a.dispatchedAt ? formatTime(a.dispatchedAt) : '—'}</span>
                    <AlertStatusBadge status={a.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>
    </div>
  )
}
