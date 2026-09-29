import { useEffect, useState, type ReactNode } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutGrid,
  FileWarning,
  ScanSearch,
  Radar,
  Map as MapIcon,
  Radio,
  BarChart3,
  ShieldAlert,
  Menu,
  X,
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

function Brand() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-8 h-8 rounded bg-intel-600 flex items-center justify-center shrink-0">
        <ShieldAlert size={17} className="text-white" strokeWidth={2.2} />
      </div>
      <div>
        <div className="text-sm font-semibold tracking-tight leading-none">CyBlock</div>
        <div className="text-[0.65rem] text-paper-faint mt-1 mono">Predictive Cybercrime Unit</div>
      </div>
    </div>
  )
}

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
      {NAV.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={onNavigate}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 lg:py-2 rounded text-sm transition-colors ${
              isActive ? 'bg-panel-raised text-paper border border-line' : 'text-paper-dim hover:text-paper hover:bg-panel'
            }`
          }
        >
          <Icon size={16} strokeWidth={2} className="shrink-0" />
          {label}
        </NavLink>
      ))}
    </nav>
  )
}

export default function Layout({ children }: { children: ReactNode }) {
  const { toast, clearToast } = useAppState()
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(clearToast, 3400)
    return () => clearTimeout(t)
  }, [toast, clearToast])

  // Close the mobile drawer whenever the route changes.
  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  // Lock body scroll while the mobile drawer is open.
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [menuOpen])

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-ink text-paper">
      {/* Desktop sidebar — unchanged, visible at lg and up */}
      <aside className="hidden lg:flex w-60 shrink-0 border-r border-line-soft flex-col">
        <div className="px-5 py-5 border-b border-line-soft">
          <Brand />
        </div>
        <NavList />
        <div className="px-5 py-4 border-t border-line-soft text-[0.65rem] text-paper-faint leading-relaxed">
          Frontend prototype running on mock data. No live bank or law-enforcement systems are connected.
        </div>
      </aside>

      {/* Mobile / tablet top bar */}
      <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-line-soft bg-ink px-4 py-3">
        <Brand />
        <button
          onClick={() => setMenuOpen(true)}
          aria-label="Open navigation menu"
          className="flex items-center justify-center w-10 h-10 rounded-md border border-line text-paper hover:bg-panel-raised shrink-0"
        >
          <Menu size={20} />
        </button>
      </header>

      {/* Mobile slide-over drawer */}
      {menuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMenuOpen(false)} aria-hidden="true" />
          <div className="relative w-72 max-w-[85vw] bg-ink border-r border-line-soft flex flex-col h-full shadow-xl">
            <div className="px-5 py-5 border-b border-line-soft flex items-center justify-between gap-3">
              <Brand />
              <button
                onClick={() => setMenuOpen(false)}
                aria-label="Close navigation menu"
                className="flex items-center justify-center w-9 h-9 rounded-md border border-line text-paper hover:bg-panel-raised shrink-0"
              >
                <X size={18} />
              </button>
            </div>
            <NavList onNavigate={() => setMenuOpen(false)} />
            <div className="px-5 py-4 border-t border-line-soft text-[0.65rem] text-paper-faint leading-relaxed">
              Frontend prototype running on mock data. No live bank or law-enforcement systems are connected.
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 min-w-0 overflow-y-auto">
        <div className="max-w-[1400px] mx-auto px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-7">{children}</div>
      </main>

      {toast && (
        <div className="fixed bottom-4 right-4 left-4 sm:left-auto sm:bottom-6 sm:right-6 z-50 bg-panel-raised border border-line rounded-md px-4 py-3 shadow-lg flex items-center gap-3 sm:max-w-sm animate-[fadein_0.2s_ease-out]">
          <span className="w-2 h-2 rounded-full bg-ok-400 shrink-0" />
          <span className="text-sm text-paper">{toast}</span>
        </div>
      )}
    </div>
  )
}
