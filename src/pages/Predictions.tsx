import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Play, Pause, RotateCcw, MapPin, CheckCircle2 } from 'lucide-react'
import { useAppState } from '../state/AppState'
import { zoneById } from '../data/mockData'
import { Panel, PanelHeader, Button, RiskBadge, EmptyState } from '../components/ui/Primitives'
import ComplaintPicker from '../components/ui/ComplaintPicker'
import type { CashOutCandidate } from '../types'

const ANALYSIS_STAGES = ['Transaction Analysis', 'Behavioral Analysis', 'Historical Pattern Analysis', 'Geospatial Analysis', 'Temporal Analysis']

const STRENGTH_WIDTH: Record<'LOW' | 'MEDIUM' | 'HIGH', string> = { LOW: 'w-1/3', MEDIUM: 'w-2/3', HIGH: 'w-full' }
const STRENGTH_COLOR: Record<'LOW' | 'MEDIUM' | 'HIGH', string> = { LOW: 'bg-paper-faint', MEDIUM: 'bg-warn-400', HIGH: 'bg-critical-400' }

function CandidateCard({ candidate, onView }: { candidate: CashOutCandidate; onView: () => void }) {
  return (
    <div className="border border-line-soft rounded-md px-4 py-3 bg-panel-raised flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[0.65rem] mono px-1.5 py-0.5 rounded bg-ink border border-line-soft text-paper-faint">{candidate.type}</span>
          <span className="text-sm text-paper truncate">{candidate.name}</span>
        </div>
        <div className="text-xs text-paper-faint mt-1 mono">
          {candidate.id} · {candidate.distanceKm} km · {candidate.historicalActivity} historical activity
        </div>
      </div>
      <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
        <div className="text-left sm:text-right">
          <div className="text-sm mono text-paper">{candidate.confidence}%</div>
          <RiskBadge risk={candidate.risk} />
        </div>
        <button onClick={onView} className="flex items-center gap-1 text-xs text-intel-400 hover:text-intel-300 mono whitespace-nowrap py-1.5">
          <MapPin size={13} /> View on Map
        </button>
      </div>
    </div>
  )
}

export default function Predictions() {
  const { selectedComplaint, predictions, runPrediction, focusMap, showToast } = useAppState()
  const navigate = useNavigate()

  const [analyzing, setAnalyzing] = useState(false)
  const [stageIndex, setStageIndex] = useState(-1)

  const [liveRunning, setLiveRunning] = useState(false)
  const [livePaused, setLivePaused] = useState(false)
  const [liveStep, setLiveStep] = useState(0)
  const liveTimer = useRef<number | null>(null)

  const LIVE_STEPS = [
    'Complaint received',
    'Input intelligence loaded',
    'Transaction analysis',
    'Behavioral analysis',
    'Historical analysis',
    'Geospatial analysis',
    'Prediction generated',
    'Cash-out location identified',
    'Actionable intelligence prepared',
    'Intelligence dispatched',
    'Response acknowledged',
  ]

  useEffect(() => {
    return () => {
      if (liveTimer.current) window.clearInterval(liveTimer.current)
    }
  }, [])

  if (!selectedComplaint) {
    return <EmptyState title="No complaint selected" detail="Choose a complaint to run predictive analysis." />
  }

  const c = selectedComplaint
  const prediction = predictions[c.id]

  function handleRunPrediction() {
    setAnalyzing(true)
    setStageIndex(0)
    let i = 0
    const timer = window.setInterval(() => {
      i += 1
      if (i >= ANALYSIS_STAGES.length) {
        window.clearInterval(timer)
        runPrediction(c.id)
        setAnalyzing(false)
        setStageIndex(-1)
        showToast(`Prediction generated for ${c.id}`)
      } else {
        setStageIndex(i)
      }
    }, 550)
  }

  function handleViewOnMap(candidate: CashOutCandidate) {
    focusMap({ location: candidate.location, label: candidate.name })
    navigate('/map')
  }

  function startLive() {
    setLiveRunning(true)
    setLivePaused(false)
    setLiveStep(0)
    if (liveTimer.current) window.clearInterval(liveTimer.current)
    liveTimer.current = window.setInterval(() => {
      setLiveStep((s) => {
        if (s + 1 >= LIVE_STEPS.length) {
          if (liveTimer.current) window.clearInterval(liveTimer.current)
          return s
        }
        return s + 1
      })
    }, 700)
  }

  function pauseLive() {
    setLivePaused((p) => {
      const next = !p
      if (liveTimer.current) window.clearInterval(liveTimer.current)
      if (!next && liveRunning) {
        liveTimer.current = window.setInterval(() => {
          setLiveStep((s) => {
            if (s + 1 >= LIVE_STEPS.length) {
              if (liveTimer.current) window.clearInterval(liveTimer.current)
              return s
            }
            return s + 1
          })
        }, 700)
      }
      return next
    })
  }

  function resetLive() {
    if (liveTimer.current) window.clearInterval(liveTimer.current)
    setLiveRunning(false)
    setLivePaused(false)
    setLiveStep(0)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-medium tracking-tight">Predictive Analysis</h1>
          <p className="text-sm text-paper-faint mt-1">Run the prediction model against {c.id} to forecast the likely cash-out zone.</p>
        </div>
        <ComplaintPicker />
      </div>

      <Panel>
        <PanelHeader
          title="Run Predictive Analysis"
          action={<Button onClick={handleRunPrediction} disabled={analyzing} className="w-full sm:w-auto">{analyzing ? 'Analyzing…' : 'Run Predictive Analysis'}</Button>}
        />
        {analyzing ? (
          <div className="px-5 py-6 space-y-3">
            {ANALYSIS_STAGES.map((stage, i) => (
              <div key={stage} className="flex items-center gap-3">
                {i < stageIndex ? (
                  <CheckCircle2 size={16} className="text-ok-400 shrink-0" />
                ) : i === stageIndex ? (
                  <div className="w-4 h-4 rounded-full border-2 border-intel-400 border-t-transparent animate-spin shrink-0" />
                ) : (
                  <div className="w-4 h-4 rounded-full border border-line shrink-0" />
                )}
                <span className={`text-sm ${i <= stageIndex ? 'text-paper' : 'text-paper-faint'}`}>{stage}</span>
              </div>
            ))}
          </div>
        ) : prediction ? (
          <div className="px-5 py-5 text-xs text-paper-faint">
            Last generated {new Date(prediction.generatedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}. Re-run to refresh the forecast with current intelligence.
          </div>
        ) : (
          <EmptyState title="No prediction generated yet" detail="Run predictive analysis to forecast the likely cash-out zone for this complaint." />
        )}
      </Panel>

      {prediction && !analyzing && (
        <>
          <Panel>
            <PanelHeader title="Prediction Result" />
            <div className="px-4 py-5 sm:px-5 grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <div>
                <div className="text-xs text-paper-faint mb-1">Predicted Cash-Out Zone</div>
                <div className="text-lg font-medium mono text-intel-400">{zoneById(prediction.zone).name}</div>
                <div className="text-xs text-paper-faint mono">{prediction.zone}</div>
              </div>
              <div>
                <div className="text-xs text-paper-faint mb-1">Confidence</div>
                <div className="text-lg font-medium mono text-paper">{prediction.confidence}%</div>
              </div>
              <div>
                <div className="text-xs text-paper-faint mb-1">Risk</div>
                <RiskBadge risk={prediction.risk} />
              </div>
              <div>
                <div className="text-xs text-paper-faint mb-1">Estimated Withdrawal Window</div>
                <div className="text-sm mono text-paper">{prediction.windowStart} – {prediction.windowEnd}</div>
              </div>
            </div>
          </Panel>

          <Panel>
            <PanelHeader title="Potential Cash-Out Locations" subtitle="Ranked ATM, bank branch and merchant candidates" />
            <div className="px-5 py-5 space-y-2.5">
              {prediction.candidates.map((cand) => (
                <CandidateCard key={cand.id} candidate={cand} onView={() => handleViewOnMap(cand)} />
              ))}
            </div>
          </Panel>

          <Panel>
            <PanelHeader title="Prediction Evidence" subtitle="Simulated explanatory factors — not model feature importance" />
            <div className="px-5 py-5 space-y-3">
              {prediction.evidence.map((e) => (
                <div key={e.factor} className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-4">
                  <div className="sm:w-48 text-sm text-paper-dim shrink-0">{e.factor}</div>
                  <div className="flex items-center gap-3">
                    <div className="w-full sm:flex-1 h-1.5 rounded-full bg-line-soft overflow-hidden">
                      <div className={`h-full rounded-full ${STRENGTH_WIDTH[e.strength]} ${STRENGTH_COLOR[e.strength]}`} />
                    </div>
                    <div className="w-16 shrink-0 text-right text-xs mono text-paper-faint">{e.strength}</div>
                  </div>
                </div>
              ))}
              <div className="text-xs text-paper-faint pt-2 border-t border-line-soft mt-4">
                {zoneById(prediction.zone).name} · {prediction.confidence}% confidence
              </div>
            </div>
          </Panel>
        </>
      )}

      <Panel>
        <PanelHeader
          title="Live Intelligence Demonstration"
          subtitle="Frontend-only walkthrough of the full intelligence pipeline"
          action={
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <Button variant="secondary" onClick={startLive} disabled={liveRunning && !livePaused} className="flex-1 sm:flex-none">
                <Play size={14} /> Start
              </Button>
              <Button variant="secondary" onClick={pauseLive} disabled={!liveRunning} className="flex-1 sm:flex-none">
                <Pause size={14} /> {livePaused ? 'Resume' : 'Pause'}
              </Button>
              <Button variant="ghost" onClick={resetLive} className="flex-1 sm:flex-none">
                <RotateCcw size={14} /> Reset
              </Button>
            </div>
          }
        />
        <div className="px-5 py-5">
          <div className="grid grid-cols-6 sm:grid-cols-11 gap-1.5 mb-5">
            {LIVE_STEPS.map((_, i) => (
              <div key={i} className={`h-1.5 rounded-full ${i <= liveStep && liveRunning ? 'bg-intel-500' : 'bg-line-soft'}`} />
            ))}
          </div>
          <div className="space-y-2">
            {LIVE_STEPS.map((step, i) => (
              <div key={step} className="flex items-center gap-3">
                {liveRunning && i < liveStep ? (
                  <CheckCircle2 size={15} className="text-ok-400 shrink-0" />
                ) : liveRunning && i === liveStep ? (
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-intel-400 border-t-transparent animate-spin shrink-0" />
                ) : (
                  <div className="w-3.5 h-3.5 rounded-full border border-line shrink-0" />
                )}
                <span className={`text-sm ${liveRunning && i <= liveStep ? 'text-paper' : 'text-paper-faint'}`}>{step}</span>
              </div>
            ))}
          </div>
        </div>
      </Panel>
    </div>
  )
}
