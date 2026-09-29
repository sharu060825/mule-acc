import type { RegionXAIExplanation } from '../../types'

export default function XAIExplanation({ explanation }: { explanation: RegionXAIExplanation }) {
  const { riskScore, riskLevel, drivers, positiveFactors, negativeFactors, disclaimer, regionName, regionId } = explanation

  // Dynamic heading based on risk level
  const title = riskLevel === 'LOW' ? 'WHY IS THIS AREA LOW RISK?' : 'WHY THIS RISK?'

  const riskBadgeStyle = {
    CRITICAL: 'bg-[#FEF2F2] text-[#991B1B] border-[#FCA5A5]',
    HIGH: 'bg-[#FEF2F2] text-[#B91C1C] border-[#FCA5A5]',
    MEDIUM: 'bg-[#FFFBEB] text-[#92400E] border-[#FDE68A]',
    LOW: 'bg-[#F0FDF4] text-[#166534] border-[#BBF7D0]',
  }[riskLevel]

  return (
    <div className="bg-[#FFFFFF] border border-[#D6D6D0] rounded-md p-5 sm:p-6 shadow-sm space-y-5 min-h-[300px] w-full">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#D6D6D0] pb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#000000]">{title}</h2>
          <p className="text-sm font-semibold text-[#222222] mt-0.5">
            Grounded feature attribution for <span className="text-[#000000] font-bold">{regionName}</span> ({regionId})
          </p>
        </div>
        <div className="flex items-center gap-3 bg-[#F0F0EC] border border-[#D6D6D0] rounded-md px-4 py-2.5 shrink-0">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#222222]">Risk Score</div>
            <div className="text-2xl sm:text-3xl font-bold mono text-[#000000]">{riskScore}%</div>
          </div>
          <span className={`px-2.5 py-1 rounded border text-xs font-bold mono ${riskBadgeStyle}`}>
            {riskLevel}
          </span>
        </div>
      </div>

      {/* Contributing Factors Grid */}
      <div className="space-y-3">
        <h3 className="text-base sm:text-lg font-bold text-[#000000]">Key Contributing Factors</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {positiveFactors.map((factor, i) => (
            <div key={`pos-${i}`} className="bg-[#F0F0EC] border border-[#D6D6D0] rounded-md p-3.5 sm:p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-[#102B3F] uppercase tracking-wider flex items-center gap-1">
                  <span className="text-sm font-extrabold text-[#102B3F]">+</span> Risk Factor {i + 1}
                </span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-[#102B3F] text-[#FFFFFF]">INCREASING RISK</span>
              </div>
              <p className="text-sm font-semibold text-[#111111] leading-relaxed">{factor}</p>
            </div>
          ))}

          {negativeFactors.map((factor, i) => (
            <div key={`neg-${i}`} className="bg-[#FFFFFF] border border-[#D6D6D0] rounded-md p-3.5 sm:p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-[#526B80] uppercase tracking-wider flex items-center gap-1">
                  <span className="text-sm font-extrabold text-[#526B80]">−</span> Risk Mitigator {i + 1}
                </span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-[#E8E3D8] text-[#111111] border border-[#D6D6D0]">
                  REDUCING RISK
                </span>
              </div>
              <p className="text-sm font-semibold text-[#222222] leading-relaxed">{factor}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Risk Drivers Breakdown */}
      <div className="space-y-3 border-t border-[#D6D6D0] pt-5">
        <div className="flex items-center justify-between">
          <h3 className="text-base sm:text-lg font-bold text-[#000000]">Risk Drivers & Model Attribution</h3>
          <span className="text-xs font-bold text-[#222222] uppercase tracking-wider">Impact Weight</span>
        </div>

        <div className="space-y-3">
          {drivers.map((d) => (
            <div key={d.featureKey} className="bg-[#F0F0EC] border border-[#D6D6D0] rounded-md p-3.5 space-y-1.5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-sm font-bold text-[#000000]">
                <span>{d.label}</span>
                <div className="flex items-center gap-2.5 text-xs mono">
                  <span className="text-[#222222] font-semibold">{d.rawFeatureValue}</span>
                  <span className={`px-2 py-0.5 rounded text-[11px] ${d.direction === 'positive' ? 'bg-[#102B3F] text-[#FFFFFF]' : 'bg-[#E8E3D8] text-[#111111] border border-[#D6D6D0]'}`}>
                    {d.level} ({d.impactScore > 0 ? `+${d.impactScore}` : d.impactScore})
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-full h-3 rounded bg-[#FFFFFF] border border-[#D6D6D0] overflow-hidden">
                  <div
                    className={`h-full rounded transition-all duration-300 ${
                      d.direction === 'positive'
                        ? d.level === 'HIGH'
                          ? 'bg-[#102B3F]'
                          : 'bg-[#1F4057]'
                        : 'bg-[#526B80]'
                    }`}
                    style={{ width: `${d.barWidthPercent}%` }}
                  />
                </div>
              </div>
              <div className="text-sm font-medium text-[#222222] italic">{d.explanation}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Transparency Disclaimer */}
      <div className="text-sm font-semibold text-[#222222] italic pt-4 border-t border-[#D6D6D0] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <span>{disclaimer}. Decision-support intelligence — evaluate before dispatch.</span>
        <span className="mono font-bold text-xs text-[#102B3F] uppercase tracking-wider shrink-0">MODEL XAI ATTRIBUTION LAYER</span>
      </div>
    </div>
  )
}
