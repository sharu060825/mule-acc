import { ATM_LOCATIONS, zoneById } from './mockData'
import type { Complaint, Prediction, RiskLevel } from '../types'

// ---------------------------------------------------------------------------
// Every function here is a pure aggregation over the records that are already
// the single source of truth elsewhere in the app (the live `complaints` and
// `predictions` held in AppState, plus the static ATM_LOCATIONS list used by
// the GIS map). Nothing here invents a value that isn't traceable back to a
// field on an actual record.
// ---------------------------------------------------------------------------

export interface CountPoint {
  label: string
  count: number
}

/** Complaints grouped by calendar date, in chronological order. */
export function getComplaintsByDate(complaints: Complaint[]): CountPoint[] {
  const byDay = new Map<string, { count: number; sortKey: number }>()
  for (const c of complaints) {
    const d = new Date(c.timestamp)
    const label = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
    const sortKey = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
    const existing = byDay.get(label)
    byDay.set(label, { count: (existing?.count ?? 0) + 1, sortKey })
  }
  return Array.from(byDay.entries())
    .sort((a, b) => a[1].sortKey - b[1].sortKey)
    .map(([label, v]) => ({ label, count: v.count }))
}

/** Complaints grouped by the hour of day they were logged (0-23). */
export function getComplaintsByHour(complaints: Complaint[]): CountPoint[] {
  const hours = Array.from({ length: 24 }, (_, h) => ({ label: `${h.toString().padStart(2, '0')}:00`, count: 0 }))
  for (const c of complaints) {
    const h = new Date(c.timestamp).getHours()
    hours[h].count += 1
  }
  return hours.filter((h) => h.count > 0)
}

/** Complaints grouped by fraud type. */
export function getFraudTypeDistribution(complaints: Complaint[]): CountPoint[] {
  const counts = new Map<string, number>()
  for (const c of complaints) counts.set(c.fraudType, (counts.get(c.fraudType) ?? 0) + 1)
  return Array.from(counts.entries()).map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count)
}

/** Complaints grouped by risk level, in a fixed CRITICAL→LOW order. */
export function getRiskDistribution(complaints: Complaint[]): CountPoint[] {
  const order: RiskLevel[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']
  const counts = new Map<RiskLevel, number>(order.map((r) => [r, 0]))
  for (const c of complaints) counts.set(c.risk, (counts.get(c.risk) ?? 0) + 1)
  return order.map((r) => ({ label: r, count: counts.get(r) ?? 0 }))
}

/** Complaints grouped by the victim's bank. */
export function getBankDistribution(complaints: Complaint[]): CountPoint[] {
  const counts = new Map<string, number>()
  for (const c of complaints) counts.set(c.bank, (counts.get(c.bank) ?? 0) + 1)
  return Array.from(counts.entries()).map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count)
}

/** Stolen-amount records bucketed into ranges, counted from the actual amounts. */
export function getFraudAmountDistribution(complaints: Complaint[]): CountPoint[] {
  const buckets: Array<{ label: string; min: number; max: number }> = [
    { label: '< ₹50K', min: 0, max: 50000 },
    { label: '₹50K–2L', min: 50000, max: 200000 },
    { label: '₹2L–5L', min: 200000, max: 500000 },
    { label: '> ₹5L', min: 500000, max: Infinity },
  ]
  return buckets.map((b) => ({ label: b.label, count: complaints.filter((c) => c.amount >= b.min && c.amount < b.max).length }))
}

/** Complaints grouped by the victim's zone — where the fraud was reported from. */
export function getComplaintsByZone(complaints: Complaint[]): CountPoint[] {
  const counts = new Map<string, number>()
  for (const c of complaints) counts.set(c.victimZone, (counts.get(c.victimZone) ?? 0) + 1)
  return Array.from(counts.entries())
    .map(([zoneId, count]) => ({ label: zoneById(zoneId).name, count }))
    .sort((a, b) => b.count - a.count)
}

/**
 * Zones that a prediction has actually targeted (complaint.predictedZone is
 * only set once a prediction has been generated for that complaint). Returns
 * null if no complaint in the current dataset has a prediction yet, so the
 * UI can show an honest "not enough data" state instead of an empty chart.
 */
export function getPredictedZoneDistribution(complaints: Complaint[]): CountPoint[] | null {
  const predicted = complaints.filter((c) => c.predictedZone)
  if (predicted.length === 0) return null
  const counts = new Map<string, number>()
  for (const c of predicted) counts.set(c.predictedZone as string, (counts.get(c.predictedZone as string) ?? 0) + 1)
  return Array.from(counts.entries())
    .map(([zoneId, count]) => ({ label: zoneById(zoneId).name, count }))
    .sort((a, b) => b.count - a.count)
}

export interface VelocityPoint {
  id: string
  velocity: number
  destinations: number
  risk: RiskLevel
}

/** One point per complaint: its actual recorded transaction velocity and destination count. */
export function getTransactionVelocityPoints(complaints: Complaint[]): VelocityPoint[] {
  return complaints.map((c) => ({ id: c.id, velocity: c.transactionVelocity, destinations: c.numberOfDestinations, risk: c.risk }))
}

export interface VelocityStats {
  meanVelocity: number
  maxVelocity: number
  meanDestinations: number
  sampleSize: number
}

/** Summary statistics computed directly from each complaint's recorded velocity/destinations. */
export function getTransactionVelocityStats(complaints: Complaint[]): VelocityStats | null {
  if (complaints.length === 0) return null
  const velocities = complaints.map((c) => c.transactionVelocity)
  const destinations = complaints.map((c) => c.numberOfDestinations)
  return {
    meanVelocity: Number((velocities.reduce((s, v) => s + v, 0) / velocities.length).toFixed(2)),
    maxVelocity: Number(Math.max(...velocities).toFixed(2)),
    meanDestinations: Number((destinations.reduce((s, v) => s + v, 0) / destinations.length).toFixed(1)),
    sampleSize: complaints.length,
  }
}

export interface TimeToWithdrawalPoint {
  id: string
  minutes: number
}

/**
 * Actual minutes between a complaint's report timestamp and the start of its
 * predicted withdrawal window, computed only for complaints that have both.
 * Returns null when no complaint in the dataset has an estimated withdrawal
 * window yet, so the caller can render an honest "insufficient data" state.
 */
export function getTimeToWithdrawalPoints(complaints: Complaint[]): TimeToWithdrawalPoint[] | null {
  const withWindow = complaints.filter((c) => c.estimatedWithdrawal)
  if (withWindow.length === 0) return null

  const points: TimeToWithdrawalPoint[] = []
  for (const c of withWindow) {
    const startLabel = c.estimatedWithdrawal!.split('–')[0]?.trim()
    const match = startLabel?.match(/^(\d{1,2}):(\d{2})$/)
    if (!match) continue
    const reportTime = new Date(c.timestamp)
    const windowStart = new Date(reportTime)
    windowStart.setHours(Number(match[1]), Number(match[2]), 0, 0)
    if (windowStart.getTime() < reportTime.getTime()) {
      windowStart.setDate(windowStart.getDate() + 1)
    }
    const minutes = Math.round((windowStart.getTime() - reportTime.getTime()) / 60000)
    points.push({ id: c.id, minutes })
  }
  return points.length > 0 ? points : null
}

export interface ConfidencePoint {
  id: string
  confidence: number
  risk: RiskLevel
}

/**
 * Confidence values from predictions that have actually been generated in
 * this session (via the prediction engine, driven by each complaint's real
 * velocity/history/behaviour fields). Returns null until at least one
 * prediction exists, rather than inventing placeholder confidence numbers.
 */
export function getPredictionConfidenceDistribution(predictions: Record<string, Prediction>): ConfidencePoint[] | null {
  const values = Object.values(predictions)
  if (values.length === 0) return null
  return values
    .map((p) => ({ id: p.complaintId, confidence: p.confidence, risk: p.risk }))
    .sort((a, b) => b.confidence - a.confidence)
}

/** ATM infrastructure grouped by its recorded historical-activity density. Not derived from complaints — this is the same static ATM record set the GIS map reads. */
export function getAtmDensityDistribution(): CountPoint[] {
  const counts = new Map<string, number>()
  for (const a of ATM_LOCATIONS) counts.set(a.density, (counts.get(a.density) ?? 0) + 1)
  const order = ['HIGH', 'MEDIUM', 'LOW']
  return order.map((label) => ({ label, count: counts.get(label) ?? 0 }))
}
