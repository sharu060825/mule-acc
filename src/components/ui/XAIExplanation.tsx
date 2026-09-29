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
    <div className="bg-[#FFFFFF] border border-[#D6D6D0] rounded-md p-6 sm:p-8 shadow-sm space-y-6 min-h-[300px] w-full">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#D6D6D0] pb-5">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#000000]">{title}</h2>
          <p className="text-base font-semibold text-[#222222] mt-1">
            Grounded feature attribution for <span className="text-[#000000] font-bold">{regionName}</span> ({regionId})
          </p>
        </div>
        <div className="flex items-center gap-4 bg-[#F0F0EC] border border-[#D6D6D0] rounded-md px-5 py-3 shrink-0">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-[#222222]">Risk Score</div>
            <div className="text-3xl sm:text-4xl font-bold mono text-[#000000]">{riskScore}%</div>
          </div>
          <span className={`px-3 py-1.5 rounded border text-sm font-bold mono ${riskBadgeStyle}`}>
            {riskLevel}
          </span>
        </div>
      </div>

      {/* Contributing Factors Grid */}
      <div className="space-y-4">
        <h3 className="text-lg sm:text-xl font-bold text-[#000000]">Key Contributing Factors</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {positiveFactors.map((factor, i) => (
            <div key={`pos-${i}`} className="bg-[#F0F0EC] border border-[#D6D6D0] rounded-md p-4 sm:p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-[#102B3F] uppercase tracking-wider flex items-center gap-1.5">
                  <span className="text-base font-extrabold text-[#102B3F]">+</span> Risk Factor {i + 1}
                </span>
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-[#102B3F] text-[#FFFFFF]">INCREASING RISK</span>
              </div>
              <p className="text-base sm:text-[17px] font-semibold text-[#111111] leading-relaxed">{factor}</p>
            </div>
          ))}

          {negativeFactors.map((factor, i) => (
            <div key={`neg-${i}`} className="bg-[#FFFFFF] border border-[#D6D6D0] rounded-md p-4 sm:p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-[#526B80] uppercase tracking-wider flex items-center gap-1.5">
                  <span className="text-base font-extrabold text-[#526B80]">−</span> Risk Mitigator {i + 1}
                </span>
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-[#E8E3D8] text-[#111111] border border-[#D6D6D0]">
                  REDUCING RISK
                </span>
              </div>
              <p className="text-base sm:text-[17px] font-semibold text-[#222222] leading-relaxed">{factor}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Risk Drivers Breakdown */}
      <div className="space-y-4 border-t border-[#D6D6D0] pt-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg sm:text-xl font-bold text-[#000000]">Risk Drivers & Model Attribution</h3>
          <span className="text-sm font-bold text-[#222222] uppercase tracking-wider">Impact Weight</span>
        </div>

        <div className="space-y-4">
          {drivers.map((d) => (
            <div key={d.featureKey} className="bg-[#F0F0EC] border border-[#D6D6D0] rounded-md p-4 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-base font-bold text-[#000000]">
                <span>{d.label}</span>
                <div className="flex items-center gap-3 text-sm mono">
                  <span className="text-[#222222] font-semibold">{d.rawFeatureValue}</span>
                  <span className={`px-2 py-0.5 rounded text-xs ${d.direction === 'positive' ? 'bg-[#102B3F] text-[#FFFFFF]' : 'bg-[#E8E3D8] text-[#111111] border border-[#D6D6D0]'}`}>
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
