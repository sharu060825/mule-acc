import type { ReactNode } from 'react'
import type { AlertStatus, ComplaintStatus, RiskLevel } from '../../types'

export function Panel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`bg-[#FFFFFF] border border-[#D6D6D0] rounded-md shadow-sm ${className}`}>
      {children}
    </div>
  )
}

export function PanelHeader({ title, action, subtitle }: { title: string; action?: ReactNode; subtitle?: string }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 px-5 py-4 border-b border-[#D6D6D0] bg-[#FFFFFF]">
      <div>
        <h3 className="text-lg sm:text-[20px] font-bold text-[#000000] tracking-tight">{title}</h3>
        {subtitle && <p className="text-sm text-[#222222] font-medium mt-0.5">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

const RISK_STYLES: Record<RiskLevel, string> = {
  LOW: 'bg-[#F0FDF4] text-[#166534] border-[#BBF7D0]',
  MEDIUM: 'bg-[#FFFBEB] text-[#92400E] border-[#FDE68A]',
  HIGH: 'bg-[#FEF2F2] text-[#B91C1C] border-[#FCA5A5]',
  CRITICAL: 'bg-[#FEF2F2] text-[#991B1B] border-[#FCA5A5] font-bold',
}

export function RiskBadge({ risk }: { risk: RiskLevel }) {
  return (
    <span className={`inline-flex items-center rounded border px-2.5 py-1 text-xs font-semibold mono ${RISK_STYLES[risk]}`}>
      {risk}
    </span>
  )
}

const STATUS_STYLES: Record<ComplaintStatus, string> = {
  NEW: 'bg-[#F0F0EC] text-[#111111] border-[#D6D6D0]',
  ANALYZING: 'bg-[#DCE5EA] text-[#102B3F] border-[#1F4057]/40',
  PREDICTED: 'bg-[#E8E3D8] text-[#111111] border-[#D6D6D0]',
  DISPATCHED: 'bg-[#102B3F] text-[#FFFFFF] border-[#102B3F]',
  RESOLVED: 'bg-[#F0FDF4] text-[#166534] border-[#BBF7D0]',
}

export function StatusBadge({ status }: { status: ComplaintStatus }) {
  return (
    <span className={`inline-flex items-center rounded border px-2.5 py-1 text-xs font-semibold mono ${STATUS_STYLES[status]}`}>
      {status}
    </span>
  )
}

const ALERT_STATUS_STYLES: Record<AlertStatus, string> = {
  PREPARED: 'bg-[#F0F0EC] text-[#222222] border-[#D6D6D0]',
  DISPATCHED: 'bg-[#102B3F] text-[#FFFFFF] border-[#102B3F]',
  ACKNOWLEDGED: 'bg-[#E8E3D8] text-[#111111] border-[#D6D6D0]',
}

export function AlertStatusBadge({ status }: { status: AlertStatus }) {
  return (
    <span className={`inline-flex items-center rounded border px-2.5 py-1 text-xs font-semibold mono ${ALERT_STATUS_STYLES[status]}`}>
      {status}
    </span>
  )
}

export function Metric({ label, value, tone = 'default' }: { label: string; value: string | number; tone?: 'default' | 'critical' | 'ok' | 'intel' }) {
  const toneClass = {
    default: 'text-[#000000]',
    critical: 'text-[#991B1B]',
    ok: 'text-[#166534]',
    intel: 'text-[#102B3F]',
  }[tone]
  return (
    <div className="bg-[#FFFFFF] border border-[#D6D6D0] rounded-md px-4 py-3.5 sm:px-5 sm:py-4 shadow-sm">
      <div className="text-xs sm:text-sm font-semibold text-[#222222] mb-1">{label}</div>
      <div className={`text-2xl sm:text-3xl font-bold mono ${toneClass}`}>{value}</div>
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
  variant?: 'primary' | 'secondary' | 'critical' | 'ghost' | 'outline'
  disabled?: boolean
  className?: string
  type?: 'button' | 'submit'
}) {
  const base = 'inline-flex items-center justify-center gap-2 rounded px-4 py-2.5 text-sm sm:text-[15px] font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer'
  const styles = {
    primary: 'bg-[#102B3F] text-[#FFFFFF] hover:bg-[#1F4057] border border-[#102B3F]',
    secondary: 'bg-[#E8E3D8] text-[#111111] border border-[#D6D6D0] hover:bg-[#DCE5EA]',
    outline: 'bg-[#FFFFFF] border border-[#1F4057] text-[#1F4057] hover:bg-[#F0F0EC]',
    critical: 'bg-[#991B1B] text-[#FFFFFF] hover:bg-[#7F1D1D]',
    ghost: 'text-[#111111] hover:bg-[#F0F0EC]',
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
    <div className="flex flex-col items-center justify-center text-center py-16 px-6 bg-[#FFFFFF] border border-[#D6D6D0] rounded-md">
      <div className="w-10 h-10 rounded-full border border-[#D6D6D0] bg-[#F0F0EC] mb-4" />
      <div className="text-base font-bold text-[#000000] mb-1">{title}</div>
      <div className="text-sm text-[#222222] font-medium max-w-sm">{detail}</div>
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

