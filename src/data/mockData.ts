import type {
  Alert,
  AtmLocation,
  BankBranch,
  CashOutCandidate,
  Complaint,
  FraudType,
  GeoPoint,
  HighRiskZone,
  MerchantPoint,
  Prediction,
  PredictionEvidenceFactor,
  ResponseStage,
  RiskLevel,
  TransactionNode,
} from '../types'

// ---------------------------------------------------------------------------
// Chennai zone geography — every incident, ATM, branch and merchant in this
// prototype is placed within these twelve operational zones.
// ---------------------------------------------------------------------------

export interface ZoneDef {
  id: string
  name: string
  city: string
  center: GeoPoint
}

export const ZONES: ZoneDef[] = [
  { id: 'ZONE-01', name: 'T Nagar', city: 'Chennai', center: { lat: 13.0418, lng: 80.2341 } },
  { id: 'ZONE-02', name: 'Adyar', city: 'Chennai', center: { lat: 13.0012, lng: 80.2565 } },
  { id: 'ZONE-03', name: 'Velachery', city: 'Chennai', center: { lat: 12.9756, lng: 80.2207 } },
  { id: 'ZONE-04', name: 'Anna Nagar', city: 'Chennai', center: { lat: 13.0850, lng: 80.2101 } },
  { id: 'ZONE-05', name: 'Tambaram', city: 'Chennai', center: { lat: 12.9249, lng: 80.1000 } },
  { id: 'ZONE-06', name: 'Porur', city: 'Chennai', center: { lat: 13.0381, lng: 80.1565 } },
  { id: 'ZONE-07', name: 'Sholinganallur (OMR)', city: 'Chennai', center: { lat: 12.9010, lng: 80.2279 } },
  { id: 'ZONE-08', name: 'Guindy', city: 'Chennai', center: { lat: 13.0067, lng: 80.2206 } },
  { id: 'ZONE-09', name: 'Mylapore', city: 'Chennai', center: { lat: 13.0339, lng: 80.2619 } },
  { id: 'ZONE-10', name: 'Egmore', city: 'Chennai', center: { lat: 13.0732, lng: 80.2609 } },
  { id: 'ZONE-11', name: 'Perambur', city: 'Chennai', center: { lat: 13.1143, lng: 80.2329 } },
  { id: 'ZONE-12', name: 'Ambattur', city: 'Chennai', center: { lat: 13.1143, lng: 80.1548 } },
]

export function zoneById(id: string): ZoneDef {
  return ZONES.find((z) => z.id === id) ?? ZONES[0]
}

// Small deterministic jitter so markers don't stack exactly on a zone center.
function jitter(point: GeoPoint, seed: number): GeoPoint {
  const dx = (Math.sin(seed * 12.9898) * 43758.5453) % 1
  const dy = (Math.sin(seed * 78.233) * 12345.6789) % 1
  return {
    lat: point.lat + dx * 0.012,
    lng: point.lng + dy * 0.012,
  }
}

// ---------------------------------------------------------------------------
// Complaints
// ---------------------------------------------------------------------------

const FRAUD_TYPES: FraudType[] = [
  'UPI Fraud',
  'Phishing',
  'Financial Fraud',
  'Investment Fraud',
  'Online Shopping Fraud',
  'Identity Theft',
]

const BANKS = ['State Bank of India', 'HDFC Bank', 'ICICI Bank', 'Axis Bank', 'Indian Bank', 'Canara Bank', 'IDFC First Bank']
const CHANNELS = ['UPI', 'IMPS', 'NEFT', 'Card Present', 'Net Banking']
const TXN_TYPES = ['Peer Transfer', 'Merchant Payment', 'Cash Withdrawal', 'Bill Payment', 'Wallet Load']

interface ComplaintSeed {
  fraudType: FraudType
  amount: number
  risk: RiskLevel
  status: Complaint['status']
  zoneIndex: number
  hoursAgo: number
  velocity: number
  destinations: number
  prevFraud: number
  rapid: boolean
}

const SEEDS: ComplaintSeed[] = [
  { fraudType: 'UPI Fraud', amount: 184000, risk: 'CRITICAL', status: 'DISPATCHED', zoneIndex: 0, hoursAgo: 1, velocity: 9.2, destinations: 5, prevFraud: 2, rapid: true },
  { fraudType: 'Phishing', amount: 62500, risk: 'HIGH', status: 'PREDICTED', zoneIndex: 1, hoursAgo: 2, velocity: 6.1, destinations: 3, prevFraud: 0, rapid: true },
  { fraudType: 'Investment Fraud', amount: 940000, risk: 'CRITICAL', status: 'DISPATCHED', zoneIndex: 3, hoursAgo: 3, velocity: 7.8, destinations: 6, prevFraud: 1, rapid: true },
  { fraudType: 'Financial Fraud', amount: 128000, risk: 'HIGH', status: 'ANALYZING', zoneIndex: 4, hoursAgo: 1, velocity: 5.4, destinations: 2, prevFraud: 0, rapid: false },
  { fraudType: 'Online Shopping Fraud', amount: 18400, risk: 'LOW', status: 'RESOLVED', zoneIndex: 2, hoursAgo: 30, velocity: 1.2, destinations: 1, prevFraud: 0, rapid: false },
  { fraudType: 'Identity Theft', amount: 356000, risk: 'HIGH', status: 'PREDICTED', zoneIndex: 6, hoursAgo: 5, velocity: 4.9, destinations: 4, prevFraud: 1, rapid: false },
  { fraudType: 'UPI Fraud', amount: 47500, risk: 'MEDIUM', status: 'NEW', zoneIndex: 5, hoursAgo: 0.5, velocity: 3.3, destinations: 2, prevFraud: 0, rapid: false },
  { fraudType: 'Phishing', amount: 215000, risk: 'CRITICAL', status: 'DISPATCHED', zoneIndex: 8, hoursAgo: 2, velocity: 8.7, destinations: 5, prevFraud: 3, rapid: true },
  { fraudType: 'Financial Fraud', amount: 73000, risk: 'MEDIUM', status: 'ANALYZING', zoneIndex: 9, hoursAgo: 4, velocity: 4.1, destinations: 2, prevFraud: 0, rapid: false },
  { fraudType: 'Investment Fraud', amount: 612000, risk: 'HIGH', status: 'PREDICTED', zoneIndex: 10, hoursAgo: 6, velocity: 5.9, destinations: 4, prevFraud: 1, rapid: true },
  { fraudType: 'Online Shopping Fraud', amount: 9800, risk: 'LOW', status: 'RESOLVED', zoneIndex: 7, hoursAgo: 48, velocity: 1.0, destinations: 1, prevFraud: 0, rapid: false },
  { fraudType: 'UPI Fraud', amount: 291000, risk: 'CRITICAL', status: 'NEW', zoneIndex: 11, hoursAgo: 0.25, velocity: 9.8, destinations: 6, prevFraud: 2, rapid: true },
  { fraudType: 'Identity Theft', amount: 134000, risk: 'MEDIUM', status: 'ANALYZING', zoneIndex: 2, hoursAgo: 7, velocity: 3.6, destinations: 2, prevFraud: 0, rapid: false },
  { fraudType: 'Financial Fraud', amount: 402000, risk: 'HIGH', status: 'PREDICTED', zoneIndex: 4, hoursAgo: 3, velocity: 5.2, destinations: 3, prevFraud: 1, rapid: true },
]

function isoHoursAgo(hours: number): string {
  return new Date(Date.now() - hours * 3600 * 1000).toISOString()
}

function pad(n: number, len = 3): string {
  return n.toString().padStart(len, '0')
}

function withdrawalWindow(hoursAgo: number): string {
  const base = Date.now() - hoursAgo * 3600 * 1000 + 45 * 60 * 1000
  const start = new Date(base)
  const end = new Date(base + 15 * 60 * 1000)
  const fmt = (d: Date) => d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false })
  return `${fmt(start)} – ${fmt(end)}`
}

export const COMPLAINTS: Complaint[] = SEEDS.map((seed, i) => {
  const zone = ZONES[seed.zoneIndex]
  const id = `CYB-${pad(2401 + i, 4)}`
  const bank = BANKS[i % BANKS.length]
  const channel = CHANNELS[i % CHANNELS.length]
  const txnType = TXN_TYPES[i % TXN_TYPES.length]
  const victimLocation = jitter(zone.center, i + 1)
  const cellCoordinates = jitter(zone.center, i + 17)
  const predicted = seed.status === 'PREDICTED' || seed.status === 'DISPATCHED'
  const timestamp = isoHoursAgo(seed.hoursAgo)

  return {
    id,
    fraudType: seed.fraudType,
    amount: seed.amount,
    risk: seed.risk,
    status: seed.status,
    predictedZone: predicted ? zone.id : null,
    estimatedWithdrawal: predicted ? withdrawalWindow(seed.hoursAgo) : null,
    timestamp,
    victimCity: zone.city,
    victimZone: zone.id,
    victimLocation,
    bank,
    transactionChannel: channel,
    transactionType: txnType,
    balanceChange: -seed.amount,
    transactionFrequency: Math.round(seed.velocity * 1.4),
    transactionVelocity: seed.velocity,
    numberOfDestinations: seed.destinations,
    timeSinceLastTransaction: `${Math.max(2, Math.round(seed.velocity * 3))} min`,
    beneficiaryActivity: seed.rapid ? 'Multiple rapid disbursals' : 'Single disbursal',
    previousFraudCount: seed.prevFraud,
    rapidFundMovement: seed.rapid,
    unusualActivity: seed.rapid ? 'Layered transfers across new beneficiaries' : 'Isolated deviation from spend pattern',
    historicalFraudCount: 40 + seed.zoneIndex * 6,
    fraudRate: Number((0.04 + seed.zoneIndex * 0.008).toFixed(3)),
    cityCybercrimeRate: Number((0.11 + (seed.zoneIndex % 5) * 0.015).toFixed(3)),
    historicalCashOutConcentration: Number((0.3 + (seed.zoneIndex % 6) * 0.09).toFixed(2)),
    cellCoordinates,
    atmDensity: 6 + (seed.zoneIndex % 5) * 3,
    distanceToHighRiskZone: Number((0.4 + (i % 7) * 0.3).toFixed(1)),
    distanceToNearestAtm: Number((0.2 + (i % 5) * 0.25).toFixed(2)),
    accountRegion: `${zone.city} Metro — ${zone.name}`,
  }
})

export function complaintById(id: string): Complaint | undefined {
  return COMPLAINTS.find((c) => c.id === id)
}

// ---------------------------------------------------------------------------
// High-risk zones (derived, with independent historical/predicted counts)
// ---------------------------------------------------------------------------

export const HIGH_RISK_ZONES: HighRiskZone[] = ZONES.map((zone, i) => {
  const complaintCount = COMPLAINTS.filter((c) => c.victimZone === zone.id).length
  const riskCycle: RiskLevel[] = ['CRITICAL', 'HIGH', 'HIGH', 'MEDIUM', 'MEDIUM', 'LOW']
  return {
    zone: zone.id,
    city: zone.city,
    risk: riskCycle[i % riskCycle.length],
    complaintCount,
    historicalActivity: 20 + ((i * 7) % 60),
    predictedActivity: 15 + ((i * 11) % 55),
    center: zone.center,
  }
})

// ---------------------------------------------------------------------------
// ATMs, bank branches, merchant cash-out points
// ---------------------------------------------------------------------------

const ATM_DENSITY_CYCLE: AtmLocation['density'][] = ['HIGH', 'MEDIUM', 'LOW']

export const ATM_LOCATIONS: AtmLocation[] = Array.from({ length: 24 }).map((_, i) => {
  const zone = ZONES[i % ZONES.length]
  return {
    id: `ATM-${pad(i + 1)}`,
    name: `${BANKS[i % BANKS.length]} ATM — ${zone.name} ${String.fromCharCode(65 + (i % 3))}`,
    zone: zone.id,
    city: zone.city,
    location: jitter(zone.center, i + 31),
    density: ATM_DENSITY_CYCLE[i % ATM_DENSITY_CYCLE.length],
  }
})

export const BANK_BRANCHES: BankBranch[] = Array.from({ length: 9 }).map((_, i) => {
  const zone = ZONES[(i * 2) % ZONES.length]
  const bank = BANKS[i % BANKS.length]
  return {
    id: `BANK-${pad(i + 1)}`,
    name: `${bank} — ${zone.name} Branch`,
    bank,
    zone: zone.id,
    city: zone.city,
    location: jitter(zone.center, i + 53),
  }
})

const MERCHANT_CATEGORIES = ['Mobile Recharge & Cash', 'Kirana / General Store', 'Electronics Retail', 'Jewellery Exchange', 'Travel & Forex']

export const MERCHANT_POINTS: MerchantPoint[] = Array.from({ length: 12 }).map((_, i) => {
  const zone = ZONES[(i * 3 + 1) % ZONES.length]
  return {
    id: `MERCHANT-${pad(i + 1)}`,
    name: `${MERCHANT_CATEGORIES[i % MERCHANT_CATEGORIES.length]} — ${zone.name}`,
    category: MERCHANT_CATEGORIES[i % MERCHANT_CATEGORIES.length],
    zone: zone.id,
    city: zone.city,
    location: jitter(zone.center, i + 71),
  }
})

// ---------------------------------------------------------------------------
// Transaction trail
// ---------------------------------------------------------------------------

export function buildTransactionTrail(complaint: Complaint): TransactionNode[] {
  const t0 = new Date(complaint.timestamp)
  const step = (mins: number) => new Date(t0.getTime() + mins * 60000).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false })

  return [
    {
      id: `${complaint.id}-N1`,
      label: 'VICTIM',
      account: `${complaint.bank} •• ${1000 + complaint.numberOfDestinations}`,
      amount: complaint.amount,
      timestamp: step(0),
      channel: complaint.transactionChannel,
      transactionType: complaint.transactionType,
      velocity: `${complaint.transactionVelocity.toFixed(1)} tx/hr`,
      destination: 'Beneficiary Account A',
    },
    {
      id: `${complaint.id}-N2`,
      label: 'BENEFICIARY',
      account: 'Mule Account A',
      amount: Math.round(complaint.amount * 0.85),
      timestamp: step(6),
      channel: 'IMPS',
      transactionType: 'Layering Transfer',
      velocity: `${(complaint.transactionVelocity * 1.3).toFixed(1)} tx/hr`,
      destination: 'Destination Account B',
    },
    {
      id: `${complaint.id}-N3`,
      label: 'DESTINATION ACCOUNT',
      account: 'Destination Account B',
      amount: Math.round(complaint.amount * 0.6),
      timestamp: step(14),
      channel: 'IMPS',
      transactionType: 'Split Transfer',
      velocity: `${(complaint.transactionVelocity * 1.6).toFixed(1)} tx/hr`,
      destination: `Cash-out point, ${zoneById(complaint.predictedZone ?? complaint.victimZone).name}`,
    },
    {
      id: `${complaint.id}-N4`,
      label: 'POTENTIAL CASH-OUT',
      account: 'Unidentified — predicted',
      amount: Math.round(complaint.amount * 0.55),
      timestamp: complaint.estimatedWithdrawal ?? 'Pending prediction',
      channel: 'ATM / POS',
      transactionType: 'Cash Withdrawal (predicted)',
      velocity: '—',
      destination: zoneById(complaint.predictedZone ?? complaint.victimZone).name,
    },
  ]
}

// ---------------------------------------------------------------------------
// Prediction engine (mock, deterministic per complaint)
// ---------------------------------------------------------------------------

function pickCandidates(zoneId: string, complaint: Complaint): CashOutCandidate[] {
  const zone = zoneById(zoneId)
  const atms = ATM_LOCATIONS.filter((a) => a.zone === zoneId).slice(0, 2)
  const bank = BANK_BRANCHES.find((b) => b.zone === zoneId) ?? BANK_BRANCHES[0]
  const merchant = MERCHANT_POINTS.find((m) => m.zone === zoneId) ?? MERCHANT_POINTS[0]

  const candidates: CashOutCandidate[] = []
  atms.forEach((atm, i) => {
    candidates.push({
      id: atm.id,
      type: 'ATM',
      name: atm.name,
      zone: zone.id,
      location: atm.location,
      distanceKm: Number((0.6 + i * 0.6 + (complaint.distanceToNearestAtm % 1)).toFixed(1)),
      historicalActivity: atm.density,
      risk: i === 0 ? 'HIGH' : 'MEDIUM',
      confidence: Math.max(60, 92 - i * 6),
    })
  })
  candidates.push({
    id: bank.id,
    type: 'BANK',
    name: bank.name,
    zone: zone.id,
    location: bank.location,
    distanceKm: 1.8,
    historicalActivity: 'MEDIUM',
    risk: 'MEDIUM',
    confidence: 81,
  })
  candidates.push({
    id: merchant.id,
    type: 'MERCHANT',
    name: merchant.name,
    zone: zone.id,
    location: merchant.location,
    distanceKm: 2.3,
    historicalActivity: 'LOW',
    risk: 'LOW',
    confidence: 73,
  })
  return candidates
}

function evidenceFor(complaint: Complaint): PredictionEvidenceFactor[] {
  const strength = (value: number, high: number, med: number): 'LOW' | 'MEDIUM' | 'HIGH' =>
    value >= high ? 'HIGH' : value >= med ? 'MEDIUM' : 'LOW'

  return [
    { factor: 'Transaction Velocity', strength: strength(complaint.transactionVelocity, 6, 3) },
    { factor: 'Historical Zone Match', strength: strength(complaint.historicalCashOutConcentration, 0.55, 0.35) },
    { factor: 'Time-Lag Pattern', strength: complaint.rapidFundMovement ? 'HIGH' : 'MEDIUM' },
    { factor: 'Geographic Proximity', strength: strength(6 - complaint.distanceToNearestAtm, 5, 3.5) },
    { factor: 'ATM Density', strength: strength(complaint.atmDensity, 15, 8) },
    { factor: 'Previous Fraud Pattern', strength: complaint.previousFraudCount > 1 ? 'HIGH' : complaint.previousFraudCount === 1 ? 'MEDIUM' : 'LOW' },
  ]
}

export function generatePrediction(complaint: Complaint): Prediction {
  const zoneId = complaint.predictedZone ?? complaint.victimZone
  const confidence = Math.min(
    97,
    Math.round(
      55 +
        complaint.transactionVelocity * 2.6 +
        complaint.historicalCashOutConcentration * 20 +
        (complaint.rapidFundMovement ? 6 : 0) +
        complaint.previousFraudCount * 3,
    ),
  )
  const window = complaint.estimatedWithdrawal ?? withdrawalWindow(0)

  return {
    complaintId: complaint.id,
    zone: zoneId,
    confidence,
    risk: complaint.risk,
    windowStart: window.split('–')[0]?.trim() ?? window,
    windowEnd: window.split('–')[1]?.trim() ?? window,
    candidates: pickCandidates(zoneId, complaint),
    evidence: evidenceFor(complaint),
    generatedAt: new Date().toISOString(),
  }
}

// ---------------------------------------------------------------------------
// Alerts & dispatch
// ---------------------------------------------------------------------------

export const INITIAL_ALERTS: Alert[] = COMPLAINTS.filter((c) => c.status === 'DISPATCHED' || c.status === 'PREDICTED').flatMap((c, i) => {
  const zone = zoneById(c.predictedZone ?? c.victimZone)
  const priority = c.risk === 'CRITICAL' ? 'CRITICAL' : c.risk === 'HIGH' ? 'HIGH' : 'STANDARD'
  const recipients: Array<Alert['recipient']> = ['BANK', 'LAW ENFORCEMENT', 'LOCAL RESPONSE UNIT']
  const dispatched = c.status === 'DISPATCHED'

  return recipients.map((recipient, j) => ({
    id: `ALERT-${pad(i * 3 + j + 1)}`,
    complaintId: c.id,
    priority: priority as Alert['priority'],
    prediction: `${zone.name} (${zone.id})`,
    estimatedTime: c.estimatedWithdrawal ?? 'Pending',
    recipient,
    status: (dispatched ? 'DISPATCHED' : 'PREPARED') as Alert['status'],
    createdAt: c.timestamp,
    dispatchedAt: dispatched ? isoHoursAgo(0.2 + j * 0.05) : null,
    acknowledgedAt: dispatched && j === 0 ? isoHoursAgo(0.05) : null,
    intelligence:
      recipient === 'BANK'
        ? 'Account freeze / transaction monitoring intelligence'
        : recipient === 'LAW ENFORCEMENT'
          ? 'Predicted cash-out intelligence'
          : 'Predicted ATM/area response intelligence',
  }))
})

export function buildResponseTimeline(complaint: Complaint): ResponseStage[] {
  const order: Array<{ key: string; label: string; detail: string }> = [
    { key: 'received', label: 'Complaint Received', detail: 'Cybercrime complaint logged into the intake system.' },
    { key: 'transaction', label: 'Transaction Intelligence Processed', detail: 'Transaction frequency, velocity and destinations extracted.' },
    { key: 'historical', label: 'Historical Pattern Identified', detail: 'Cross-referenced against zone fraud history and cash-out concentration.' },
    { key: 'geospatial', label: 'Geospatial Risk Calculated', detail: 'ATM density and proximity to known high-risk zones scored.' },
    { key: 'prediction', label: 'Prediction Generated', detail: 'Cash-out zone, confidence and withdrawal window computed.' },
    { key: 'intelligence', label: 'Actionable Intelligence Prepared', detail: 'Candidate ATM, bank and merchant cash-out points ranked.' },
    { key: 'dispatched', label: 'Dispatched', detail: 'Intelligence sent to bank, law enforcement and local response unit.' },
    { key: 'acknowledged', label: 'Response Acknowledged', detail: 'Recipient confirmed receipt and initiated field response.' },
  ]

  const statusForStage: Record<Complaint['status'], number> = {
    NEW: 1,
    ANALYZING: 3,
    PREDICTED: 6,
    DISPATCHED: 7,
    RESOLVED: 8,
  }
  const reached = statusForStage[complaint.status]

  return order.map((stage, i) => ({
    key: stage.key,
    label: stage.label,
    detail: stage.detail,
    status: i < reached ? 'COMPLETE' : i === reached ? 'IN_PROGRESS' : 'PENDING',
    timestamp: i < reached ? isoHoursAgo(Math.max(0, 6 - i) * 0.3) : null,
  }))
}

// ---------------------------------------------------------------------------
// 88-feature conceptual model, grouped for the Input Intelligence view
// ---------------------------------------------------------------------------

export const FEATURE_GROUPS: Array<{ group: string; features: string[] }> = [
  { group: 'Financial', features: ['stolen_amount', 'balance_change', 'log_stolen_amount', 'log_balance_change'] },
  {
    group: 'Transaction Behavior',
    features: [
      'transaction_frequency',
      'transaction_velocity',
      'number_of_destinations',
      'time_since_last_transaction',
      'log_transaction_velocity',
      'log_time_since_last_tx',
      'previous_fraud_count',
    ],
  },
  {
    group: 'Temporal',
    features: [
      'complaint_hour',
      'complaint_day',
      'complaint_weekday',
      'complaint_month',
      'complaint_is_weekend',
      'sin_hour',
      'cos_hour',
      'sin_weekday',
      'cos_weekday',
    ],
  },
  { group: 'Historical Cybercrime', features: ['city_cybercrime_rate', 'fraud_rate', 'historical_fraud_count'] },
  {
    group: 'Geographic',
    features: [
      'victim_latitude',
      'victim_longitude',
      'cell_lat',
      'cell_lon',
      'atm_density',
      'distance_to_high_risk_zone',
      'distance_to_nearest_atm_km',
      'victim_zone',
    ],
  },
  { group: 'Context', features: ['bank', 'transaction_channel', 'fraud_type', 'transaction_type', 'account_region'] },
]

export const ALL_FRAUD_TYPES = FRAUD_TYPES
