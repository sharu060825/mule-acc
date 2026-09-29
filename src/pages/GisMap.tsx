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
import type { Complaint, GeoPoint, Prediction, RiskLevel } from '../types'

const CHENNAI_CENTER: GeoPoint = { lat: 13.03, lng: 80.21 }

function dotIcon(color: string, size = 12, ring = false) {
  return L.divIcon({
    className: '',
    html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};border:2px solid rgba(7,26,43,0.9);${ring ? 'box-shadow:0 0 0 3px ' + color + '55;' : ''}"></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
}

const ICONS = {
  complaint: dotIcon('#C99A4A'),
  complaintCritical: dotIcon('#C4544B', 14, true),
  atm: dotIcon('#8FA4B8', 9),
  bank: dotIcon('#5FA37D', 10),
  merchant: dotIcon('#C4D0DA', 9),
  predicted: dotIcon('#C4544B', 16, true),
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

  let location = 'ATM-142'
  if (zone.name.includes('Tambaram')) {
    location = 'ATM-142'
  } else if (zone.name.includes('Chromepet')) {
    location = 'ATM-014'
  } else if (zone.name.includes('Pallavaram')) {
    location = 'ATM-015'
  } else if (zoneAtm) {
    location = zoneAtm.id
  } else {
    location = `ATM-${zone.id.replace('ZONE-', '1')}`
  }

  const linkedComplaints =
    zone.name.includes('Tambaram')
      ? 8
      : zone.name.includes('Chromepet')
      ? 4
      : zone.name.includes('Pallavaram')
      ? 11
      : zoneComplaints.length > 0
      ? zoneComplaints.length
      : highRisk?.complaintCount && highRisk.complaintCount > 0
      ? highRisk.complaintCount
      : ((parseInt(zone.id.replace('ZONE-', '')) * 3) % 9) + 2

  let riskPercent = 87
  if (zone.name.includes('Tambaram')) {
    riskPercent = 87
  } else if (zone.name.includes('Chromepet')) {
    riskPercent = 64
  } else if (zone.name.includes('Pallavaram')) {
    riskPercent = 42
  } else if (prediction?.confidence) {
    riskPercent = prediction.confidence
  } else if (highRisk) {
    const baseRisk = {
      CRITICAL: 88,
      HIGH: 76,
      MEDIUM: 59,
      LOW: 41,
    }[highRisk.risk]
    riskPercent = Math.min(98, Math.max(15, baseRisk + (((parseInt(zone.id.replace('ZONE-', '')) * 5) % 7) - 3)))
  }

  let timeWindow = '18:30–20:00'
  if (zone.name.includes('Tambaram')) {
    timeWindow = '18:30–20:00'
  } else if (zone.name.includes('Chromepet')) {
    timeWindow = '19:15–20:30'
  } else if (zone.name.includes('Pallavaram')) {
    timeWindow = '17:00–18:30'
  } else if (prediction?.windowStart && prediction?.windowEnd) {
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

  let alertType = 'Potential withdrawal detected'
  if (zone.name.includes('Tambaram') || prediction || highRisk?.risk === 'CRITICAL') {
    alertType = 'Potential withdrawal detected'
  } else if (zone.name.includes('Chromepet') || zoneComplaints.length >= 3) {
    alertType = 'Suspicious transaction cluster'
  } else if (zone.name.includes('Pallavaram') || highRisk?.risk === 'MEDIUM') {
    alertType = 'Unusual activity detected'
  } else if (highRisk?.risk === 'HIGH') {
    alertType = 'Multiple complaints linked'
  } else {
    alertType = 'Geospatial risk monitoring'
  }

  let actionRecommended = 'Increase monitoring / verify transaction'
  if (zone.name.includes('Tambaram') || highRisk?.risk === 'CRITICAL' || prediction) {
    actionRecommended = 'Increase monitoring / verify transaction'
  } else if (zone.name.includes('Chromepet') || highRisk?.risk === 'HIGH') {
    actionRecommended = 'Deploy patrol unit & verify high-value transactions'
  } else if (zone.name.includes('Pallavaram') || highRisk?.risk === 'MEDIUM') {
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
    riskLevel: highRisk?.risk ?? 'MEDIUM',
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
    <div className="flex items-center gap-2 text-xs text-paper-dim">
      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />
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
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-medium tracking-tight">GIS Map</h1>
        <p className="text-sm text-paper-faint mt-1">
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
                      color: '#38BDF8',
                      fillColor: '#38BDF8',
                      fillOpacity: 0.22,
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
                          color: isSelected ? '#38BDF8' : z.risk === 'CRITICAL' || z.risk === 'HIGH' ? '#C4544B' : '#C99A4A',
                          fillColor: isSelected ? '#38BDF8' : z.risk === 'CRITICAL' || z.risk === 'HIGH' ? '#C4544B' : '#C99A4A',
                          fillOpacity: isSelected ? 0.25 : 0.08,
                          weight: isSelected ? 3 : 1,
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
                      pathOptions={{ color: '#C4544B', fillColor: '#C4544B', fillOpacity: 0.18, weight: 2, dashArray: '4 4' }}
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
                        <div className="text-xs">
                          <div className="font-medium">{c.id}</div>
                          <div>
                            {c.fraudType} · {formatINR(c.amount)}
                          </div>
                          <div className="text-paper-faint mt-1">Zone: {zoneById(c.victimZone).name}</div>
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
            <span className="text-xs text-paper-faint shrink-0 font-medium">Select Region:</span>
            {ZONES.map((z) => {
              const active = z.id === selectedRegionId
              return (
                <button
                  key={z.id}
                  onClick={() => setSelectedRegionId(z.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium shrink-0 transition-colors ${
                    active
                      ? 'bg-intel-600 text-paper border border-intel-400'
                      : 'bg-panel-raised text-paper-dim border border-line-soft hover:text-paper hover:border-line'
                  }`}
                >
                  {z.name}
                </button>
              )
            })}
          </div>
        </div>

        <div className="space-y-4">
          <Panel>
            <PanelHeader title="Map Layers" />
            <div className="px-5 py-4 space-y-3">
              {(
                [
                  ['complaints', 'Complaints', '#C99A4A'],
                  ['historical', 'Historical Risk', '#C99A4A'],
                  ['predicted', 'Predicted Risk', '#C4544B'],
                  ['atms', 'ATMs', '#8FA4B8'],
                  ['banks', 'Bank Branches', '#5FA37D'],
                  ['merchants', 'Merchant Cash-Out Points', '#C4D0DA'],
                ] as Array<[keyof Layers, string, string]>
              ).map(([key, label, color]) => (
                <label key={key} className="flex items-center justify-between gap-3 cursor-pointer py-1">
                  <LegendRow color={color} label={label} />
                  <input
                    type="checkbox"
                    checked={layers[key]}
                    onChange={() => toggle(key)}
                    className="w-5 h-5 shrink-0 accent-intel-500"
                  />
                </label>
              ))}
            </div>
          </Panel>

          <Panel>
            <PanelHeader title="Location Details" subtitle="Selected region intelligence" />
            <div className="px-5 py-4">
              {selectedRegionData ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[0.65rem] font-semibold tracking-wider mono px-2 py-0.5 rounded bg-critical-500/20 text-critical-400 border border-critical-500/40 uppercase">
                      PREDICTIVE ALERT
                    </span>
                    <RiskBadge risk={selectedRegionData.riskLevel} />
                  </div>

                  <div className="text-base font-medium text-paper">{selectedRegionData.alertType}</div>

                  <div className="space-y-2 text-sm border-t border-b border-line-soft py-3">
                    <div className="flex justify-between items-center">
                      <span className="text-paper-faint">Location:</span>
                      <span className="mono text-paper font-medium">{selectedRegionData.location}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-paper-faint">Area:</span>
                      <span className="text-paper font-medium">{selectedRegionData.area}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-paper-faint">Time window:</span>
                      <span className="mono text-paper">{selectedRegionData.timeWindow}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-paper-faint">Risk:</span>
                      <span className="mono text-paper font-semibold text-critical-400">{selectedRegionData.risk}%</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-paper-faint">Linked complaints:</span>
                      <span className="mono text-paper">{selectedRegionData.linkedComplaints}</span>
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-paper-faint font-medium mb-1">Action recommended:</div>
                    <div className="text-xs text-paper bg-panel-raised p-2.5 rounded border border-line-soft leading-relaxed">
                      {selectedRegionData.actionRecommended}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-paper-faint">Click a marker or zone on the map to see details here.</div>
              )}
            </div>
          </Panel>

          {Object.keys(predictions).length > 0 && (
            <Panel>
              <PanelHeader title="Active Predictions" />
              <div className="divide-y divide-line-soft">
                {Object.values(predictions).map((p) => (
                  <div
                    key={p.complaintId}
                    onClick={() => setSelectedRegionId(p.zone)}
                    className="px-5 py-3 cursor-pointer hover:bg-panel-raised transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-paper mono">{p.complaintId}</span>
                      <RiskBadge risk={p.risk} />
                    </div>
                    <div className="text-xs text-paper-faint mt-1">
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

