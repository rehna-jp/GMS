// app/(dashboard)/submissions/page.tsx
import { getSubmissions } from '@/lib/actions/submissions'
import { SubmissionCard } from '@/components/submissions/SubmissionCard'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, Inbox } from 'lucide-react'

interface PageProps {
  searchParams: Promise<{ status?: string; submitted?: string; queued?: string }>
}

export default async function SubmissionsPage({ searchParams }: PageProps) {
  const { status, submitted, queued } = await searchParams
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user?.id ?? '')
    .single()

  const { data: submissions, error } = await getSubmissions({ status })

  const isContractor = profile?.role === 'contractor'

  const STATUS_TABS = [
    { key: 'all', label: 'All' },
    { key: 'pending', label: 'Pending' },
    { key: 'under_review', label: 'Under Review' },
    { key: 'approved', label: 'Approved' },
    { key: 'flagged', label: 'Flagged' },
  ]

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Success toast */}
      {submitted && (
        <div className="mb-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-800">
          ✅ Submission received! An official will review it shortly.
        </div>
      )}
      {/* ADD THIS RIGHT HERE */}
      {queued === 'true' && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
          📶 Photos saved offline. They will upload automatically when network returns.
        </div>
      )}

      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-blue-800 px-6 py-8 text-white shadow-lg mb-6">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 70% 50%, white 1px, transparent 1px)', backgroundSize: '24px 24px' }}
        />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-blue-200 uppercase tracking-wider mb-1">Review Portal</p>
            <h1 className="text-2xl font-bold">Submissions</h1>
            <p className="mt-1 text-blue-200 text-sm">
              {isContractor
                ? 'Your progress photo submissions and their review status.'
                : 'All contractor submissions requiring review.'}
            </p>
          </div>
          {isContractor && (
            <Link
              href="/submissions/new"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-white/15 backdrop-blur-sm border border-white/25 px-4 py-2 text-sm font-semibold text-white hover:bg-white/25 shadow-sm transition-all"
            >
              <Plus className="h-4 w-4" />
              New Submission
            </Link>
          )}
        </div>
      </div>

      {/* Status filter tabs */}
      <div className="mb-6 flex gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm p-1 custom-scrollbar">
        {STATUS_TABS.map(tab => {
          const active = (status ?? 'all') === tab.key
          const count = tab.key === 'all'
            ? submissions?.length ?? 0
            : submissions?.filter(s => s.status === tab.key).length ?? 0

          return (
            <Link
              key={tab.key}
              href={tab.key === 'all' ? '/submissions' : `/submissions?status=${tab.key}`}
              className={`
                flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all
                ${active
                  ? 'bg-primary/10 text-primary font-semibold shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}
              `}
            >
              {tab.label}
              {count > 0 && (
                <span className={`rounded-full px-1.5 py-0.5 text-xs ${active ? 'bg-primary text-white shadow-sm font-bold' : 'bg-slate-100 text-slate-600'
                  }`}>
                  {count}
                </span>
              )}
            </Link>
          )
        })}
      </div>

      {/* Content */}
      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700">
          Failed to load submissions: {error}
        </div>
      ) : !submissions || submissions.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 py-16 text-center bg-white shadow-sm">
          <Inbox className="mb-3 h-10 w-10 text-slate-300" />
          <p className="font-medium text-slate-600">No submissions yet</p>
          <p className="mt-1 text-sm text-slate-400">
            {isContractor ? 'Upload your first progress photos to get started.' : 'No submissions match this filter.'}
          </p>
          {isContractor && (
            <Link
              href="/submissions/new"
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 shadow-sm transition-colors"
            >
              <Plus className="h-4 w-4" />
              New Submission
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {submissions.map(sub => (
            <SubmissionCard key={sub.id} submission={sub} />
          ))}
        </div>
      )}
    </div>
  )
}