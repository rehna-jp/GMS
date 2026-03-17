// app/(dashboard)/tips/page.tsx
import { createClient } from '@/lib/supabase/server'
import { getTips, getTipStats } from '@/lib/actions/tips'
import { TipActionButton } from '@/components/tips/TipActionButton'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import {
  MessageSquare, AlertTriangle, CheckCircle2,
  XCircle, Clock, MapPin, Tag,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: Promise<{ status?: string }>
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  new: { label: 'New', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: Clock },
  under_review: { label: 'Under Review', color: 'bg-amber-100 text-amber-800 border-amber-200', icon: AlertTriangle },
  actioned: { label: 'Actioned', color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle2 },
  dismissed: { label: 'Dismissed', color: 'bg-slate-100 text-slate-600 border-slate-200', icon: XCircle },
}

const CATEGORY_LABELS: Record<string, string> = {
  corruption: '💰 Corruption',
  poor_quality: '🔨 Poor Quality',
  abandonment: '🚫 Abandonment',
  safety_hazard: '⚠️ Safety Hazard',
  wrong_location: '📍 Wrong Location',
  overpricing: '💸 Overpricing',
  other: '📝 Other',
}

export default async function TipsPage({ searchParams }: PageProps) {
  const { status } = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user?.id ?? '')
    .single()

  if (!['admin', 'official'].includes(profile?.role ?? '')) notFound()

  const [{ data: tips }, stats] = await Promise.all([
    getTips({ status }),
    getTipStats(),
  ])

  const STATUS_TABS = [
    { key: 'all', label: 'All', count: stats.total },
    { key: 'new', label: 'New', count: stats.new },
    { key: 'under_review', label: 'Under Review', count: stats.underReview },
    { key: 'actioned', label: 'Actioned', count: stats.actioned },
    { key: 'dismissed', label: 'Dismissed', count: stats.dismissed },
  ]

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-blue-800 px-6 py-8 text-white shadow-lg mb-8">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 70% 50%, white 1px, transparent 1px)', backgroundSize: '24px 24px' }}
        />
        <div className="relative">
          <p className="text-sm font-medium text-blue-200 uppercase tracking-wider mb-1">Public Reports</p>
          <h1 className="text-2xl font-bold">Citizen Tips</h1>
          <p className="mt-1 text-blue-200 text-sm">
            Anonymous tips submitted by the public about project irregularities
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Total Tips', value: stats.total, color: 'text-slate-600', bg: 'bg-slate-50' },
          { label: 'New', value: stats.new, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Under Review', value: stats.underReview, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Actioned', value: stats.actioned, color: 'text-green-600', bg: 'bg-green-50' },
        ].map(stat => (
          <div key={stat.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm text-center">
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-slate-400 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Status tabs */}
      <div className="mb-6 flex gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-slate-50 p-1">
        {STATUS_TABS.map(tab => {
          const active = (status ?? 'all') === tab.key
          return (
            <Link
              key={tab.key}
              href={tab.key === 'all' ? '/tips' : `/tips?status=${tab.key}`}
              className={`
                flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all
                ${active ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}
              `}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`rounded-full px-1.5 py-0.5 text-xs ${active ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-500'
                  }`}>
                  {tab.count}
                </span>
              )}
            </Link>
          )
        })}
      </div>

      {/* Tips list */}
      {!tips || tips.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 py-16 text-slate-400">
          <MessageSquare className="mb-3 h-10 w-10 opacity-30" />
          <p className="text-sm font-medium">No tips found</p>
          <p className="text-xs mt-1">Citizens haven't submitted any tips yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tips.map((tip: any) => {
            const statusCfg = STATUS_CONFIG[tip.status] ?? STATUS_CONFIG.new
            const StatusIcon = statusCfg.icon

            return (
              <div
                key={tip.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-all"
              >
                {/* Header row */}
                <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono font-bold text-slate-400">
                      {tip.reference_number}
                    </span>
                    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusCfg.color}`}>
                      <StatusIcon className="h-3 w-3" />
                      {statusCfg.label}
                    </span>
                    {tip.category && (
                      <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                        {CATEGORY_LABELS[tip.category] ?? tip.category}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-slate-400">
                    {formatDistanceToNow(new Date(tip.submitted_at), { addSuffix: true })}
                  </span>
                </div>

                {/* Description */}
                <p className="text-sm text-slate-700 leading-relaxed mb-3">
                  {tip.description}
                </p>

                {/* Project link */}
                {tip.projects && (
                  <div className="flex items-center gap-2 mb-4">
                    <MapPin className="h-3.5 w-3.5 text-slate-400" />
                    <Link
                      href={`/projects/${tip.project_id}`}
                      className="text-xs font-medium text-blue-600 hover:text-blue-800"
                    >
                      {tip.projects.project_number} — {tip.projects.name}
                    </Link>
                    <span className="text-xs text-slate-400">·</span>
                    <span className="text-xs text-slate-400">{tip.projects.location_region}</span>
                  </div>
                )}

                {/* Action buttons */}
                {tip.status !== 'actioned' && tip.status !== 'dismissed' && (
                  <TipActionButton tipId={tip.id} currentStatus={tip.status} />
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}