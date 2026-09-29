import { useEffect, useMemo, useState } from 'react'
import { MapContainer, TileLayer, Marker, Circle, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import { useAppState } from '../state/AppState'
import {
  COMPLAINTS,
  HIGH_RISK_ZONES,
  ATM_LOCATIONS,
  BANK_BRANCHES,
  MERCHANT_POINTS,
  ZONES,
  zoneById,
} from '../data/mockData'
import { Panel, PanelHeader, RiskBadge, formatINR } from '../components/ui/Primitives'
import XAIExplanation from '../components/ui/XAIExplanation'
import DispatchIntelligence from '../components/ui/DispatchIntelligence'
import { calculateRegionXAI } from '../data/xai'
import type { Complaint, GeoPoint, Prediction, RiskLevel } from '../types'

const CHENNAI_CENTER: GeoPoint = { lat: 13.03, lng: 80.21 }

function dotIcon(color: string, size = 12) {
  return L.divIcon({
    className: '',
    html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};border:2px solid #FFFFFF;box-shadow: 0 1px 3px rgba(0,0,0,0.25);"></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
}

const ICONS = {
  complaint: dotIcon('#1F4057', 12),
  complaintCritical: dotIcon('#991B1B', 15),
  atm: dotIcon('#102B3F', 10),
  bank: dotIcon('#166534', 11),
  merchant: dotIcon('#526B80', 10),
  predicted: dotIcon('#991B1B', 16),
}

interface Layers {
  complaints: boolean
  historical: boolean
  predicted: boolean
  atms: boolean
  banks: boolean
  merchants: boolean
}

export interface RegionData {
  id: string
  area: string
  location: string
  timeWindow: string
  risk: number
  riskLevel: RiskLevel
  linkedComplaints: number
  alertType: string
  actionRecommended: string
  center: GeoPoint
}

export function getRegionData(
  zoneId: string,
  complaints: Complaint[],
  predictions: Record<string, Prediction>,
): RegionData {
  const zone = zoneById(zoneId)
  const highRisk = HIGH_RISK_ZONES.find((z) => z.zone === zoneId)
  const zoneComplaints = complaints.filter((c) => c.victimZone === zoneId || c.predictedZone === zoneId)
  const prediction = Object.values(predictions).find((p) => p.zone === zoneId)
  const zoneAtm = ATM_LOCATIONS.find((a) => a.zone === zoneId)

  let location = `ATM-${zone.id.replace('ZONE-', '1')}`
  if (zoneAtm) {
    location = `${zoneAtm.id} (${zoneAtm.name.split('—')[0].trim()})`
  }

  const linkedComplaints =
    zoneComplaints.length > 0
      ? zoneComplaints.length
      : highRisk?.complaintCount && highRisk.complaintCount > 0
      ? highRisk.complaintCount
      : zone.name.includes('Tambaram')
      ? 8
      : zone.name.includes('Chromepet')
      ? 4
      : zone.name.includes('Pallavaram')
      ? 11
      : 1

  let riskPercent = 18
  if (prediction?.confidence) {
    riskPercent = prediction.confidence
  } else if (highRisk) {
    const baseRisk = {
      CRITICAL: 87,
      HIGH: 64,
      MEDIUM: 42,
      LOW: 18,
    }[highRisk.risk]
    riskPercent = Math.min(98, Math.max(15, baseRisk + (((parseInt(zone.id.replace('ZONE-', '')) * 5) % 7) - 3)))
  } else if (zoneComplaints.length > 0) {
    riskPercent = Math.min(95, 25 + zoneComplaints.length * 15)
  }

  const riskLevel: RiskLevel =
    riskPercent >= 75 ? 'CRITICAL' : riskPercent >= 55 ? 'HIGH' : riskPercent >= 35 ? 'MEDIUM' : 'LOW'

  let timeWindow = '18:30–20:00'
  if (prediction?.windowStart && prediction?.windowEnd) {
    timeWindow = `${prediction.windowStart}–${prediction.windowEnd}`
  } else {
    const foundWindow = zoneComplaints.find((c) => c.estimatedWithdrawal)?.estimatedWithdrawal
    if (foundWindow) {
      timeWindow = foundWindow
    } else {
      const zoneNum = parseInt(zone.id.replace('ZONE-', '')) || 1
      const startH = (16 + ((zoneNum * 2) % 6)).toString().padStart(2, '0')
      const endH = (18 + ((zoneNum * 2) % 6)).toString().padStart(2, '0')
      timeWindow = `${startH}:30–${endH}:00`
    }
  }

  let alertType = 'Geospatial risk monitoring'
  if (riskLevel === 'CRITICAL') {
    alertType = 'Critical cash-out threat'
  } else if (riskLevel === 'HIGH') {
    alertType = 'Potential withdrawal detected'
  } else if (riskLevel === 'MEDIUM') {
    alertType = 'Suspicious transaction cluster'
  } else {
    alertType = 'Geospatial risk monitoring'
  }

  let actionRecommended = 'Routine geospatial surveillance and logging'
  if (riskLevel === 'CRITICAL') {
    actionRecommended = 'Increase monitoring / verify relevant activity & flag rapid disbursals'
  } else if (riskLevel === 'HIGH') {
    actionRecommended = 'Deploy patrol unit & verify high-value transactions'
  } else if (riskLevel === 'MEDIUM') {
    actionRecommended = 'Monitor cash withdrawal volume & flag rapid disbursals'
  } else {
    actionRecommended = 'Routine geospatial surveillance and logging'
  }

  return {
    id: zone.id,
    area: zone.name,
    location,
    timeWindow,
    risk: riskPercent,
    riskLevel,
    linkedComplaints,
    alertType,
    actionRecommended,
    center: zone.center,
  }
}

function FocusHandler({ focus }: { focus: { location: GeoPoint; label: string } | null }) {
  const map = useMap()
  useEffect(() => {
    if (focus) {
      map.flyTo([focus.location.lat, focus.location.lng], 15, { duration: 0.8 })
    }
  }, [focus, map])
  return null
}

function LegendRow({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2.5 text-sm font-semibold text-[#111111]">
      <span className="w-3 h-3 rounded-full shrink-0 border border-[#D6D6D0]" style={{ background: color }} />
      {label}
    </div>
  )
}

export default function GisMap() {
  const { mapFocus, clearMapFocus, predictions, complaints } = useAppState()
  const [layers, setLayers] = useState<Layers>({
    complaints: true,
    historical: true,
    predicted: true,
    atms: true,
    banks: true,
    merchants: true,
  })

  // Default initial selected region: predicted zone if present, else Tambaram (ZONE-05)
  const initialRegionId = useMemo(() => {
    const predicted = complaints.find((c) => c.predictedZone && predictions[c.id])
    return predicted?.predictedZone ?? 'ZONE-05'
  }, [complaints, predictions])

  const [selectedRegionId, setSelectedRegionId] = useState<string>(initialRegionId)

  const selectedRegionData = useMemo(() => {
    return getRegionData(selectedRegionId, complaints, predictions)
  }, [selectedRegionId, complaints, predictions])

  const predictedZones = useMemo(() => {
    const zoneIds = new Set(complaints.filter((c) => c.predictedZone).map((c) => c.predictedZone!))
    return Array.from(zoneIds).map((id) => zoneById(id))
  }, [complaints])

  function toggle(key: keyof Layers) {
    setLayers((l) => ({ ...l, [key]: !l[key] }))
  }

  useEffect(() => {
    if (mapFocus) {
      const matchedZone = ZONES.find(
        (z) =>
          z.name.toLowerCase().includes(mapFocus.label.toLowerCase()) ||
          mapFocus.label.toLowerCase().includes(z.name.toLowerCase()),
      )
      if (matchedZone) {
        setSelectedRegionId(matchedZone.id)
      }
      const t = setTimeout(clearMapFocus, 100)
      return () => clearTimeout(t)
    }
  }, [mapFocus, clearMapFocus])

  return (
    <div className="space-y-7">
      <div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#000000]">GIS Map</h1>
        <p className="text-base text-[#222222] font-medium mt-1">
          Interactive geospatial view of complaints, historical risk, predictions and cash-out infrastructure.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <Panel className="overflow-hidden">
            <div className="h-[70vh] max-h-[420px] sm:max-h-[520px] lg:h-[600px] lg:max-h-none relative">
              <MapContainer center={[CHENNAI_CENTER.lat, CHENNAI_CENTER.lng]} zoom={12} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                <FocusHandler focus={mapFocus} />

                {/* Highlight ring around selected region */}
                {selectedRegionData && (
                  <Circle
                    key={`select-ring-${selectedRegionData.id}`}
                    center={[selectedRegionData.center.lat, selectedRegionData.center.lng]}
                    radius={850}
                    pathOptions={{
                      color: '#1F4057',
                      fillColor: '#1F4057',
                      fillOpacity: 0.25,
                      weight: 3,
                    }}
                  />
                )}

                {layers.historical &&
                  HIGH_RISK_ZONES.map((z) => {
                    const isSelected = z.zone === selectedRegionId
                    return (
                      <Circle
                        key={`hist-${z.zone}`}
                        center={[z.center.lat, z.center.lng]}
                        radius={500 + z.historicalActivity * 8}
                        pathOptions={{
                          color: isSelected ? '#1F4057' : z.risk === 'CRITICAL' || z.risk === 'HIGH' ? '#102B3F' : '#526B80',
                          fillColor: isSelected ? '#1F4057' : z.risk === 'CRITICAL' || z.risk === 'HIGH' ? '#102B3F' : '#526B80',
                          fillOpacity: isSelected ? 0.28 : 0.12,
                          weight: isSelected ? 3 : 1.5,
                        }}
                        eventHandlers={{
                          click: () => setSelectedRegionId(z.zone),
                        }}
                      />
                    )
                  })}

                {layers.predicted &&
                  predictedZones.map((z) => (
                    <Circle
                      key={`pred-${z.id}`}
                      center={[z.center.lat, z.center.lng]}
                      radius={700}
                      pathOptions={{ color: '#991B1B', fillColor: '#991B1B', fillOpacity: 0.15, weight: 2, dashArray: '4 4' }}
                      eventHandlers={{
                        click: () => setSelectedRegionId(z.id),
                      }}
                    />
                  ))}

                {layers.complaints &&
                  COMPLAINTS.map((c) => (
                    <Marker
                      key={c.id}
                      position={[c.victimLocation.lat, c.victimLocation.lng]}
                      icon={c.risk === 'CRITICAL' ? ICONS.complaintCritical : ICONS.complaint}
                      eventHandlers={{
                        click: () => setSelectedRegionId(c.victimZone),
                      }}
                    >
                      <Popup>
                        <div className="text-sm font-semibold text-[#111111]">
                          <div className="font-bold">{c.id}</div>
                          <div>
                            {c.fraudType} · {formatINR(c.amount)}
                          </div>
                          <div className="text-xs text-[#222222] mt-1 font-medium">Zone: {zoneById(c.victimZone).name}</div>
                        </div>
                      </Popup>
                    </Marker>
                  ))}

                {layers.atms &&
                  ATM_LOCATIONS.map((a) => (
                    <Marker
                      key={a.id}
                      position={[a.location.lat, a.location.lng]}
                      icon={ICONS.atm}
                      eventHandlers={{ click: () => setSelectedRegionId(a.zone) }}
                    />
                  ))}

                {layers.banks &&
                  BANK_BRANCHES.map((b) => (
                    <Marker
                      key={b.id}
                      position={[b.location.lat, b.location.lng]}
                      icon={ICONS.bank}
                      eventHandlers={{ click: () => setSelectedRegionId(b.zone) }}
                    />
                  ))}

                {layers.merchants &&
                  MERCHANT_POINTS.map((m) => (
                    <Marker
                      key={m.id}
                      position={[m.location.lat, m.location.lng]}
                      icon={ICONS.merchant}
                      eventHandlers={{ click: () => setSelectedRegionId(m.zone) }}
                    />
                  ))}
              </MapContainer>
            </div>
          </Panel>

          {/* Region Quick Select Bar */}
          <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            <span className="text-xs text-[#222222] shrink-0 font-bold uppercase tracking-wider">Select Region:</span>
            {ZONES.map((z) => {
              const active = z.id === selectedRegionId
              return (
                <button
                  key={z.id}
                  onClick={() => setSelectedRegionId(z.id)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold shrink-0 transition-colors cursor-pointer ${
                    active
                      ? 'bg-[#102B3F] text-[#FFFFFF] border border-[#102B3F]'
                      : 'bg-[#FFFFFF] text-[#111111] border border-[#D6D6D0] hover:bg-[#F0F0EC]'
                  }`}
                >
                  {z.name}
                </button>
              )
            })}
          </div>

          {/* Prominent Explainable AI (XAI) & Dispatch Intelligence Section directly below GIS Map */}
          {selectedRegionData && (
            <div className="mt-6 grid grid-cols-1 xl:grid-cols-2 gap-6">
              <XAIExplanation
                explanation={calculateRegionXAI(selectedRegionId, selectedRegionData, complaints, predictions)}
              />
              <DispatchIntelligence
                regionData={selectedRegionData}
                explanation={calculateRegionXAI(selectedRegionId, selectedRegionData, complaints, predictions)}
              />
            </div>
          )}
        </div>

        <div className="space-y-4">
          <Panel>
            <PanelHeader title="Map Layers" />
            <div className="px-5 py-4 space-y-3">
              {(
                [
                  ['complaints', 'Complaints', '#1F4057'],
                  ['historical', 'Historical Risk', '#102B3F'],
                  ['predicted', 'Predicted Risk', '#991B1B'],
                  ['atms', 'ATMs', '#102B3F'],
                  ['banks', 'Bank Branches', '#166534'],
                  ['merchants', 'Merchant Cash-Out Points', '#526B80'],
                ] as Array<[keyof Layers, string, string]>
              ).map(([key, label, color]) => (
                <label key={key} className="flex items-center justify-between gap-3 cursor-pointer py-1">
                  <LegendRow color={color} label={label} />
                  <input
                    type="checkbox"
                    checked={layers[key]}
                    onChange={() => toggle(key)}
                    className="w-5 h-5 shrink-0 accent-[#102B3F]"
                  />
                </label>
              ))}
            </div>
          </Panel>

          <Panel>
            <PanelHeader title="Location Details" subtitle="Selected region intelligence" />
            <div className="px-5 py-5">
              {selectedRegionData ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold tracking-wider mono px-2.5 py-1 rounded bg-[#102B3F] text-[#FFFFFF] uppercase">
                      PREDICTIVE ALERT
                    </span>
                    <RiskBadge risk={selectedRegionData.riskLevel} />
                  </div>

                  <div className="text-xl font-bold text-[#000000]">{selectedRegionData.alertType}</div>

                  <div className="space-y-2.5 text-[15px] border-t border-b border-[#D6D6D0] py-3.5">
                    <div className="flex justify-between items-center">
                      <span className="text-[#222222] font-semibold">Location:</span>
                      <span className="mono text-[#000000] font-bold">{selectedRegionData.location}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-[#222222] font-semibold">Area:</span>
                      <span className="text-[#000000] font-bold">{selectedRegionData.area}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-[#222222] font-semibold">Time window:</span>
                      <span className="mono text-[#000000] font-bold">{selectedRegionData.timeWindow}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-[#222222] font-semibold">Risk:</span>
                      <span className="mono text-[#000000] font-bold text-lg">{selectedRegionData.risk}%</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-[#222222] font-semibold">Linked complaints:</span>
                      <span className="mono text-[#000000] font-bold">{selectedRegionData.linkedComplaints}</span>
                    </div>
                  </div>

                  <div>
                    <div className="text-sm font-bold text-[#000000] mb-1.5">Action recommended:</div>
                    <div className="text-sm text-[#111111] font-medium bg-[#F0F0EC] p-3.5 rounded border border-[#D6D6D0] leading-relaxed">
                      {selectedRegionData.actionRecommended}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-[#222222] font-medium">Click a marker or zone on the map to see details here.</div>
              )}
            </div>
          </Panel>


          {Object.keys(predictions).length > 0 && (
            <Panel>
              <PanelHeader title="Active Predictions" />
              <div className="divide-y divide-[#D6D6D0]">
                {Object.values(predictions).map((p) => (
                  <div
                    key={p.complaintId}
                    onClick={() => setSelectedRegionId(p.zone)}
                    className="px-5 py-3.5 cursor-pointer hover:bg-[#F0F0EC] transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-base text-[#000000] font-bold mono">{p.complaintId}</span>
                      <RiskBadge risk={p.risk} />
                    </div>
                    <div className="text-xs text-[#222222] font-semibold mt-1">
                      {zoneById(p.zone).name} · {p.confidence}% confidence
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          )}
        </div>
      </div>
    </div>
  )
}


