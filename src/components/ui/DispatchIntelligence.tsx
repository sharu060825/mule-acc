import type { RegionData } from '../../pages/GisMap'
import type { RegionXAIExplanation } from '../../types'

interface DispatchIntelligenceProps {
  regionData: RegionData | null
  explanation?: RegionXAIExplanation | null
}

export default function DispatchIntelligence({ regionData, explanation }: DispatchIntelligenceProps) {
  if (!regionData) {
    return (
      <div className="bg-[#FFFFFF] border border-[#D6D6D0] rounded-md p-6 sm:p-8 shadow-sm">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#000000] mb-2">Dispatch Intelligence</h2>
        <div className="text-base text-[#222222] font-medium bg-[#F0F0EC] p-4 rounded border border-[#D6D6D0]">
          No dispatch recommendation available for this region.
        </div>
      </div>
    )
  }

  const { area, location, risk, riskLevel, linkedComplaints, timeWindow, actionRecommended } = regionData

  // Operational priority derived strictly from risk level
  const priority = riskLevel === 'CRITICAL' ? 'CRITICAL' : riskLevel === 'HIGH' ? 'HIGH' : riskLevel === 'MEDIUM' ? 'MEDIUM' : 'LOW'

  const priorityStyle = {
    CRITICAL: 'bg-[#FEF2F2] text-[#991B1B] border-[#FCA5A5]',
    HIGH: 'bg-[#FEF2F2] text-[#B91C1C] border-[#FCA5A5]',
    MEDIUM: 'bg-[#FFFBEB] text-[#92400E] border-[#FDE68A]',
    LOW: 'bg-[#F0FDF4] text-[#166534] border-[#BBF7D0]',
  }[priority]

  // Supporting reason dynamically generated from actual region indicators and top XAI drivers
  let reason = ''
  if (explanation && explanation.positiveFactors.length > 0 && (priority === 'CRITICAL' || priority === 'HIGH')) {
    reason = `High recent incident frequency (${linkedComplaints} linked complaints) and ${explanation.positiveFactors[0].toLowerCase()}.`
  } else if (priority === 'CRITICAL' || priority === 'HIGH') {
    reason = `High recent incident frequency (${linkedComplaints} linked complaints) and elevated threat indicators during ${timeWindow}.`
  } else if (priority === 'MEDIUM') {
    reason = `Moderate incident activity (${linkedComplaints} linked complaints) and active cash-out infrastructure in ${area}.`
  } else {
    reason = `Current risk indicators remain below the elevated-risk threshold (${linkedComplaints} linked complaint).`
  }

  // Recipient guidance based on regional risk level
  const bankGuidance =
    priority === 'CRITICAL' || priority === 'HIGH'
      ? `Freeze linked beneficiary accounts & monitor high-value transactions near ${location} in ${area}.`
      : priority === 'MEDIUM'
      ? `Flag rapid disbursals & track withdrawal volume near ${location}.`
      : `Standard transaction monitoring and automated velocity logging for ${area}.`

  const lawEnforcementGuidance =
    priority === 'CRITICAL' || priority === 'HIGH'
      ? `Deploy field unit to ${area} (${location}) during peak window ${timeWindow}.`
      : priority === 'MEDIUM'
      ? `Alert regional patrol for cash-out surveillance near ${area}.`
      : `Routine geospatial surveillance and logging in ${area}.`

  const responseUnitGuidance =
    priority === 'CRITICAL' || priority === 'HIGH'
      ? `Surveillance at ATM point ${location} and merchant cash-out clusters in ${area}.`
      : priority === 'MEDIUM'
      ? `Monitor merchant points and high-density ATMs in ${area}.`
      : `Routine merchant and ATM point check in ${area}.`

  return (
    <div className="bg-[#FFFFFF] border border-[#D6D6D0] rounded-md p-6 sm:p-8 shadow-sm space-y-6 min-h-[300px] w-full">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#D6D6D0] pb-5">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#000000]">DISPATCH INTELLIGENCE</h2>
          <p className="text-base font-semibold text-[#222222] mt-1">
            Operational response recommendations for <span className="text-[#000000] font-bold">{area}</span>
          </p>
        </div>
        <div className="flex items-center gap-4 bg-[#F0F0EC] border border-[#D6D6D0] rounded-md px-5 py-3 shrink-0">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-[#222222]">Operational Priority</div>
            <div className="text-xl sm:text-2xl font-bold mono text-[#000000] mt-0.5">{priority}</div>
          </div>
          <span className={`px-3 py-1.5 rounded border text-sm font-bold mono ${priorityStyle}`}>
            {risk}% RISK
          </span>
        </div>
      </div>

      {/* Region & Operational Overview Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-[#F0F0EC] p-4 sm:p-5 rounded-md border border-[#D6D6D0]">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-[#222222]">Target Area</div>
          <div className="text-lg font-bold text-[#000000] mt-1">{area}</div>
        </div>
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-[#222222]">Target Location</div>
          <div className="text-lg font-bold mono text-[#102B3F] mt-1">{location}</div>
        </div>
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-[#222222]">Active Time Window</div>
          <div className="text-lg font-bold mono text-[#000000] mt-1">{timeWindow}</div>
        </div>
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-[#222222]">Linked Complaints</div>
          <div className="text-lg font-bold mono text-[#000000] mt-1">{linkedComplaints} incidents</div>
        </div>
      </div>

      {/* Recommended Response & Supporting Reason */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[#FFFFFF] border border-[#D6D6D0] rounded-md p-5 flex flex-col justify-between space-y-3">
          <div className="text-sm font-bold text-[#102B3F] uppercase tracking-wider">
            Recommended Operational Response
          </div>
          <p className="text-base sm:text-lg font-bold text-[#000000] leading-snug bg-[#F0F0EC] p-4 rounded border border-[#D6D6D0]">
            {actionRecommended}
          </p>
        </div>

        <div className="bg-[#FFFFFF] border border-[#D6D6D0] rounded-md p-5 flex flex-col justify-between space-y-3">
          <div className="text-sm font-bold text-[#222222] uppercase tracking-wider">
            Supporting Operational Reason
          </div>
          <p className="text-base sm:text-[17px] font-semibold text-[#111111] leading-relaxed bg-[#F0F0EC] p-4 rounded border border-[#D6D6D0]">
            {reason}
          </p>
        </div>
      </div>

      {/* Actionable Response Partner Guidance */}
      <div className="space-y-4 border-t border-[#D6D6D0] pt-6">
        <h3 className="text-lg sm:text-xl font-bold text-[#000000]">Response Partner Dispatch Plan</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[#F0F0EC] border border-[#D6D6D0] rounded-md p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-[#102B3F] uppercase tracking-wider">BANK PARTNER</span>
              <span className="text-xs font-bold mono bg-[#102B3F] text-[#FFFFFF] px-2 py-0.5 rounded">BANK</span>
            </div>
            <p className="text-sm font-semibold text-[#111111] leading-relaxed">{bankGuidance}</p>
          </div>

          <div className="bg-[#F0F0EC] border border-[#D6D6D0] rounded-md p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-[#102B3F] uppercase tracking-wider">LAW ENFORCEMENT</span>
              <span className="text-xs font-bold mono bg-[#102B3F] text-[#FFFFFF] px-2 py-0.5 rounded">POLICE</span>
            </div>
            <p className="text-sm font-semibold text-[#111111] leading-relaxed">{lawEnforcementGuidance}</p>
          </div>

          <div className="bg-[#F0F0EC] border border-[#D6D6D0] rounded-md p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-[#102B3F] uppercase tracking-wider">LOCAL RESPONSE UNIT</span>
              <span className="text-xs font-bold mono bg-[#102B3F] text-[#FFFFFF] px-2 py-0.5 rounded">FIELD</span>
            </div>
            <p className="text-sm font-semibold text-[#111111] leading-relaxed">{responseUnitGuidance}</p>
          </div>
        </div>
      </div>

      {/* Operational Disclaimer */}
      <div className="text-sm font-semibold text-[#222222] italic pt-4 border-t border-[#D6D6D0] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <span>Rule-based operational recommendation derived from real-time regional risk thresholds.</span>
        <span className="mono font-bold text-xs text-[#102B3F] uppercase tracking-wider shrink-0">CYBLOCK DISPATCH ENGINE</span>
      </div>
    </div>
  )
}
