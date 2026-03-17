// components/submissions/ReviewPanel.tsx
'use client'

import { useState, useTransition } from 'react'
import { reviewSubmission, ReviewAction } from '@/lib/actions/reviews'
import { CheckCircle2, XCircle, MessageSquare, Eye, Loader2, AlertTriangle } from 'lucide-react'

interface ReviewPanelProps {
  submissionId: string
  currentStatus: string
  contractorName: string
  onReviewed?: (newStatus: string) => void
}

const ACTIONS: {
  key: ReviewAction
  label: string
  description: string
  icon: React.ElementType
  classes: string
  activeClasses: string
}[] = [
    {
      key: 'under_review',
      label: 'Mark Under Review',
      description: 'Acknowledge receipt and begin reviewing',
      icon: Eye,
      classes: 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-primary/5 hover:border-primary/30 hover:text-primary',
      activeClasses: 'border-primary bg-primary text-white shadow-md',
    },
    {
      key: 'approve',
      label: 'Approve',
      description: 'Work is satisfactory and GPS verified',
      icon: CheckCircle2,
      classes: 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100',
      activeClasses: 'border-green-600 bg-green-600 text-white shadow-md',
    },
    {
      key: 'request_changes',
      label: 'Request Changes',
      description: 'Photos need clarification or more evidence',
      icon: MessageSquare,
      classes: 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100',
      activeClasses: 'border-amber-500 bg-amber-500 text-white shadow-md',
    },
    {
      key: 'flag',
      label: 'Flag as Fraud',
      description: 'GPS mismatch or suspicious activity detected',
      icon: XCircle,
      classes: 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100',
      activeClasses: 'border-red-600 bg-red-600 text-white shadow-md',
    },
  ]

const TERMINAL_STATUSES = ['approved', 'flagged']

export function ReviewPanel({
  submissionId,
  currentStatus,
  contractorName,
  onReviewed,
}: ReviewPanelProps) {
  const [selectedAction, setSelectedAction] = useState<ReviewAction | null>(null)
  const [comment, setComment] = useState('')
  const [isPending, setIsPending] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const isTerminal = TERMINAL_STATUSES.includes(currentStatus)

  const handleSubmit = async () => {
    if (!selectedAction) return
    setError('')
    setIsPending(true)

    try {
      const result = await reviewSubmission({
        submissionId,
        action: selectedAction,
        comment,
      })

      console.log('Review result:', result)

      if (result.error) {
        setError(result.error)
        return
      }

      setSubmitted(true)
      onReviewed?.(result.newStatus ?? selectedAction)

    } catch (err) {
      console.error('Review error:', err)
      setError('An unexpected error occurred.')
    } finally {
      setIsPending(false)
    }
  }

  if (submitted) {
    const action = ACTIONS.find(a => a.key === selectedAction)
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-5 text-center">
        <CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-green-600" />
        <p className="font-semibold text-green-800">Review submitted!</p>
        <p className="mt-1 text-sm text-green-700">
          Submission has been <strong>{action?.label.toLowerCase()}</strong>.
          {contractorName} has been notified.
        </p>
      </div>
    )
  }

  if (isTerminal) {
    const cfg = currentStatus === 'approved'
      ? { icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50 border-green-200', label: 'Approved' }
      : { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50 border-red-200', label: 'Flagged' }
    const Icon = cfg.icon

    return (
      <div className={`rounded-xl border p-5 text-center ${cfg.bg}`}>
        <Icon className={`mx-auto mb-2 h-7 w-7 ${cfg.color}`} />
        <p className={`font-semibold ${cfg.color}`}>
          This submission has been {cfg.label.toLowerCase()}
        </p>
        <p className="mt-1 text-xs text-slate-500">No further review actions available.</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="border-b border-slate-100 bg-slate-50 px-5 py-4">
        <h3 className="font-semibold text-slate-900">Review Decision</h3>
        <p className="mt-0.5 text-xs text-slate-500">
          Select an action and add a comment for {contractorName}
        </p>
      </div>

      <div className="p-5 space-y-5">
        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-2">
          {ACTIONS.map(action => {
            const Icon = action.icon
            const isSelected = selectedAction === action.key

            return (
              <button
                key={action.key}
                onClick={() => setSelectedAction(action.key)}
                className={`
                  flex flex-col items-start gap-1 rounded-xl border-2 p-3 text-left
                  transition-all duration-150
                  ${isSelected ? action.activeClasses : action.classes}
                `}
              >
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="text-sm font-semibold">{action.label}</span>
                </div>
                <p className={`text-xs leading-tight ${isSelected ? 'opacity-90' : 'opacity-70'}`}>
                  {action.description}
                </p>
              </button>
            )
          })}
        </div>

        {/* Fraud warning */}
        {selectedAction === 'flag' && (
          <div className="flex gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>
              Flagging triggers an investigation record. This action is logged in the audit trail
              and cannot be easily undone. Make sure you have sufficient evidence.
            </span>
          </div>
        )}

        {/* Comment */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Comment{' '}
            {selectedAction === 'request_changes' || selectedAction === 'flag' ? (
              <span className="text-red-500">*</span>
            ) : (
              <span className="text-slate-400">(optional)</span>
            )}
          </label>
          <textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
            rows={3}
            placeholder={
              selectedAction === 'approve'
                ? 'Great work — all milestones met…'
                : selectedAction === 'flag'
                  ? 'Describe the suspicious activity or GPS mismatch…'
                  : selectedAction === 'request_changes'
                    ? 'Please provide photos of the north façade…'
                    : 'Add review notes…'
            }
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        {/* Error */}
        {error && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </p>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={
            !selectedAction ||
            isPending ||
            ((selectedAction === 'flag' || selectedAction === 'request_changes') && !comment.trim())
          }
          className="w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isPending ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Submitting review…
            </span>
          ) : (
            'Submit Review'
          )}
        </button>
      </div>
    </div>
  )
}