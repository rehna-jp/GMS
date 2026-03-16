// components/dashboard/SubmissionsChart.tsx
'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart,
  Line, Legend,
} from 'recharts'

// ── Submissions by Status — Donut ─────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  pending:      '#3b82f6',
  under_review: '#f59e0b',
  approved:     '#10b981',
  flagged:      '#ef4444',
}

const STATUS_LABELS: Record<string, string> = {
  pending:      'Pending',
  under_review: 'Under Review',
  approved:     'Approved',
  flagged:      'Flagged',
}

interface StatusData { status: string; count: number }

export function SubmissionStatusChart({ data }: { data: StatusData[] }) {
  const total = data.reduce((sum, d) => sum + d.count, 0)

  if (total === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-slate-400">
        No submissions yet
      </div>
    )
  }

  return (
    <div className="flex items-center gap-6">
      <ResponsiveContainer width={160} height={160}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={45}
            outerRadius={70}
            dataKey="count"
            strokeWidth={2}
            stroke="#fff"
          >
            {data.map((entry) => (
              <Cell key={entry.status} fill={STATUS_COLORS[entry.status] ?? '#94a3b8'} />
            ))}
          </Pie>
          <Tooltip
  content={({ active, payload }) => {
    if (!active || !payload?.length) return null
    const item = payload[0]
    return (
      <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-md">
        <p className="font-semibold text-slate-700">
          {STATUS_LABELS[item.name as string] ?? item.name}
        </p>
        <p className="text-slate-500">{item.value} submissions</p>
      </div>
    )
  }}
/>
        </PieChart>
      </ResponsiveContainer>

      <div className="flex-1 space-y-2">
        {data.map(d => (
          <div key={d.status} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="h-2.5 w-2.5 rounded-full"
                style={{ background: STATUS_COLORS[d.status] ?? '#94a3b8' }}
              />
              <span className="text-xs text-slate-600">{STATUS_LABELS[d.status] ?? d.status}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-800">{d.count}</span>
              <span className="text-xs text-slate-400">
                {total > 0 ? `${Math.round((d.count / total) * 100)}%` : '0%'}
              </span>
            </div>
          </div>
        ))}
        <div className="mt-2 border-t border-slate-100 pt-2 flex justify-between text-xs">
          <span className="text-slate-400">Total</span>
          <span className="font-bold text-slate-700">{total}</span>
        </div>
      </div>
    </div>
  )
}

// ── Projects by Region — Horizontal Bar ───────────────────────────────────────

interface RegionData { region: string; count: number }

export function ProjectsByRegionChart({ data }: { data: RegionData[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-slate-400">
        No project data yet
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16, top: 4, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
        <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
        <YAxis
          type="category"
          dataKey="region"
          tick={{ fontSize: 11, fill: '#64748b' }}
          tickLine={false}
          axisLine={false}
          width={90}
        />
        <Tooltip
          cursor={{ fill: '#f8fafc' }}
          contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}
        />
        <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} maxBarSize={20} name="Projects" />
      </BarChart>
    </ResponsiveContainer>
  )
}

// ── Monthly Submission Trend — Line ───────────────────────────────────────────

interface TrendData {
  label: string
  total: number
  approved: number
  flagged: number
}

export function SubmissionTrendChart({ data }: { data: TrendData[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-slate-400">
        Not enough data yet
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data} margin={{ left: 0, right: 8, top: 4, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
        <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} width={28} />
        <Tooltip
          contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}
        />
        <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
        <Line
          type="monotone"
          dataKey="total"
          stroke="#3b82f6"
          strokeWidth={2}
          dot={{ r: 3, fill: '#3b82f6' }}
          name="Total"
        />
        <Line
          type="monotone"
          dataKey="approved"
          stroke="#10b981"
          strokeWidth={2}
          dot={{ r: 3, fill: '#10b981' }}
          name="Approved"
        />
        <Line
          type="monotone"
          dataKey="flagged"
          stroke="#ef4444"
          strokeWidth={2}
          dot={{ r: 3, fill: '#ef4444' }}
          name="Flagged"
        />
      </LineChart>
    </ResponsiveContainer>
  )
}