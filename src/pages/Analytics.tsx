import { useMemo, useState } from 'react'
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
import { COMPLAINTS, HIGH_RISK_ZONES, ATM_LOCATIONS, zoneById } from '../data/mockData'
import { Panel, PanelHeader } from '../components/ui/Primitives'

const COLORS = ['#3b82f6', '#ef4444', '#f59e0b', '#22c55e', '#a78bfa', '#5b9bf9']

const TOOLTIP_STYLE = {
  background: '#0c1017',
  border: '1px solid #1f2833',
  borderRadius: 6,
  fontSize: 12,
  color: '#e8ecf1',
}

function chartsData() {
  const byDay: Record<string, number> = {}
  COMPLAINTS.forEach((c) => {
    const d = new Date(c.timestamp)
    const key = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
    byDay[key] = (byDay[key] ?? 0) + 1
  })
  const complaintsOverTime = Object.entries(byDay)
    .map(([date, count]) => ({ date, count }))
    .reverse()

  const fraudTypeCounts: Record<string, number> = {}
  COMPLAINTS.forEach((c) => (fraudTypeCounts[c.fraudType] = (fraudTypeCounts[c.fraudType] ?? 0) + 1))
  const fraudTypeDistribution = Object.entries(fraudTypeCounts).map(([name, value]) => ({ name, value }))

  const amountBuckets = [
    { label: '< ₹50K', min: 0, max: 50000 },
    { label: '₹50K–2L', min: 50000, max: 200000 },
    { label: '₹2L–5L', min: 200000, max: 500000 },
    { label: '> ₹5L', min: 500000, max: Infinity },
  ]
  const fraudAmountDistribution = amountBuckets.map((b) => ({
    label: b.label,
    count: COMPLAINTS.filter((c) => c.amount >= b.min && c.amount < b.max).length,
  }))

  const cashOutConcentration = HIGH_RISK_ZONES.map((z) => ({
    zone: zoneById(z.zone).name,
    historical: z.historicalActivity,
  })).sort((a, b) => b.historical - a.historical)

  const predictedZones = HIGH_RISK_ZONES.map((z) => ({
    zone: zoneById(z.zone).name,
    predicted: z.predictedActivity,
  })).sort((a, b) => b.predicted - a.predicted)

  const velocityScatter = COMPLAINTS.map((c) => ({
    x: c.transactionVelocity,
    y: c.numberOfDestinations,
    risk: c.risk,
  }))

  const timeLag = COMPLAINTS.filter((c) => c.estimatedWithdrawal).map((c) => ({
    id: c.id,
    minutes: Math.round(parseFloat(c.timeSinceLastTransaction) || 10),
  }))

  const atmRisk: Record<string, number> = { HIGH: 0, MEDIUM: 0, LOW: 0 }
  ATM_LOCATIONS.forEach((a) => (atmRisk[a.density] += 1))
  const atmRiskConcentration = Object.entries(atmRisk).map(([name, value]) => ({ name, value }))

  return { complaintsOverTime, fraudTypeDistribution, fraudAmountDistribution, cashOutConcentration, predictedZones, velocityScatter, timeLag, atmRiskConcentration }
}

export default function Analytics() {
  const [data] = useState(chartsData)
  const totalComplaints = COMPLAINTS.length

  const summary = useMemo(
    () => ({
      avgAmount: Math.round(COMPLAINTS.reduce((s, c) => s + c.amount, 0) / totalComplaints),
      avgVelocity: (COMPLAINTS.reduce((s, c) => s + c.transactionVelocity, 0) / totalComplaints).toFixed(1),
    }),
    [totalComplaints],
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-medium tracking-tight">Analytics</h1>
        <p className="text-sm text-paper-faint mt-1">
          {totalComplaints} complaints analyzed · average stolen amount ₹{summary.avgAmount.toLocaleString('en-IN')} · average velocity {summary.avgVelocity} tx/hr
        </p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Panel>
          <PanelHeader title="Complaints Over Time" />
          <div className="px-5 py-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.complaintsOverTime}>
                <CartesianGrid strokeDasharray="3 3" stroke="#171d26" />
                <XAxis dataKey="date" stroke="#5b6572" fontSize={11} />
                <YAxis stroke="#5b6572" fontSize={11} allowDecimals={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel>
          <PanelHeader title="Fraud Type Distribution" />
          <div className="px-5 py-4 h-64 flex items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data.fraudTypeDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={{ fontSize: 11, fill: '#8b96a5' }}>
                  {data.fraudTypeDistribution.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={TOOLTIP_STYLE} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel>
          <PanelHeader title="Fraud Amount Distribution" />
          <div className="px-5 py-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.fraudAmountDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#171d26" />
                <XAxis dataKey="label" stroke="#5b6572" fontSize={11} />
                <YAxis stroke="#5b6572" fontSize={11} allowDecimals={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Bar dataKey="count" fill="#3b82f6" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel>
          <PanelHeader title="Historical Cash-Out Concentration" subtitle="By zone" />
          <div className="px-5 py-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.cashOutConcentration} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#171d26" />
                <XAxis type="number" stroke="#5b6572" fontSize={11} />
                <YAxis dataKey="zone" type="category" stroke="#5b6572" fontSize={10} width={90} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Bar dataKey="historical" fill="#f59e0b" radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel>
          <PanelHeader title="Predicted Cash-Out Zones" subtitle="By zone" />
          <div className="px-5 py-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.predictedZones} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#171d26" />
                <XAxis type="number" stroke="#5b6572" fontSize={11} />
                <YAxis dataKey="zone" type="category" stroke="#5b6572" fontSize={10} width={90} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Bar dataKey="predicted" fill="#ef4444" radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel>
          <PanelHeader title="Transaction Velocity vs Destinations" />
          <div className="px-5 py-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke="#171d26" />
                <XAxis dataKey="x" name="Velocity (tx/hr)" stroke="#5b6572" fontSize={11} />
                <YAxis dataKey="y" name="Destinations" stroke="#5b6572" fontSize={11} allowDecimals={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ strokeDasharray: '3 3' }} />
                <Scatter data={data.velocityScatter} fill="#3b82f6" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel>
          <PanelHeader title="Withdrawal Time-Lag" subtitle="Minutes since last transaction (predicted complaints)" />
          <div className="px-5 py-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.timeLag}>
                <CartesianGrid strokeDasharray="3 3" stroke="#171d26" />
                <XAxis dataKey="id" stroke="#5b6572" fontSize={10} />
                <YAxis stroke="#5b6572" fontSize={11} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Bar dataKey="minutes" fill="#a78bfa" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel>
          <PanelHeader title="ATM Risk Concentration" subtitle="By historical density" />
          <div className="px-5 py-4 h-64 flex items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data.atmRiskConcentration} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={{ fontSize: 11, fill: '#8b96a5' }}>
                  {data.atmRiskConcentration.map((entry, i) => (
                    <Cell key={i} fill={entry.name === 'HIGH' ? '#ef4444' : entry.name === 'MEDIUM' ? '#f59e0b' : '#22c55e'} />
                  ))}
                </Pie>
                <Tooltip contentStyle={TOOLTIP_STYLE} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>
    </div>
  )
}
