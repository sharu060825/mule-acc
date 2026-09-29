import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Play, Pause, RotateCcw, MapPin, CheckCircle2 } from 'lucide-react'
import { useAppState } from '../state/AppState'
import { zoneById } from '../data/mockData'
import { Panel, PanelHeader, Button, RiskBadge, EmptyState } from '../components/ui/Primitives'
import ComplaintPicker from '../components/ui/ComplaintPicker'
import XAIExplanation from '../components/ui/XAIExplanation'
import { calculateRegionXAI } from '../data/xai'
import { getRegionData } from './GisMap'
import type { CashOutCandidate } from '../types'

const ANALYSIS_STAGES = ['Transaction Analysis', 'Behavioral Analysis', 'Historical Pattern Analysis', 'Geospatial Analysis', 'Temporal Analysis']

const STRENGTH_WIDTH: Record<'LOW' | 'MEDIUM' | 'HIGH', string> = { LOW: 'w-1/3', MEDIUM: 'w-2/3', HIGH: 'w-full' }
const STRENGTH_COLOR: Record<'LOW' | 'MEDIUM' | 'HIGH', string> = { LOW: 'bg-[#1F4057]', MEDIUM: 'bg-[#102B3F]', HIGH: 'bg-[#991B1B]' }

function CandidateCard({ candidate, onView }: { candidate: CashOutCandidate; onView: () => void }) {
  return (
    <div className="border border-[#D6D6D0] rounded-md px-5 py-4 bg-[#F0F0EC] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold mono px-2 py-0.5 rounded bg-[#FFFFFF] border border-[#D6D6D0] text-[#111111]">{candidate.type}</span>
          <span className="text-base font-bold text-[#000000] truncate">{candidate.name}</span>
        </div>
        <div className="text-xs text-[#222222] font-semibold mt-1.5 mono">
          {candidate.id} · {candidate.distanceKm} km · {candidate.historicalActivity} historical activity
        </div>
      </div>
      <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
        <div className="text-left sm:text-right">
          <div className="text-base font-bold mono text-[#102B3F]">{candidate.confidence}%</div>
          <RiskBadge risk={candidate.risk} />
        </div>
        <button onClick={onView} className="flex items-center gap-1.5 text-sm font-bold text-[#102B3F] hover:text-[#1F4057] mono whitespace-nowrap py-1.5 cursor-pointer">
          <MapPin size={15} /> View on Map
        </button>
      </div>
    </div>
  )
}

export default function Predictions() {
  const { selectedComplaint, predictions, runPrediction, focusMap, showToast, complaints } = useAppState()
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
    <div className="space-y-7">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#000000]">Predictive Analysis</h1>
          <p className="text-sm sm:text-base text-[#222222] font-medium mt-1">Run the prediction model against {c.id} to forecast the likely cash-out zone.</p>
        </div>
        <ComplaintPicker />
      </div>

      <Panel>
        <PanelHeader
          title="Run Predictive Analysis"
          action={<Button onClick={handleRunPrediction} disabled={analyzing} className="w-full sm:w-auto">{analyzing ? 'Analyzing…' : 'Run Predictive Analysis'}</Button>}
        />
        {analyzing ? (
          <div className="px-5 py-6 space-y-4">
            {ANALYSIS_STAGES.map((stage, i) => (
              <div key={stage} className="flex items-center gap-3.5">
                {i < stageIndex ? (
                  <CheckCircle2 size={18} className="text-[#15803D] shrink-0" />
                ) : i === stageIndex ? (
                  <div className="w-4 h-4 rounded-full border-2 border-[#102B3F] border-t-transparent animate-spin shrink-0" />
                ) : (
                  <div className="w-4 h-4 rounded-full border border-[#D6D6D0] shrink-0" />
                )}
                <span className={`text-[15px] font-semibold ${i <= stageIndex ? 'text-[#000000]' : 'text-[#222222]'}`}>{stage}</span>
              </div>
            ))}
          </div>
        ) : prediction ? (
          <div className="px-5 py-5 text-sm font-semibold text-[#222222]">
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
            <div className="px-5 py-6 grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-[#222222] mb-1">Predicted Cash-Out Zone</div>
                <div className="text-xl font-bold mono text-[#102B3F]">{zoneById(prediction.zone).name}</div>
                <div className="text-xs font-semibold text-[#222222] mono mt-0.5">{prediction.zone}</div>
              </div>
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-[#222222] mb-1">Confidence</div>
                <div className="text-xl font-bold mono text-[#000000]">{prediction.confidence}%</div>
              </div>
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-[#222222] mb-1">Risk</div>
                <RiskBadge risk={prediction.risk} />
              </div>
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-[#222222] mb-1">Estimated Withdrawal Window</div>
                <div className="text-base mono font-bold text-[#000000]">{prediction.windowStart} – {prediction.windowEnd}</div>
              </div>
            </div>
          </Panel>

          <Panel>
            <PanelHeader title="Potential Cash-Out Locations" subtitle="Ranked ATM, bank branch and merchant candidates" />
            <div className="px-5 py-6 space-y-3">
              {prediction.candidates.map((cand) => (
                <CandidateCard key={cand.id} candidate={cand} onView={() => handleViewOnMap(cand)} />
              ))}
            </div>
          </Panel>

          <Panel>
            <PanelHeader title="Prediction Evidence" subtitle="Simulated explanatory factors — not model feature importance" />
            <div className="px-5 py-6 space-y-4">
              {prediction.evidence.map((e) => (
                <div key={e.factor} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  <div className="sm:w-56 text-[15px] font-bold text-[#111111] shrink-0">{e.factor}</div>
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-full sm:flex-1 h-2 rounded-full bg-[#D6D6D0] overflow-hidden">
                      <div className={`h-full rounded-full ${STRENGTH_WIDTH[e.strength]} ${STRENGTH_COLOR[e.strength]}`} />
                    </div>
                    <div className="w-16 shrink-0 text-right text-xs font-bold mono text-[#111111]">{e.strength}</div>
                  </div>
                </div>
              ))}
              <div className="text-xs font-semibold text-[#222222] pt-3 border-t border-[#D6D6D0] mt-4">
                {zoneById(prediction.zone).name} · {prediction.confidence}% confidence
              </div>
            </div>
          </Panel>

          <XAIExplanation
            explanation={calculateRegionXAI(
              prediction.zone,
              getRegionData(prediction.zone, complaints, predictions),
              complaints,
              predictions,
            )}
          />
        </>
      )}

      <Panel>
        <PanelHeader
          title="Live Intelligence Demonstration"
          subtitle="Frontend-only walkthrough of the full intelligence pipeline"
          action={
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <Button variant="secondary" onClick={startLive} disabled={liveRunning && !livePaused} className="flex-1 sm:flex-none">
                <Play size={15} /> Start
              </Button>
              <Button variant="secondary" onClick={pauseLive} disabled={!liveRunning} className="flex-1 sm:flex-none">
                <Pause size={15} /> {livePaused ? 'Resume' : 'Pause'}
              </Button>
              <Button variant="ghost" onClick={resetLive} className="flex-1 sm:flex-none">
                <RotateCcw size={15} /> Reset
              </Button>
            </div>
          }
        />
        <div className="px-5 py-6">
          <div className="grid grid-cols-6 sm:grid-cols-11 gap-2 mb-6">
            {LIVE_STEPS.map((_, i) => (
              <div key={i} className={`h-2 rounded-full ${i <= liveStep && liveRunning ? 'bg-[#102B3F]' : 'bg-[#D6D6D0]'}`} />
            ))}
          </div>
          <div className="space-y-3">
            {LIVE_STEPS.map((step, i) => (
              <div key={step} className="flex items-center gap-3.5">
                {liveRunning && i < liveStep ? (
                  <CheckCircle2 size={18} className="text-[#15803D] shrink-0" />
                ) : liveRunning && i === liveStep ? (
                  <div className="w-4 h-4 rounded-full border-2 border-[#102B3F] border-t-transparent animate-spin shrink-0" />
                ) : (
                  <div className="w-4 h-4 rounded-full border border-[#D6D6D0] shrink-0" />
                )}
                <span className={`text-[15px] font-semibold ${liveRunning && i <= liveStep ? 'text-[#000000]' : 'text-[#222222]'}`}>{step}</span>
              </div>
            ))}
          </div>
        </div>
      </Panel>
    </div>
  )
}

