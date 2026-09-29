import { useMemo } from 'react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
} from 'recharts'
import { useAppState } from '../state/AppState'
import {
  getComplaintsByDate,
  getComplaintsByHour,
  getFraudTypeDistribution,
  getRiskDistribution,
  getBankDistribution,
  getFraudAmountDistribution,
  getComplaintsByZone,
  getPredictedZoneDistribution,
  getTransactionVelocityPoints,
  getTransactionVelocityStats,
  getTimeToWithdrawalPoints,
  getPredictionConfidenceDistribution,
  getAtmDensityDistribution,
} from '../data/analytics'
import { Panel, PanelHeader, EmptyState } from '../components/ui/Primitives'

const COLORS = ['#102B3F', '#1F4057', '#526B80', '#DCE5EA', '#2D4B63', '#41637D']
const RISK_COLORS: Record<string, string> = { CRITICAL: '#991B1B', HIGH: '#B91C1C', MEDIUM: '#92400E', LOW: '#166534' }

const TOOLTIP_STYLE = {
  background: '#FFFFFF',
  border: '1px solid #D6D6D0',
  borderRadius: 6,
  fontSize: 13,
  fontWeight: 'bold',
  color: '#000000',
  boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
}

function SourceNote({ children }: { children: React.ReactNode }) {
  return <div className="px-5 py-3 border-t border-[#D6D6D0] text-xs font-semibold text-[#222222]">{children}</div>
}

function InsufficientData({ detail }: { detail: string }) {
  return <EmptyState title="Not enough data yet" detail={detail} />
}

export default function Analytics() {
  const { complaints, predictions } = useAppState()

  const total = complaints.length

  const byDate = useMemo(() => getComplaintsByDate(complaints), [complaints])
  const byHour = useMemo(() => getComplaintsByHour(complaints), [complaints])
  const fraudTypes = useMemo(() => getFraudTypeDistribution(complaints), [complaints])
  const riskDistribution = useMemo(() => getRiskDistribution(complaints), [complaints])
  const bankDistribution = useMemo(() => getBankDistribution(complaints), [complaints])
  const amountDistribution = useMemo(() => getFraudAmountDistribution(complaints), [complaints])
  const zoneDistribution = useMemo(() => getComplaintsByZone(complaints), [complaints])
  const predictedZones = useMemo(() => getPredictedZoneDistribution(complaints), [complaints])
  const velocityPoints = useMemo(() => getTransactionVelocityPoints(complaints), [complaints])
  const velocityStats = useMemo(() => getTransactionVelocityStats(complaints), [complaints])
  const timeToWithdrawal = useMemo(() => getTimeToWithdrawalPoints(complaints), [complaints])
  const confidencePoints = useMemo(() => getPredictionConfidenceDistribution(predictions), [predictions])
  const atmDensity = useMemo(() => getAtmDensityDistribution(), [])

  return (
    <div className="space-y-7">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#000000]">Analytics</h1>
        <p className="text-sm sm:text-base text-[#222222] font-medium mt-1">
          Every figure below is computed live from the {total} complaint record{total === 1 ? '' : 's'} and {Object.keys(predictions).length} generated prediction
          {Object.keys(predictions).length === 1 ? '' : 's'} currently held in application state — the same records shown on the Dashboard and Complaints pages.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Panel>
          <PanelHeader title="Complaints Over Time" subtitle="Grouped by report date" />
          <div className="px-5 py-4 h-60 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={byDate}>
                <CartesianGrid strokeDasharray="3 3" stroke="#D6D6D0" opacity={0.8} />
                <XAxis dataKey="label" stroke="#222222" fontSize={12} fontWeight="600" />
                <YAxis stroke="#222222" fontSize={12} fontWeight="600" allowDecimals={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Line type="monotone" dataKey="count" stroke="#102B3F" strokeWidth={2.5} dot={{ r: 4, fill: '#102B3F' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <SourceNote>Derived from {total} complaint records, grouped by their report timestamp.</SourceNote>
        </Panel>

        <Panel>
          <PanelHeader title="Hourly Complaint Pattern" subtitle="Grouped by hour of day reported" />
          <div className="px-5 py-4 h-60 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byHour}>
                <CartesianGrid strokeDasharray="3 3" stroke="#D6D6D0" opacity={0.8} />
                <XAxis dataKey="label" stroke="#222222" fontSize={11} fontWeight="600" interval={0} angle={-45} textAnchor="end" height={50} />
                <YAxis stroke="#222222" fontSize={12} fontWeight="600" allowDecimals={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Bar dataKey="count" fill="#1F4057" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <SourceNote>Derived from the complaint_hour of each of {total} complaint records.</SourceNote>
        </Panel>

        <Panel>
          <PanelHeader title="Fraud Type Distribution" />
          <div className="px-5 py-4 h-60 sm:h-64 flex items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={fraudTypes} dataKey="count" nameKey="label" cx="50%" cy="50%" outerRadius={85} label={{ fontSize: 12, fill: '#111111', fontWeight: 'bold' }}>
                  {fraudTypes.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={TOOLTIP_STYLE} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <SourceNote>Counted directly from the fraud_type field of {total} complaint records.</SourceNote>
        </Panel>

        <Panel>
          <PanelHeader title="Risk Level Distribution" />
          <div className="px-5 py-4 h-60 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={riskDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#D6D6D0" opacity={0.8} />
                <XAxis dataKey="label" stroke="#222222" fontSize={12} fontWeight="600" />
                <YAxis stroke="#222222" fontSize={12} fontWeight="600" allowDecimals={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Bar dataKey="count" radius={[3, 3, 0, 0]}>
                  {riskDistribution.map((d, i) => (
                    <Cell key={i} fill={RISK_COLORS[d.label] ?? '#1F4057'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <SourceNote>Counted directly from the risk field of {total} complaint records.</SourceNote>
        </Panel>

        <Panel>
          <PanelHeader title="Stolen Amount Distribution" subtitle="Bucketed by actual amount" />
          <div className="px-5 py-4 h-60 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={amountDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#D6D6D0" opacity={0.8} />
                <XAxis dataKey="label" stroke="#222222" fontSize={12} fontWeight="600" />
                <YAxis stroke="#222222" fontSize={12} fontWeight="600" allowDecimals={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Bar dataKey="count" fill="#102B3F" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <SourceNote>Complaints bucketed by their actual stolen_amount value ({total} records).</SourceNote>
        </Panel>

        <Panel>
          <PanelHeader title="Complaints by Bank" />
          <div className="px-5 py-4 h-60 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bankDistribution} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#D6D6D0" opacity={0.8} />
                <XAxis type="number" stroke="#222222" fontSize={12} fontWeight="600" allowDecimals={false} />
                <YAxis dataKey="label" type="category" stroke="#222222" fontSize={11} fontWeight="600" width={110} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Bar dataKey="count" fill="#1F4057" radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <SourceNote>Counted directly from the bank field of {total} complaint records.</SourceNote>
        </Panel>

        <Panel>
          <PanelHeader title="Complaints by Victim Zone" subtitle="Where the fraud was reported from" />
          <div className="px-5 py-4 h-60 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={zoneDistribution} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#D6D6D0" opacity={0.8} />
                <XAxis type="number" stroke="#222222" fontSize={12} fontWeight="600" allowDecimals={false} />
                <YAxis dataKey="label" type="category" stroke="#222222" fontSize={11} fontWeight="600" width={90} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Bar dataKey="count" fill="#102B3F" radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <SourceNote>Counted from the victim_zone field of {total} complaint records.</SourceNote>
        </Panel>

        <Panel>
          <PanelHeader title="Predicted Cash-Out Zones" subtitle="Zones actually targeted by a generated prediction" />
          {predictedZones ? (
            <>
              <div className="px-5 py-4 h-60 sm:h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={predictedZones} layout="vertical" margin={{ left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#D6D6D0" opacity={0.8} />
                    <XAxis type="number" stroke="#222222" fontSize={12} fontWeight="600" allowDecimals={false} />
                    <YAxis dataKey="label" type="category" stroke="#222222" fontSize={11} fontWeight="600" width={90} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                    <Bar dataKey="count" fill="#1F4057" radius={[0, 3, 3, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <SourceNote>
                Counted from the predicted_zone field of {complaints.filter((c) => c.predictedZone).length} complaint{complaints.filter((c) => c.predictedZone).length === 1 ? '' : 's'} with a generated prediction.
              </SourceNote>
            </>
          ) : (
            <InsufficientData detail="No complaint in this dataset has a generated prediction yet. Run predictive analysis on a complaint from the Predictions page to populate this chart." />
          )}
        </Panel>

        <Panel>
          <PanelHeader title="Transaction Velocity vs Destinations" />
          <div className="px-5 py-4 h-60 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke="#D6D6D0" opacity={0.8} />
                <XAxis dataKey="velocity" name="Velocity (tx/hr)" stroke="#222222" fontSize={12} fontWeight="600" />
                <YAxis dataKey="destinations" name="Destinations" stroke="#222222" fontSize={12} fontWeight="600" allowDecimals={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ strokeDasharray: '3 3' }} />
                <Scatter data={velocityPoints} fill="#102B3F" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          <SourceNote>
            Each point is one complaint's recorded transaction_velocity and number_of_destinations.
            {velocityStats && ` Mean velocity ${velocityStats.meanVelocity} tx/hr, mean destinations ${velocityStats.meanDestinations}, across ${velocityStats.sampleSize} records.`}
          </SourceNote>
        </Panel>

        <Panel>
          <PanelHeader title="Time to Predicted Withdrawal" subtitle="Complaint timestamp → start of predicted withdrawal window" />
          {timeToWithdrawal ? (
            <>
              <div className="px-5 py-4 h-60 sm:h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={timeToWithdrawal}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#D6D6D0" opacity={0.8} />
                    <XAxis dataKey="id" stroke="#222222" fontSize={11} fontWeight="600" />
                    <YAxis stroke="#222222" fontSize={12} fontWeight="600" label={{ value: 'minutes', angle: -90, position: 'insideLeft', fontSize: 11, fill: '#222222', fontWeight: 'bold' }} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                    <Bar dataKey="minutes" fill="#1F4057" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <SourceNote>
                Calculated as (estimated_withdrawal_window_start − complaint_timestamp) for {timeToWithdrawal.length} complaint{timeToWithdrawal.length === 1 ? '' : 's'} with a predicted window.
              </SourceNote>
            </>
          ) : (
            <InsufficientData detail="No complaint has an estimated withdrawal window yet. This chart populates once predictions have been generated." />
          )}
        </Panel>

        <Panel>
          <PanelHeader title="Prediction Confidence" subtitle="From predictions generated this session" />
          {confidencePoints ? (
            <>
              <div className="px-5 py-4 h-60 sm:h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={confidencePoints}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#D6D6D0" opacity={0.8} />
                    <XAxis dataKey="id" stroke="#222222" fontSize={11} fontWeight="600" />
                    <YAxis stroke="#222222" fontSize={12} fontWeight="600" domain={[0, 100]} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                    <Bar dataKey="confidence" radius={[3, 3, 0, 0]}>
                      {confidencePoints.map((p, i) => (
                        <Cell key={i} fill={RISK_COLORS[p.risk] ?? '#102B3F'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <SourceNote>
                Confidence values from the {confidencePoints.length} prediction{confidencePoints.length === 1 ? '' : 's'} generated in this session, computed by the prediction engine from each complaint's velocity, history and behaviour fields. Demo analytics — not a trained model's output.
              </SourceNote>
            </>
          ) : (
            <InsufficientData detail="No predictions have been generated yet. Run predictive analysis from the Predictions page to see confidence values here." />
          )}
        </Panel>

        <Panel>
          <PanelHeader title="ATM Infrastructure by Historical Density" subtitle="Mock infrastructure data, not complaint-derived" />
          <div className="px-5 py-4 h-60 sm:h-64 flex items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={atmDensity} dataKey="count" nameKey="label" cx="50%" cy="50%" outerRadius={85} label={{ fontSize: 12, fill: '#111111', fontWeight: 'bold' }}>
                  {atmDensity.map((entry, i) => (
                    <Cell key={i} fill={entry.label === 'HIGH' ? '#991B1B' : entry.label === 'MEDIUM' ? '#92400E' : '#166534'} />
                  ))}
                </Pie>
                <Tooltip contentStyle={TOOLTIP_STYLE} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <SourceNote>Based on the {atmDensity.reduce((s, d) => s + d.count, 0)} ATM location records used by the GIS map. Historical mock data.</SourceNote>
        </Panel>
      </div>
    </div>
  )
}

