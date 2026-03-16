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
  const { status, submitted , queued} = await searchParams
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
    { key: 'all',          label: 'All' },
    { key: 'pending',      label: 'Pending' },
    { key: 'under_review', label: 'Under Review' },
    { key: 'approved',     label: 'Approved' },
    { key: 'flagged',      label: 'Flagged' },
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

      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Submissions</h1>
          <p className="mt-1 text-slate-500">
            {isContractor
              ? 'Your progress photo submissions and their review status.'
              : 'All contractor submissions requiring review.'}
          </p>
        </div>
        {isContractor && (
          <Link
            href="/submissions/new"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            New Submission
          </Link>
        )}
      </div>

      {/* Status filter tabs */}
      <div className="mb-6 flex gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-slate-50 p-1">
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
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'}
              `}
            >
              {tab.label}
              {count > 0 && (
                <span className={`rounded-full px-1.5 py-0.5 text-xs ${
                  active ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-500'
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
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 py-16 text-center">
          <Inbox className="mb-3 h-10 w-10 text-slate-300" />
          <p className="font-medium text-slate-600">No submissions yet</p>
          <p className="mt-1 text-sm text-slate-400">
            {isContractor ? 'Upload your first progress photos to get started.' : 'No submissions match this filter.'}
          </p>
          {isContractor && (
            <Link
              href="/submissions/new"
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              New Submission
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {submissions.map(sub => (
            <SubmissionCard key={sub.id} submission={sub} />
          ))}
        </div>
      )}
    </div>
  )
}