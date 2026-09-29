import { useNavigate } from 'react-router-dom'
import { useAppState } from '../state/AppState'
import { HIGH_RISK_ZONES, zoneById } from '../data/mockData'
import { Metric, Panel, PanelHeader, RiskBadge, StatusBadge, AlertStatusBadge, TableScroll, formatINR, formatTime, EmptyState } from '../components/ui/Primitives'
import { calculateRegionXAI } from '../data/xai'
import { getRegionData } from './GisMap'

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

  const topPredictionXAI = topPrediction && predictions[topPrediction.id]
    ? calculateRegionXAI(
        predictions[topPrediction.id].zone,
        getRegionData(predictions[topPrediction.id].zone, complaints, predictions),
        complaints,
        predictions,
      )
    : null

  return (
    <div className="space-y-7">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#000000]">Operational Dashboard</h1>
        <p className="text-sm sm:text-base text-[#222222] font-medium mt-1">Live intelligence overview across active cybercrime complaints and predicted cash-out activity.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <Metric label="Active Complaints" value={activeComplaints.length} tone="intel" />
        <Metric label="High-Risk Incidents" value={highRisk.length} tone="critical" />
        <Metric label="Predicted Cash-Outs" value={predictedCount} tone="default" />
        <Metric label="Alerts Dispatched" value={dispatchedAlerts.length} tone="ok" />
        <Metric label="Accounts Flagged" value={flaggedAccounts} tone="default" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Panel className="lg:col-span-2">
          <PanelHeader title="Active Incidents" subtitle={`${activeComplaints.length} complaints currently in the pipeline`} />
          <TableScroll>
            <table className="w-full text-[15px]">
              <thead>
                <tr className="text-left text-xs font-bold text-[#111111] uppercase tracking-wider bg-[#F0F0EC] border-b border-[#D6D6D0]">
                  <th className="px-5 py-3">Complaint ID</th>
                  <th className="px-3 py-3">Fraud Type</th>
                  <th className="px-3 py-3">Amount</th>
                  <th className="px-3 py-3">Risk</th>
                  <th className="px-3 py-3">Predicted Zone</th>
                  <th className="px-3 py-3">Est. Withdrawal</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {activeComplaints.slice(0, 8).map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => openComplaint(c.id)}
                    className="border-b border-[#D6D6D0] last:border-0 hover:bg-[#F0F0EC] cursor-pointer transition-colors"
                  >
                    <td className="px-5 py-3.5 mono font-bold text-[#111111]">{c.id}</td>
                    <td className="px-3 py-3.5 text-[#111111] font-medium">{c.fraudType}</td>
                    <td className="px-3 py-3.5 mono text-[#111111] font-semibold">{formatINR(c.amount)}</td>
                    <td className="px-3 py-3.5"><RiskBadge risk={c.risk} /></td>
                    <td className="px-3 py-3.5 text-[#111111] font-medium">{c.predictedZone ? zoneById(c.predictedZone).name : '—'}</td>
                    <td className="px-3 py-3.5 mono text-[#111111] font-medium">{c.estimatedWithdrawal ?? '—'}</td>
                    <td className="px-5 py-3.5"><StatusBadge status={c.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableScroll>
        </Panel>

        <Panel>
          <PanelHeader title="Prediction Overview" subtitle="Highest-confidence live prediction" />
          {topPrediction && predictions[topPrediction.id] ? (
            <div className="px-5 py-5 space-y-4">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-[#222222] mb-1">Predicted Zone</div>
                <div className="text-xl font-bold mono text-[#102B3F]">{zoneById(predictions[topPrediction.id].zone).name}</div>
                <div className="text-xs text-[#222222] font-semibold mono mt-0.5">{predictions[topPrediction.id].zone}</div>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-[#222222] mb-1">Confidence</div>
                  <div className="text-xl font-bold mono text-[#000000]">{predictions[topPrediction.id].confidence}%</div>
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-[#222222] mb-1">Risk</div>
                  <RiskBadge risk={predictions[topPrediction.id].risk} />
                </div>
              </div>
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-[#222222] mb-1">Estimated Withdrawal Window</div>
                <div className="text-base mono font-semibold text-[#111111]">{predictions[topPrediction.id].windowStart} – {predictions[topPrediction.id].windowEnd}</div>
              </div>
              {topPredictionXAI && (
                <div className="border-t border-[#D6D6D0] pt-3">
                  <div className="text-xs font-bold uppercase tracking-wider text-[#102B3F] mb-1.5 flex items-center justify-between">
                    <span>WHY THIS RISK?</span>
                    <span className="text-[10px] text-[#222222] italic font-semibold">XAI Features</span>
                  </div>
                  <ul className="space-y-1 text-xs font-medium text-[#111111]">
                    {topPredictionXAI.positiveFactors.slice(0, 2).map((factor, i) => (
                      <li key={i} className="flex items-start gap-1.5 bg-[#F0F0EC] p-1.5 rounded border border-[#D6D6D0]">
                        <span className="text-[#102B3F] font-bold text-xs">+</span>
                        <span className="truncate">{factor}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <button onClick={() => openComplaint(topPrediction.id)} className="text-sm font-bold text-[#102B3F] hover:text-[#1F4057] underline cursor-pointer pt-1 inline-block">
                View complaint {topPrediction.id} →
              </button>
            </div>
          ) : (
            <EmptyState title="No live prediction yet" detail="Run predictive analysis on a complaint from the Predictions page to see it here." />
          )}
        </Panel>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Panel>
          <PanelHeader title="High-Risk Zones" subtitle="Zones ranked by predicted cash-out activity" />
          <div className="divide-y divide-[#D6D6D0]">
            {HIGH_RISK_ZONES.filter((z) => z.risk === 'HIGH' || z.risk === 'CRITICAL')
              .sort((a, b) => b.predictedActivity - a.predictedActivity)
              .slice(0, 5)
              .map((z) => (
                <div key={z.zone} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 hover:bg-[#F0F0EC] transition-colors">
                  <div>
                    <div className="text-base font-bold text-[#000000]">{zoneById(z.zone).name}</div>
                    <div className="text-xs text-[#222222] font-semibold mono mt-0.5">{z.zone} · {z.complaintCount} complaints</div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-xs font-semibold text-[#222222]">Historical</div>
                      <div className="text-sm mono font-bold text-[#111111]">{z.historicalActivity}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-semibold text-[#222222]">Predicted</div>
                      <div className="text-sm mono font-bold text-[#991B1B]">{z.predictedActivity}</div>
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
            <div className="divide-y divide-[#D6D6D0]">
              {recentDispatches.map((a) => (
                <div key={a.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 hover:bg-[#F0F0EC] transition-colors">
                  <div>
                    <div className="text-base font-bold text-[#000000]">{a.complaintId} → {a.recipient}</div>
                    <div className="text-sm text-[#222222] font-medium mt-0.5">{a.intelligence}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-[#222222] font-bold mono">{a.dispatchedAt ? formatTime(a.dispatchedAt) : '—'}</span>
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

