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
  zoneById,
} from '../data/mockData'
import { Panel, PanelHeader, RiskBadge, formatINR } from '../components/ui/Primitives'
import type { GeoPoint } from '../types'

const CHENNAI_CENTER: GeoPoint = { lat: 13.03, lng: 80.21 }

function dotIcon(color: string, size = 12, ring = false) {
  return L.divIcon({
    className: '',
    html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};border:2px solid rgba(5,7,10,0.9);${ring ? 'box-shadow:0 0 0 3px ' + color + '55;' : ''}"></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
}

const ICONS = {
  complaint: dotIcon('#f59e0b'),
  complaintCritical: dotIcon('#ef4444', 14, true),
  atm: dotIcon('#3b82f6', 9),
  bank: dotIcon('#22c55e', 10),
  merchant: dotIcon('#a78bfa', 9),
  predicted: dotIcon('#ef4444', 16, true),
}

interface Layers {
  complaints: boolean
  historical: boolean
  predicted: boolean
  atms: boolean
  banks: boolean
  merchants: boolean
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
  const [selected, setSelected] = useState<{ title: string; detail: string } | null>(null)

  const predictedZones = useMemo(() => {
    const zoneIds = new Set(complaints.filter((c) => c.predictedZone).map((c) => c.predictedZone!))
    return Array.from(zoneIds).map((id) => zoneById(id))
  }, [complaints])

  function toggle(key: keyof Layers) {
    setLayers((l) => ({ ...l, [key]: !l[key] }))
  }

  useEffect(() => {
    if (mapFocus) {
      setSelected({ title: mapFocus.label, detail: 'Focused from Predictions' })
      const t = setTimeout(clearMapFocus, 100)
      return () => clearTimeout(t)
    }
  }, [mapFocus, clearMapFocus])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-medium tracking-tight">GIS Map</h1>
        <p className="text-sm text-paper-faint mt-1">Interactive geospatial view of complaints, historical risk, predictions and cash-out infrastructure.</p>
      </div>

      <div className="grid grid-cols-4 gap-6">
        <div className="col-span-3">
          <Panel className="overflow-hidden">
            <div className="h-[600px] relative">
              <MapContainer center={[CHENNAI_CENTER.lat, CHENNAI_CENTER.lng]} zoom={12} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                <FocusHandler focus={mapFocus} />

                {layers.historical &&
                  HIGH_RISK_ZONES.map((z) => (
                    <Circle
                      key={`hist-${z.zone}`}
                      center={[z.center.lat, z.center.lng]}
                      radius={500 + z.historicalActivity * 8}
                      pathOptions={{
                        color: z.risk === 'CRITICAL' || z.risk === 'HIGH' ? '#ef4444' : '#f59e0b',
                        fillColor: z.risk === 'CRITICAL' || z.risk === 'HIGH' ? '#ef4444' : '#f59e0b',
                        fillOpacity: 0.08,
                        weight: 1,
                      }}
                      eventHandlers={{
                        click: () => setSelected({ title: `${zoneById(z.zone).name} — Historical Risk`, detail: `${z.historicalActivity} historical incidents · ${z.risk} risk` }),
                      }}
                    />
                  ))}

                {layers.predicted &&
                  predictedZones.map((z) => (
                    <Circle
                      key={`pred-${z.id}`}
                      center={[z.center.lat, z.center.lng]}
                      radius={700}
                      pathOptions={{ color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.18, weight: 2, dashArray: '4 4' }}
                      eventHandlers={{
                        click: () => setSelected({ title: `${z.name} — Predicted Cash-Out Zone`, detail: 'Active prediction targeting this zone' }),
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
                        click: () => setSelected({ title: c.id, detail: `${c.fraudType} · ${formatINR(c.amount)} · ${c.risk} risk` }),
                      }}
                    >
                      <Popup>
                        <div className="text-xs">
                          <div className="font-medium">{c.id}</div>
                          <div>{c.fraudType} · {formatINR(c.amount)}</div>
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
                      eventHandlers={{ click: () => setSelected({ title: a.name, detail: `${a.id} · ${a.density} density` }) }}
                    />
                  ))}

                {layers.banks &&
                  BANK_BRANCHES.map((b) => (
                    <Marker
                      key={b.id}
                      position={[b.location.lat, b.location.lng]}
                      icon={ICONS.bank}
                      eventHandlers={{ click: () => setSelected({ title: b.name, detail: b.id }) }}
                    />
                  ))}

                {layers.merchants &&
                  MERCHANT_POINTS.map((m) => (
                    <Marker
                      key={m.id}
                      position={[m.location.lat, m.location.lng]}
                      icon={ICONS.merchant}
                      eventHandlers={{ click: () => setSelected({ title: m.name, detail: m.category }) }}
                    />
                  ))}
              </MapContainer>
            </div>
          </Panel>
        </div>

        <div className="space-y-4">
          <Panel>
            <PanelHeader title="Map Layers" />
            <div className="px-5 py-4 space-y-3">
              {([
                ['complaints', 'Complaints', '#f59e0b'],
                ['historical', 'Historical Risk', '#f59e0b'],
                ['predicted', 'Predicted Risk', '#ef4444'],
                ['atms', 'ATMs', '#3b82f6'],
                ['banks', 'Bank Branches', '#22c55e'],
                ['merchants', 'Merchant Cash-Out Points', '#a78bfa'],
              ] as Array<[keyof Layers, string, string]>).map(([key, label, color]) => (
                <label key={key} className="flex items-center justify-between cursor-pointer">
                  <LegendRow color={color} label={label} />
                  <input type="checkbox" checked={layers[key]} onChange={() => toggle(key)} className="accent-intel-500" />
                </label>
              ))}
            </div>
          </Panel>

          <Panel>
            <PanelHeader title="Location Details" />
            <div className="px-5 py-4">
              {selected ? (
                <div>
                  <div className="text-sm text-paper">{selected.title}</div>
                  <div className="text-xs text-paper-faint mt-1">{selected.detail}</div>
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
                  <div key={p.complaintId} className="px-5 py-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-paper mono">{p.complaintId}</span>
                      <RiskBadge risk={p.risk} />
                    </div>
                    <div className="text-xs text-paper-faint mt-1">{zoneById(p.zone).name} · {p.confidence}% confidence</div>
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
