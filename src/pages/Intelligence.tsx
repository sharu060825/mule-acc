import { useState } from 'react'
import { ChevronDown, ArrowDown } from 'lucide-react'
import { useAppState } from '../state/AppState'
import { buildTransactionTrail, buildResponseTimeline, FEATURE_GROUPS, zoneById } from '../data/mockData'
import { Panel, PanelHeader, EmptyState, formatINR, formatDateTime } from '../components/ui/Primitives'
import ComplaintPicker from '../components/ui/ComplaintPicker'

function Field({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <div className="text-xs text-paper-faint mb-1">{label}</div>
      <div className="text-sm mono text-paper">{value}</div>
    </div>
  )
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-line-soft first:border-t-0 px-4 py-4 sm:px-5">
      <div className="text-xs font-medium text-intel-400 mb-3 tracking-tight">{title}</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{children}</div>
    </div>
  )
}

export default function Intelligence() {
  const { selectedComplaint } = useAppState()
  const [showFeatures, setShowFeatures] = useState(false)

  if (!selectedComplaint) {
    return <EmptyState title="No complaint selected" detail="Choose a complaint to view its input intelligence." />
  }

  const c = selectedComplaint
  const trail = buildTransactionTrail(c)
  const timeline = buildResponseTimeline(c)
  const zone = zoneById(c.victimZone)
  const t = new Date(c.timestamp)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-medium tracking-tight">Input Intelligence</h1>
          <p className="text-sm text-paper-faint mt-1">What the system currently knows about {c.id}.</p>
        </div>
        <ComplaintPicker />
      </div>

      <Panel>
        <PanelHeader title="Complaint Intelligence" />
        <Group title="Complaint Intelligence">
          <Field label="Complaint ID" value={c.id} />
          <Field label="Fraud Type" value={c.fraudType} />
          <Field label="Complaint Timestamp" value={formatDateTime(c.timestamp)} />
          <Field label="Victim Location" value={`${c.victimCity}`} />
          <Field label="Victim Zone" value={`${zone.name} (${zone.id})`} />
        </Group>

        <Group title="Financial Intelligence">
          <Field label="Stolen Amount" value={formatINR(c.amount)} />
          <Field label="Balance Change" value={formatINR(c.balanceChange)} />
          <Field label="Transaction Type" value={c.transactionType} />
          <Field label="Transaction Channel" value={c.transactionChannel} />
        </Group>

        <Group title="Transaction Intelligence">
          <Field label="Transaction Frequency" value={`${c.transactionFrequency} / day`} />
          <Field label="Transaction Velocity" value={`${c.transactionVelocity.toFixed(1)} tx/hr`} />
          <Field label="Number of Destinations" value={c.numberOfDestinations} />
          <Field label="Time Since Last Transaction" value={c.timeSinceLastTransaction} />
          <Field label="Beneficiary Activity" value={c.beneficiaryActivity} />
        </Group>

        <Group title="Temporal Intelligence">
          <Field label="Complaint Hour" value={t.getHours()} />
          <Field label="Day" value={t.getDate()} />
          <Field label="Weekday" value={t.toLocaleDateString('en-IN', { weekday: 'long' })} />
          <Field label="Weekend" value={[0, 6].includes(t.getDay()) ? 'Yes' : 'No'} />
          <Field label="Time Since Suspicious Transaction" value={c.timeSinceLastTransaction} />
        </Group>

        <Group title="Behavioral Intelligence">
          <Field label="Previous Fraud Count" value={c.previousFraudCount} />
          <Field label="Transaction Velocity" value={`${c.transactionVelocity.toFixed(1)} tx/hr`} />
          <Field label="Rapid Fund Movement" value={c.rapidFundMovement ? 'Detected' : 'Not detected'} />
          <Field label="Destination Count" value={c.numberOfDestinations} />
          <Field label="Unusual Activity" value={c.unusualActivity} />
        </Group>

        <Group title="Historical Intelligence">
          <Field label="Historical Fraud Count" value={c.historicalFraudCount} />
          <Field label="Fraud Rate" value={`${(c.fraudRate * 100).toFixed(1)}%`} />
          <Field label="Cybercrime Rate" value={`${(c.cityCybercrimeRate * 100).toFixed(1)}%`} />
          <Field label="Historical Cash-Out Concentration" value={`${(c.historicalCashOutConcentration * 100).toFixed(0)}%`} />
        </Group>

        <Group title="Geospatial Intelligence">
          <Field label="Victim Coordinates" value={`${c.victimLocation.lat.toFixed(4)}, ${c.victimLocation.lng.toFixed(4)}`} />
          <Field label="Victim Zone" value={`${zone.name} (${zone.id})`} />
          <Field label="Cell Coordinates" value={`${c.cellCoordinates.lat.toFixed(4)}, ${c.cellCoordinates.lng.toFixed(4)}`} />
          <Field label="ATM Density" value={`${c.atmDensity} / km²`} />
          <Field label="Distance to High-Risk Zone" value={`${c.distanceToHighRiskZone} km`} />
          <Field label="Distance to Nearest ATM" value={`${c.distanceToNearestAtm} km`} />
        </Group>

        <div className="border-t border-line-soft px-5 py-4">
          <button
            onClick={() => setShowFeatures((s) => !s)}
            className="flex items-center gap-2 text-xs text-paper-dim hover:text-paper"
          >
            <ChevronDown size={14} className={`transition-transform ${showFeatures ? 'rotate-180' : ''}`} />
            {showFeatures ? 'Hide' : 'Show'} Feature Details — 88 prediction inputs
          </button>
          {showFeatures && (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-6">
              {FEATURE_GROUPS.map((g) => (
                <div key={g.group}>
                  <div className="text-xs font-medium text-paper-dim mb-2">{g.group}</div>
                  <div className="flex flex-wrap gap-1.5">
                    {g.features.map((f) => (
                      <span key={f} className="text-[0.65rem] mono bg-ink border border-line-soft rounded px-1.5 py-0.5 text-paper-faint">
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Panel>

      <Panel>
        <PanelHeader title="Transaction Trail" subtitle="Fund movement from victim to potential cash-out" />
        <div className="px-4 py-5 sm:px-5 sm:py-6 space-y-0">
          {trail.map((node, i) => (
            <div key={node.id}>
              <div className="border border-line-soft rounded-md px-4 py-3 bg-panel-raised">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium mono text-intel-400 tracking-wide">{node.label}</span>
                  <span className="text-xs text-paper-faint mono">{node.timestamp}</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div><div className="text-paper-faint mb-0.5">Account</div><div className="text-paper-dim mono truncate">{node.account}</div></div>
                  <div><div className="text-paper-faint mb-0.5">Amount</div><div className="text-paper mono">{formatINR(node.amount)}</div></div>
                  <div><div className="text-paper-faint mb-0.5">Channel</div><div className="text-paper-dim">{node.channel}</div></div>
                  <div><div className="text-paper-faint mb-0.5">Velocity</div><div className="text-paper-dim mono">{node.velocity}</div></div>
                </div>
                <div className="mt-2 text-xs text-paper-faint">→ {node.destination}</div>
              </div>
              {i < trail.length - 1 && (
                <div className="flex justify-center py-1.5">
                  <ArrowDown size={14} className="text-paper-faint" />
                </div>
              )}
            </div>
          ))}
        </div>
      </Panel>

      <Panel>
        <PanelHeader title="Response Timeline" subtitle="Stage-by-stage intelligence pipeline for this complaint" />
        <div className="px-4 py-5 sm:px-5 space-y-0">
          {timeline.map((stage, i) => (
            <div key={stage.key} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div
                  className={`w-2.5 h-2.5 rounded-full shrink-0 mt-1 ${
                    stage.status === 'COMPLETE' ? 'bg-ok-400' : stage.status === 'IN_PROGRESS' ? 'bg-warn-400 animate-pulse' : 'bg-line'
                  }`}
                />
                {i < timeline.length - 1 && <div className="w-px flex-1 bg-line-soft" />}
              </div>
              <div className="pb-5">
                <div className="flex items-center gap-2">
                  <span className={`text-sm ${stage.status === 'PENDING' ? 'text-paper-faint' : 'text-paper'}`}>{stage.label}</span>
                  {stage.timestamp && <span className="text-xs text-paper-faint mono">{formatDateTime(stage.timestamp)}</span>}
                </div>
                <div className="text-xs text-paper-faint mt-0.5">{stage.detail}</div>
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  )
}
