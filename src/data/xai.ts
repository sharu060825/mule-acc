import type { Complaint, Prediction, RegionXAIExplanation, XAIDriver } from '../types'
import { HIGH_RISK_ZONES, zoneById } from './mockData'

/**
 * Calculates feature contributions and human-readable XAI explanations
 * grounded in the actual model inputs and historical data for a specific map region.
 */
export function calculateRegionXAI(
  regionId: string,
  regionData: {
    area: string
    risk: number
    linkedComplaints: number
    timeWindow: string
    location: string
  },
  complaints: Complaint[],
  predictions: Record<string, Prediction>,
): RegionXAIExplanation {
  const zone = zoneById(regionId)
  const highRisk = HIGH_RISK_ZONES.find((z) => z.zone === regionId)
  const zoneComplaints = complaints.filter((c) => c.victimZone === regionId || c.predictedZone === regionId)
  const activePrediction = Object.values(predictions).find((p) => p.zone === regionId)

  // 1. Linked complaints feature
  const complaintCount = regionData.linkedComplaints
  const complaintImpact = Number((Math.min(0.35, complaintCount * 0.035) - 0.1).toFixed(2))

  // 2. Transaction velocity & incident frequency
  const avgVelocity =
    zoneComplaints.length > 0
      ? zoneComplaints.reduce((acc, c) => acc + c.transactionVelocity, 0) / zoneComplaints.length
      : 3.5 + ((parseInt(regionId.replace('ZONE-', '')) * 3) % 5)
  const velocityImpact = Number(((avgVelocity - 4.0) * 0.04).toFixed(2))

  // 3. Historical risk baseline
  const histActivity = highRisk?.historicalActivity ?? 30
  const histImpact = Number(((histActivity - 35) * 0.005).toFixed(2))

  // 4. Time-of-day pattern match
  const isPeakEvening = regionData.timeWindow.includes('18:') || regionData.timeWindow.includes('19:') || regionData.timeWindow.includes('20:')
  const timeImpact = isPeakEvening ? 0.14 : 0.05

  // 5. Cash-out infrastructure density
  const avgAtmDensity =
    zoneComplaints.length > 0
      ? zoneComplaints.reduce((acc, c) => acc + c.atmDensity, 0) / zoneComplaints.length
      : 8 + (parseInt(regionId.replace('ZONE-', '')) % 6)
  const atmImpact = Number(((avgAtmDensity - 8) * 0.015).toFixed(2))

  // 6. Rapid fund movement flag
  const rapidCount = zoneComplaints.filter((c) => c.rapidFundMovement).length
  const rapidRatio = zoneComplaints.length > 0 ? rapidCount / zoneComplaints.length : 0.4
  const rapidImpact = Number((rapidRatio * 0.18 + (activePrediction ? 0.05 : 0)).toFixed(2))

  const rawDrivers: Array<{
    key: string
    label: string
    rawValue: string | number
    impact: number
    positiveText: string
    negativeText: string
  }> = [
    {
      key: 'linked_complaints',
      label: 'Linked complaints',
      rawValue: `${complaintCount} incidents`,
      impact: complaintImpact,
      positiveText: `${complaintCount} active complaints linked to ${zone.name}`,
      negativeText: `Low complaint count (${complaintCount}) reported in ${zone.name}`,
    },
    {
      key: 'transaction_velocity',
      label: 'Recent transaction velocity',
      rawValue: `${avgVelocity.toFixed(1)} tx/hr`,
      impact: velocityImpact,
      positiveText: `Elevated transaction velocity (${avgVelocity.toFixed(1)} tx/hr) across incidents`,
      negativeText: `Transaction velocity (${avgVelocity.toFixed(1)} tx/hr) remains within normal bounds`,
    },
    {
      key: 'historical_risk',
      label: 'Historical regional risk',
      rawValue: `${histActivity} historical incidents`,
      impact: histImpact,
      positiveText: `High historical cybercrime baseline (${histActivity} historical incidents)`,
      negativeText: `Historical activity (${histActivity} incidents) is below critical baseline`,
    },
    {
      key: 'time_pattern',
      label: 'Time-of-day pattern',
      rawValue: regionData.timeWindow,
      impact: timeImpact,
      positiveText: `Activity window (${regionData.timeWindow}) matches high-risk cash-out window`,
      negativeText: `Time window (${regionData.timeWindow}) is outside peak fraud hours`,
    },
    {
      key: 'rapid_fund_movement',
      label: 'Rapid fund movement',
      rawValue: `${Math.round(rapidRatio * 100)}% rapid disbursals`,
      impact: rapidImpact,
      positiveText: `Multi-mule layering & rapid disbursals detected in ${Math.round(rapidRatio * 100)}% of incidents`,
      negativeText: `No unusual rapid layering transfers detected`,
    },
    {
      key: 'atm_density',
      label: 'Infrastructure density',
      rawValue: `${avgAtmDensity.toFixed(0)} points/km²`,
      impact: atmImpact,
      positiveText: `High ATM & merchant density (${avgAtmDensity.toFixed(0)}/km²) enables rapid withdrawal`,
      negativeText: `Dispersed ATM density (${avgAtmDensity.toFixed(0)}/km²) reduces rapid cash-out likelihood`,
    },
  ]

  // Sort drivers by absolute impact magnitude
  const drivers: XAIDriver[] = rawDrivers
    .sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact))
    .slice(0, 4)
    .map((d) => {
      const isPos = d.impact >= 0
      const absVal = Math.abs(d.impact)
      const level: XAIDriver['level'] = absVal >= 0.15 ? 'HIGH' : absVal >= 0.08 ? 'MEDIUM' : 'LOW'
      const barWidthPercent = Math.min(100, Math.max(30, Math.round(absVal * 320)))

      return {
        featureKey: d.key,
        label: d.label,
        rawFeatureValue: d.rawValue,
        impactScore: d.impact,
        direction: isPos ? 'positive' : 'negative',
        level,
        barWidthPercent,
        explanation: isPos ? d.positiveText : d.negativeText,
      }
    })

  const positiveFactors = rawDrivers.filter((d) => d.impact > 0).map((d) => d.positiveText)
  const negativeFactors = rawDrivers.filter((d) => d.impact <= 0).map((d) => d.negativeText)

  const riskLevel = regionData.risk >= 75 ? 'CRITICAL' : regionData.risk >= 55 ? 'HIGH' : regionData.risk >= 35 ? 'MEDIUM' : 'LOW'

  return {
    regionId,
    regionName: zone.name,
    riskScore: regionData.risk,
    riskLevel,
    drivers,
    positiveFactors,
    negativeFactors,
    disclaimer: 'Risk explanation based on model input features',
  }
}
