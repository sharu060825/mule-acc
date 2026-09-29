import type { ReactNode } from 'react'
import type { AlertStatus, ComplaintStatus, RiskLevel } from '../../types'

export function Panel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`bg-panel border border-line rounded-md ${className}`}>
      {children}
    </div>
  )
}

export function PanelHeader({ title, action, subtitle }: { title: string; action?: ReactNode; subtitle?: string }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 px-4 py-3.5 sm:px-5 sm:py-4 border-b border-line-soft">
      <div>
        <h3 className="text-sm sm:text-[0.95rem] font-medium text-paper tracking-tight">{title}</h3>
        {subtitle && <p className="text-xs text-paper-faint mt-0.5">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

const RISK_STYLES: Record<RiskLevel, string> = {
  LOW: 'bg-ok-500/10 text-ok-400 border-ok-500/30',
  MEDIUM: 'bg-warn-500/10 text-warn-400 border-warn-500/30',
  HIGH: 'bg-critical-500/10 text-critical-400 border-critical-500/40',
  CRITICAL: 'bg-critical-500/20 text-critical-400 border-critical-500/60',
}

export function RiskBadge({ risk }: { risk: RiskLevel }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-[0.7rem] font-medium mono ${RISK_STYLES[risk]}`}>
      {risk === 'CRITICAL' && <span className="w-1.5 h-1.5 rounded-full bg-critical-400 animate-pulse" />}
      {risk}
    </span>
  )
}

const STATUS_STYLES: Record<ComplaintStatus, string> = {
  NEW: 'bg-paper/10 text-paper border-line',
  ANALYZING: 'bg-intel-500/10 text-intel-400 border-intel-500/30',
  PREDICTED: 'bg-warn-500/10 text-warn-400 border-warn-500/30',
  DISPATCHED: 'bg-critical-500/10 text-critical-400 border-critical-500/40',
  RESOLVED: 'bg-ok-500/10 text-ok-400 border-ok-500/30',
}

export function StatusBadge({ status }: { status: ComplaintStatus }) {
  return (
    <span className={`inline-flex items-center rounded border px-2 py-0.5 text-[0.7rem] font-medium mono ${STATUS_STYLES[status]}`}>
      {status}
    </span>
  )
}

const ALERT_STATUS_STYLES: Record<AlertStatus, string> = {
  PREPARED: 'bg-paper/10 text-paper-dim border-line',
  DISPATCHED: 'bg-intel-500/10 text-intel-400 border-intel-500/30',
  ACKNOWLEDGED: 'bg-ok-500/10 text-ok-400 border-ok-500/30',
}

export function AlertStatusBadge({ status }: { status: AlertStatus }) {
  return (
    <span className={`inline-flex items-center rounded border px-2 py-0.5 text-[0.7rem] font-medium mono ${ALERT_STATUS_STYLES[status]}`}>
      {status}
    </span>
  )
}

export function Metric({ label, value, tone = 'default' }: { label: string; value: string | number; tone?: 'default' | 'critical' | 'ok' | 'intel' }) {
  const toneClass = {
    default: 'text-paper',
    critical: 'text-critical-400',
    ok: 'text-ok-400',
    intel: 'text-intel-400',
  }[tone]
  return (
    <div className="bg-panel border border-line rounded-md px-4 py-3.5 sm:px-5 sm:py-4">
      <div className="text-xs text-paper-faint mb-1.5">{label}</div>
      <div className={`text-xl sm:text-2xl font-medium mono ${toneClass}`}>{value}</div>
    </div>
  )
}

export function Button({
  children,
  onClick,
  variant = 'primary',
  disabled,
  className = '',
  type = 'button',
}: {
  children: ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'critical' | 'ghost'
  disabled?: boolean
  className?: string
  type?: 'button' | 'submit'
}) {
  const base = 'inline-flex items-center justify-center gap-2 rounded px-4 py-2.5 sm:py-2 min-h-[42px] sm:min-h-0 text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed'
  const styles = {
    primary: 'bg-intel-600 text-white hover:bg-intel-500',
    secondary: 'bg-panel-raised text-paper border border-line hover:border-paper-faint',
    critical: 'bg-critical-500 text-white hover:bg-critical-400',
    ghost: 'text-paper-dim hover:text-paper hover:bg-panel-raised',
  }[variant]
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${base} ${styles} ${className}`}>
      {children}
    </button>
  )
}

/** Wraps a wide table so it scrolls horizontally on narrow viewports instead of squeezing columns or overflowing the page. */
export function TableScroll({ children, minWidth = 640 }: { children: ReactNode; minWidth?: number }) {
  return (
    <div className="overflow-x-auto">
      <div style={{ minWidth }}>{children}</div>
    </div>
  )
}

export function EmptyState({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6">
      <div className="w-10 h-10 rounded-full border border-line-soft mb-4" />
      <div className="text-sm text-paper mb-1">{title}</div>
      <div className="text-xs text-paper-faint max-w-sm">{detail}</div>
    </div>
  )
}

export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount)
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false })
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false })
}
