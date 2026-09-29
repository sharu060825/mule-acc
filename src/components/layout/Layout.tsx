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

function Brand({ light = false }: { light?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`w-9 h-9 rounded flex items-center justify-center shrink-0 ${light ? 'bg-[#102B3F] text-[#FFFFFF]' : 'bg-[#1F4057] text-[#FFFFFF]'}`}>
        <ShieldAlert size={20} strokeWidth={2.2} />
      </div>
      <div>
        <div className={`text-base font-bold tracking-tight leading-none ${light ? 'text-[#000000]' : 'text-[#FFFFFF]'}`}>CyBlock</div>
        <div className={`text-xs mt-1 mono font-medium ${light ? 'text-[#222222]' : 'text-[#DCE5EA]'}`}>Predictive Cybercrime Unit</div>
      </div>
    </div>
  )
}

function NavList({ onNavigate, light = false }: { onNavigate?: () => void; light?: boolean }) {
  return (
    <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
      {NAV.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={onNavigate}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3.5 py-2.5 rounded text-[15px] transition-colors font-medium ${
              light
                ? isActive
                  ? 'bg-[#E8E3D8] text-[#000000] font-bold border border-[#D6D6D0]'
                  : 'text-[#222222] hover:text-[#000000] hover:bg-[#F0F0EC]'
                : isActive
                ? 'bg-[#1F4057] text-[#FFFFFF] font-bold border border-[#1F4057]'
                : 'text-[#DCE5EA] hover:text-[#FFFFFF] hover:bg-[#1F4057]/60'
            }`
          }
        >
          <Icon size={18} strokeWidth={2} className="shrink-0" />
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
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#F7F7F5] text-[#111111]">
      {/* Desktop sidebar — dark section #102B3F */}
      <aside className="hidden lg:flex w-64 shrink-0 border-r border-[#102B3F] bg-[#102B3F] flex-col">
        <div className="px-5 py-5 border-b border-[#1F4057]">
          <Brand />
        </div>
        <NavList />
        <div className="px-5 py-4 border-t border-[#1F4057] text-xs text-[#DCE5EA]/80 leading-relaxed font-medium">
          Frontend prototype running on mock data. No live bank or law-enforcement systems are connected.
        </div>
      </aside>

      {/* Mobile / tablet top bar */}
      <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-[#D6D6D0] bg-[#FFFFFF] px-4 py-3 shadow-sm">
        <Brand light />
        <button
          onClick={() => setMenuOpen(true)}
          aria-label="Open navigation menu"
          className="flex items-center justify-center w-10 h-10 rounded-md border border-[#D6D6D0] text-[#111111] hover:bg-[#F0F0EC] shrink-0"
        >
          <Menu size={20} />
        </button>
      </header>

      {/* Mobile slide-over drawer */}
      {menuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMenuOpen(false)} aria-hidden="true" />
          <div className="relative w-72 max-w-[85vw] bg-[#102B3F] text-[#FFFFFF] border-r border-[#1F4057] flex flex-col h-full shadow-2xl">
            <div className="px-5 py-5 border-b border-[#1F4057] flex items-center justify-between gap-3">
              <Brand />
              <button
                onClick={() => setMenuOpen(false)}
                aria-label="Close navigation menu"
                className="flex items-center justify-center w-9 h-9 rounded-md border border-[#1F4057] text-[#FFFFFF] hover:bg-[#1F4057] shrink-0"
              >
                <X size={18} />
              </button>
            </div>
            <NavList onNavigate={() => setMenuOpen(false)} />
            <div className="px-5 py-4 border-t border-[#1F4057] text-xs text-[#DCE5EA]/80 leading-relaxed font-medium">
              Frontend prototype running on mock data. No live bank or law-enforcement systems are connected.
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 min-w-0 overflow-y-auto bg-[#F7F7F5]">
        <div className="max-w-[1400px] mx-auto px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-7">{children}</div>
      </main>

      {toast && (
        <div className="fixed bottom-4 right-4 left-4 sm:left-auto sm:bottom-6 sm:right-6 z-50 bg-[#FFFFFF] border border-[#D6D6D0] rounded-md px-4 py-3 shadow-md flex items-center gap-3 sm:max-w-sm">
          <span className="w-2.5 h-2.5 rounded-full bg-[#15803D] shrink-0" />
          <span className="text-sm font-semibold text-[#111111]">{toast}</span>
        </div>
      )}
    </div>
  )
}

