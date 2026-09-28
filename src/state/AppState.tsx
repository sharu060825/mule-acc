import { createContext, useCallback, useContext, useMemo, useReducer, type ReactNode } from 'react'
import {
  COMPLAINTS,
  INITIAL_ALERTS,
  generatePrediction,
  zoneById,
} from '../data/mockData'
import type { Alert, Complaint, GeoPoint, Prediction } from '../types'

interface MapFocus {
  location: GeoPoint
  label: string
}

interface State {
  complaints: Complaint[]
  predictions: Record<string, Prediction>
  alerts: Alert[]
  selectedComplaintId: string
  mapFocus: MapFocus | null
  toast: string | null
}

type Action =
  | { type: 'SELECT_COMPLAINT'; id: string }
  | { type: 'SET_PREDICTION'; complaintId: string; prediction: Prediction }
  | { type: 'DISPATCH_INTELLIGENCE'; complaintId: string }
  | { type: 'ACKNOWLEDGE_ALERT'; alertId: string }
  | { type: 'FOCUS_MAP'; focus: MapFocus }
  | { type: 'CLEAR_MAP_FOCUS' }
  | { type: 'SHOW_TOAST'; message: string }
  | { type: 'CLEAR_TOAST' }

function pad(n: number): string {
  return n.toString().padStart(3, '0')
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SELECT_COMPLAINT':
      return { ...state, selectedComplaintId: action.id }

    case 'SET_PREDICTION': {
      const zone = zoneById(action.prediction.zone)
      const complaints = state.complaints.map((c) =>
        c.id === action.complaintId
          ? {
              ...c,
              status: c.status === 'NEW' || c.status === 'ANALYZING' ? 'PREDICTED' : c.status,
              predictedZone: zone.id,
              estimatedWithdrawal: `${action.prediction.windowStart} – ${action.prediction.windowEnd}`,
            }
          : c,
      )
      return {
        ...state,
        complaints,
        predictions: { ...state.predictions, [action.complaintId]: action.prediction },
      }
    }

    case 'DISPATCH_INTELLIGENCE': {
      const complaint = state.complaints.find((c) => c.id === action.complaintId)
      if (!complaint) return state
      const prediction = state.predictions[action.complaintId]
      const zone = zoneById(prediction?.zone ?? complaint.predictedZone ?? complaint.victimZone)
      const priority = complaint.risk === 'CRITICAL' ? 'CRITICAL' : complaint.risk === 'HIGH' ? 'HIGH' : 'STANDARD'
      const now = new Date().toISOString()

      const existing = state.alerts.filter((a) => a.complaintId === action.complaintId)
      let alerts: Alert[]
      if (existing.length > 0) {
        alerts = state.alerts.map((a) =>
          a.complaintId === action.complaintId && a.status === 'PREPARED'
            ? { ...a, status: 'DISPATCHED', dispatchedAt: now }
            : a,
        )
      } else {
        const recipients: Array<Alert['recipient']> = ['BANK', 'LAW ENFORCEMENT', 'LOCAL RESPONSE UNIT']
        const nextIndex = state.alerts.length + 1
        alerts = [
          ...state.alerts,
          ...recipients.map((recipient, j) => ({
            id: `ALERT-${pad(nextIndex + j)}`,
            complaintId: action.complaintId,
            priority: priority as Alert['priority'],
            prediction: `${zone.name} (${zone.id})`,
            estimatedTime: complaint.estimatedWithdrawal ?? 'Pending',
            recipient,
            status: 'DISPATCHED' as const,
            createdAt: now,
            dispatchedAt: now,
            acknowledgedAt: null,
            intelligence:
              recipient === 'BANK'
                ? 'Account freeze / transaction monitoring intelligence'
                : recipient === 'LAW ENFORCEMENT'
                  ? 'Predicted cash-out intelligence'
                  : 'Predicted ATM/area response intelligence',
          })),
        ]
      }

      const complaints = state.complaints.map((c) => (c.id === action.complaintId ? { ...c, status: 'DISPATCHED' as const } : c))

      return { ...state, alerts, complaints, toast: `Intelligence dispatched for ${action.complaintId}` }
    }

    case 'ACKNOWLEDGE_ALERT':
      return {
        ...state,
        alerts: state.alerts.map((a) => (a.id === action.alertId ? { ...a, status: 'ACKNOWLEDGED', acknowledgedAt: new Date().toISOString() } : a)),
      }

    case 'FOCUS_MAP':
      return { ...state, mapFocus: action.focus }

    case 'CLEAR_MAP_FOCUS':
      return { ...state, mapFocus: null }

    case 'SHOW_TOAST':
      return { ...state, toast: action.message }

    case 'CLEAR_TOAST':
      return { ...state, toast: null }

    default:
      return state
  }
}

const initialState: State = {
  complaints: COMPLAINTS,
  predictions: {},
  alerts: INITIAL_ALERTS,
  selectedComplaintId: COMPLAINTS[0].id,
  mapFocus: null,
  toast: null,
}

interface AppContextValue extends State {
  selectComplaint: (id: string) => void
  runPrediction: (complaintId: string) => Prediction
  dispatchIntelligence: (complaintId: string) => void
  acknowledgeAlert: (alertId: string) => void
  focusMap: (focus: MapFocus) => void
  clearMapFocus: () => void
  showToast: (message: string) => void
  clearToast: () => void
  selectedComplaint: Complaint | undefined
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState)

  const selectComplaint = useCallback((id: string) => dispatch({ type: 'SELECT_COMPLAINT', id }), [])

  const runPrediction = useCallback(
    (complaintId: string) => {
      const complaint = state.complaints.find((c) => c.id === complaintId) ?? COMPLAINTS.find((c) => c.id === complaintId)!
      const prediction = generatePrediction(complaint)
      dispatch({ type: 'SET_PREDICTION', complaintId, prediction })
      return prediction
    },
    [state.complaints],
  )

  const dispatchIntelligence = useCallback((complaintId: string) => dispatch({ type: 'DISPATCH_INTELLIGENCE', complaintId }), [])
  const acknowledgeAlert = useCallback((alertId: string) => dispatch({ type: 'ACKNOWLEDGE_ALERT', alertId }), [])
  const focusMap = useCallback((focus: MapFocus) => dispatch({ type: 'FOCUS_MAP', focus }), [])
  const clearMapFocus = useCallback(() => dispatch({ type: 'CLEAR_MAP_FOCUS' }), [])
  const showToast = useCallback((message: string) => dispatch({ type: 'SHOW_TOAST', message }), [])
  const clearToast = useCallback(() => dispatch({ type: 'CLEAR_TOAST' }), [])

  const selectedComplaint = useMemo(
    () => state.complaints.find((c) => c.id === state.selectedComplaintId),
    [state.complaints, state.selectedComplaintId],
  )

  const value: AppContextValue = {
    ...state,
    selectComplaint,
    runPrediction,
    dispatchIntelligence,
    acknowledgeAlert,
    focusMap,
    clearMapFocus,
    showToast,
    clearToast,
    selectedComplaint,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useAppState(): AppContextValue {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useAppState must be used within AppStateProvider')
  return ctx
}
