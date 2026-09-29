import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import { useAppState } from '../state/AppState'
import { ALL_FRAUD_TYPES, zoneById } from '../data/mockData'
import { Panel, RiskBadge, StatusBadge, TableScroll, formatINR, EmptyState } from '../components/ui/Primitives'
import type { ComplaintStatus, RiskLevel } from '../types'

type SortKey = 'newest' | 'amount-desc' | 'amount-asc' | 'risk'

const RISK_ORDER: Record<RiskLevel, number> = { CRITICAL: 3, HIGH: 2, MEDIUM: 1, LOW: 0 }

export default function Complaints() {
  const { complaints, selectComplaint } = useAppState()
  const navigate = useNavigate()

  const [query, setQuery] = useState('')
  const [fraudFilter, setFraudFilter] = useState<string>('ALL')
  const [riskFilter, setRiskFilter] = useState<string>('ALL')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [sort, setSort] = useState<SortKey>('newest')

  const filtered = useMemo(() => {
    let list = complaints.filter((c) => {
      const q = query.trim().toLowerCase()
      const matchesQuery =
        !q ||
        c.id.toLowerCase().includes(q) ||
        c.fraudType.toLowerCase().includes(q) ||
        c.victimCity.toLowerCase().includes(q) ||
        zoneById(c.victimZone).name.toLowerCase().includes(q) ||
        c.bank.toLowerCase().includes(q)
      const matchesFraud = fraudFilter === 'ALL' || c.fraudType === fraudFilter
      const matchesRisk = riskFilter === 'ALL' || c.risk === riskFilter
      const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter
      return matchesQuery && matchesFraud && matchesRisk && matchesStatus
    })

    list = [...list].sort((a, b) => {
      if (sort === 'newest') return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      if (sort === 'amount-desc') return b.amount - a.amount
      if (sort === 'amount-asc') return a.amount - b.amount
      if (sort === 'risk') return RISK_ORDER[b.risk] - RISK_ORDER[a.risk]
      return 0
    })

    return list
  }, [complaints, query, fraudFilter, riskFilter, statusFilter, sort])

  function openComplaint(id: string) {
    selectComplaint(id)
    navigate('/intelligence')
  }

  const statuses: ComplaintStatus[] = ['NEW', 'ANALYZING', 'PREDICTED', 'DISPATCHED', 'RESOLVED']
  const risks: RiskLevel[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-medium tracking-tight">Complaints</h1>
        <p className="text-sm text-paper-faint mt-1">{filtered.length} of {complaints.length} complaints shown</p>
      </div>

      <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3">
        <div className="relative flex-1 min-w-0 sm:min-w-[220px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-paper-faint" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by ID, fraud type, zone or bank"
            className="w-full bg-panel border border-line rounded-md pl-9 pr-3 py-2 text-sm text-paper placeholder:text-paper-faint focus:outline-none focus:border-paper-faint"
          />
        </div>
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-3">
          <select value={fraudFilter} onChange={(e) => setFraudFilter(e.target.value)} className="bg-panel border border-line rounded-md px-3 py-2.5 sm:py-2 text-sm text-paper-dim focus:outline-none focus:border-paper-faint">
            <option value="ALL">All fraud types</option>
            {ALL_FRAUD_TYPES.map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
          <select value={riskFilter} onChange={(e) => setRiskFilter(e.target.value)} className="bg-panel border border-line rounded-md px-3 py-2.5 sm:py-2 text-sm text-paper-dim focus:outline-none focus:border-paper-faint">
            <option value="ALL">All risk levels</option>
            {risks.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="bg-panel border border-line rounded-md px-3 py-2.5 sm:py-2 text-sm text-paper-dim focus:outline-none focus:border-paper-faint">
            <option value="ALL">All statuses</option>
            {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className="bg-panel border border-line rounded-md px-3 py-2.5 sm:py-2 text-sm text-paper-dim focus:outline-none focus:border-paper-faint">
            <option value="newest">Newest first</option>
            <option value="amount-desc">Amount: high to low</option>
            <option value="amount-asc">Amount: low to high</option>
            <option value="risk">Risk: highest first</option>
          </select>
        </div>
      </div>

      <Panel>
        {filtered.length === 0 ? (
          <EmptyState title="No complaints match your filters" detail="Try clearing a filter or searching a different term." />
        ) : (
          <TableScroll>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-paper-faint border-b border-line-soft">
                  <th className="px-5 py-2.5 font-normal">Complaint ID</th>
                  <th className="px-3 py-2.5 font-normal">Fraud Type</th>
                  <th className="px-3 py-2.5 font-normal">Amount</th>
                  <th className="px-3 py-2.5 font-normal">Victim Zone</th>
                  <th className="px-3 py-2.5 font-normal">Bank</th>
                  <th className="px-3 py-2.5 font-normal">Risk</th>
                  <th className="px-5 py-2.5 font-normal">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => openComplaint(c.id)}
                    className="border-b border-line-soft last:border-0 hover:bg-panel-raised cursor-pointer transition-colors"
                  >
                    <td className="px-5 py-2.5 mono text-paper">{c.id}</td>
                    <td className="px-3 py-2.5 text-paper-dim">{c.fraudType}</td>
                    <td className="px-3 py-2.5 mono text-paper-dim">{formatINR(c.amount)}</td>
                    <td className="px-3 py-2.5 text-paper-dim">{zoneById(c.victimZone).name}</td>
                    <td className="px-3 py-2.5 text-paper-dim">{c.bank}</td>
                    <td className="px-3 py-2.5"><RiskBadge risk={c.risk} /></td>
                    <td className="px-5 py-2.5"><StatusBadge status={c.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableScroll>
        )}
      </Panel>
    </div>
  )
}
