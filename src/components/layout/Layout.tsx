import { useEffect, type ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutGrid,
  FileWarning,
  ScanSearch,
  Radar,
  Map as MapIcon,
  Radio,
  BarChart3,
  ShieldAlert,
} from 'lucide-react'
import { useAppState } from '../../state/AppState'

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutGrid, end: true },
  { to: '/complaints', label: 'Complaints', icon: FileWarning },
  { to: '/intelligence', label: 'Intelligence', icon: ScanSearch },
  { to: '/predictions', label: 'Predictions', icon: Radar },
  { to: '/map', label: 'GIS Map', icon: MapIcon },
  { to: '/alerts', label: 'Alerts & Dispatch', icon: Radio },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
]

export default function Layout({ children }: { children: ReactNode }) {
  const { toast, clearToast } = useAppState()

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(clearToast, 3400)
    return () => clearTimeout(t)
  }, [toast, clearToast])

  return (
    <div className="min-h-screen flex bg-ink text-paper">
      <aside className="w-60 shrink-0 border-r border-line-soft flex flex-col">
        <div className="px-5 py-5 border-b border-line-soft flex items-center gap-2.5">
          <div className="w-8 h-8 rounded bg-intel-600 flex items-center justify-center">
            <ShieldAlert size={17} className="text-white" strokeWidth={2.2} />
          </div>
          <div>
            <div className="text-sm font-semibold tracking-tight leading-none">Cash-Out Intel</div>
            <div className="text-[0.65rem] text-paper-faint mt-1 mono">Predictive Cybercrime Unit</div>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded text-sm transition-colors ${
                  isActive ? 'bg-panel-raised text-paper border border-line' : 'text-paper-dim hover:text-paper hover:bg-panel'
                }`
              }
            >
              <Icon size={16} strokeWidth={2} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="px-5 py-4 border-t border-line-soft text-[0.65rem] text-paper-faint leading-relaxed">
          Frontend prototype running on mock data. No live bank or law-enforcement systems are connected.
        </div>
      </aside>

      <main className="flex-1 min-w-0 overflow-y-auto">
        <div className="max-w-[1400px] mx-auto px-8 py-7">{children}</div>
      </main>

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-panel-raised border border-line rounded-md px-4 py-3 shadow-lg flex items-center gap-3 max-w-sm animate-[fadein_0.2s_ease-out]">
          <span className="w-2 h-2 rounded-full bg-ok-400 shrink-0" />
          <span className="text-sm text-paper">{toast}</span>
        </div>
      )}
    </div>
  )
}
