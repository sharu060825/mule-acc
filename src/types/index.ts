export type FraudType =
  | 'UPI Fraud'
  | 'Phishing'
  | 'Financial Fraud'
  | 'Investment Fraud'
  | 'Online Shopping Fraud'
  | 'Identity Theft'

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

export type ComplaintStatus =
  | 'NEW'
  | 'ANALYZING'
  | 'PREDICTED'
  | 'DISPATCHED'
  | 'RESOLVED'

export interface GeoPoint {
  lat: number
  lng: number
}

export interface Complaint {
  id: string
  fraudType: FraudType
  amount: number
  risk: RiskLevel
  status: ComplaintStatus
  predictedZone: string | null
  estimatedWithdrawal: string | null
  timestamp: string
  victimCity: string
  victimZone: string
  victimLocation: GeoPoint
  bank: string
  transactionChannel: string
  transactionType: string
  balanceChange: number
  transactionFrequency: number
  transactionVelocity: number
  numberOfDestinations: number
  timeSinceLastTransaction: string
  beneficiaryActivity: string
  previousFraudCount: number
  rapidFundMovement: boolean
  unusualActivity: string
  historicalFraudCount: number
  fraudRate: number
  cityCybercrimeRate: number
  historicalCashOutConcentration: number
  cellCoordinates: GeoPoint
  atmDensity: number
  distanceToHighRiskZone: number
  distanceToNearestAtm: number
  accountRegion: string
}

export interface TransactionNode {
  id: string
  label: 'VICTIM' | 'BENEFICIARY' | 'DESTINATION ACCOUNT' | 'POTENTIAL CASH-OUT'
  account: string
  amount: number
  timestamp: string
  channel: string
  transactionType: string
  velocity: string
  destination: string
}

export type CashOutType = 'ATM' | 'BANK' | 'MERCHANT'

export interface CashOutCandidate {
  id: string
  type: CashOutType
  name: string
  zone: string
  location: GeoPoint
  distanceKm: number
  historicalActivity: 'LOW' | 'MEDIUM' | 'HIGH'
  risk: RiskLevel
  confidence: number
}

export interface PredictionEvidenceFactor {
  factor: string
  strength: 'LOW' | 'MEDIUM' | 'HIGH'
}

export interface Prediction {
  complaintId: string
  zone: string
  confidence: number
  risk: RiskLevel
  windowStart: string
  windowEnd: string
  candidates: CashOutCandidate[]
  evidence: PredictionEvidenceFactor[]
  generatedAt: string
}

export type RecipientType = 'BANK' | 'LAW ENFORCEMENT' | 'LOCAL RESPONSE UNIT'
export type AlertStatus = 'PREPARED' | 'DISPATCHED' | 'ACKNOWLEDGED'
export type AlertPriority = 'STANDARD' | 'HIGH' | 'CRITICAL'

export interface Alert {
  id: string
  complaintId: string
  priority: AlertPriority
  prediction: string
  estimatedTime: string
  recipient: RecipientType
  status: AlertStatus
  createdAt: string
  dispatchedAt: string | null
  acknowledgedAt: string | null
  intelligence: string
}

export type ResponseStageStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETE'

export interface ResponseStage {
  key: string
  label: string
  status: ResponseStageStatus
  timestamp: string | null
  detail: string
}

export interface HighRiskZone {
  zone: string
  city: string
  risk: RiskLevel
  complaintCount: number
  historicalActivity: number
  predictedActivity: number
  center: GeoPoint
}

export interface AtmLocation {
  id: string
  name: string
  zone: string
  city: string
  location: GeoPoint
  density: 'LOW' | 'MEDIUM' | 'HIGH'
}

export interface BankBranch {
  id: string
  name: string
  bank: string
  zone: string
  city: string
  location: GeoPoint
}

export interface MerchantPoint {
  id: string
  name: string
  category: string
  zone: string
  city: string
  location: GeoPoint
}
