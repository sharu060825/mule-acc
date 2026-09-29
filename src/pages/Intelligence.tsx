import { useState } from 'react'
import { ChevronDown, ArrowDown } from 'lucide-react'
import { useAppState } from '../state/AppState'
import { buildTransactionTrail, buildResponseTimeline, FEATURE_GROUPS, zoneById } from '../data/mockData'
import { Panel, PanelHeader, EmptyState, formatINR, formatDateTime } from '../components/ui/Primitives'
import ComplaintPicker from '../components/ui/ComplaintPicker'

function Field({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <div className="text-sm font-semibold text-[#222222] mb-0.5">{label}</div>
      <div className="text-[16px] font-bold mono text-[#111111]">{value}</div>
    </div>
  )
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-[#D6D6D0] first:border-t-0 px-5 py-5">
      <div className="text-sm font-bold text-[#102B3F] mb-3 tracking-wider uppercase">{title}</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">{children}</div>
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
    <div className="space-y-7">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#000000]">Input Intelligence</h1>
          <p className="text-sm sm:text-base text-[#222222] font-medium mt-1">What the system currently knows about {c.id}.</p>
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

        <div className="border-t border-[#D6D6D0] px-5 py-4">
          <button
            onClick={() => setShowFeatures((s) => !s)}
            className="flex items-center gap-2 text-sm font-bold text-[#102B3F] hover:text-[#1F4057] cursor-pointer"
          >
            <ChevronDown size={16} className={`transition-transform ${showFeatures ? 'rotate-180' : ''}`} />
            {showFeatures ? 'Hide' : 'Show'} Feature Details — 88 prediction inputs
          </button>
          {showFeatures && (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-6">
              {FEATURE_GROUPS.map((g) => (
                <div key={g.group}>
                  <div className="text-xs font-bold text-[#222222] uppercase tracking-wider mb-2">{g.group}</div>
                  <div className="flex flex-wrap gap-1.5">
                    {g.features.map((f) => (
                      <span key={f} className="text-xs mono font-semibold bg-[#F0F0EC] border border-[#D6D6D0] rounded px-2 py-0.5 text-[#111111]">
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
        <div className="px-5 py-6 space-y-0">
          {trail.map((node, i) => (
            <div key={node.id}>
              <div className="border border-[#D6D6D0] rounded-md px-5 py-4 bg-[#F0F0EC]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold mono text-[#102B3F] tracking-wide uppercase">{node.label}</span>
                  <span className="text-xs font-semibold text-[#222222] mono">{node.timestamp}</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                  <div><div className="text-xs font-semibold text-[#222222] mb-0.5">Account</div><div className="text-[#111111] mono font-bold truncate">{node.account}</div></div>
                  <div><div className="text-xs font-semibold text-[#222222] mb-0.5">Amount</div><div className="text-[#111111] mono font-bold">{formatINR(node.amount)}</div></div>
                  <div><div className="text-xs font-semibold text-[#222222] mb-0.5">Channel</div><div className="text-[#111111] font-medium">{node.channel}</div></div>
                  <div><div className="text-xs font-semibold text-[#222222] mb-0.5">Velocity</div><div className="text-[#111111] mono font-medium">{node.velocity}</div></div>
                </div>
                <div className="mt-2 text-xs font-semibold text-[#222222]">→ Destination: {node.destination}</div>
              </div>
              {i < trail.length - 1 && (
                <div className="flex justify-center py-2">
                  <ArrowDown size={18} className="text-[#102B3F]" strokeWidth={2.5} />
                </div>
              )}
            </div>
          ))}
        </div>
      </Panel>

      <Panel>
        <PanelHeader title="Response Timeline" subtitle="Stage-by-stage intelligence pipeline for this complaint" />
        <div className="px-5 py-6 space-y-0">
          {timeline.map((stage, i) => (
            <div key={stage.key} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div
                  className={`w-3.5 h-3.5 rounded-full shrink-0 mt-1 border border-[#D6D6D0] ${
                    stage.status === 'COMPLETE' ? 'bg-[#15803D]' : stage.status === 'IN_PROGRESS' ? 'bg-[#B45309]' : 'bg-[#D6D6D0]'
                  }`}
                />
                {i < timeline.length - 1 && <div className="w-0.5 flex-1 bg-[#D6D6D0]" />}
              </div>
              <div className="pb-6">
                <div className="flex items-center gap-2">
                  <span className={`text-[16px] font-bold ${stage.status === 'PENDING' ? 'text-[#222222]' : 'text-[#000000]'}`}>{stage.label}</span>
                  {stage.timestamp && <span className="text-xs text-[#222222] font-semibold mono">{formatDateTime(stage.timestamp)}</span>}
                </div>
                <div className="text-sm text-[#222222] font-medium mt-0.5">{stage.detail}</div>
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  )
}

