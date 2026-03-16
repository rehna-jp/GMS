// components/tips/TipActionButton.tsx
'use client'

import { useState } from 'react'
import { updateTipStatus } from '@/lib/actions/tips'
import { Loader2, Eye, CheckCircle2, XCircle } from 'lucide-react'

export function TipActionButton({
  tipId,
  currentStatus,
}: {
  tipId: string
  currentStatus: string
}) {
  const [loading, setLoading] = useState(false)

  const handle = async (status: 'under_review' | 'actioned' | 'dismissed') => {
    setLoading(true)
    await updateTipStatus(tipId, status)
    setLoading(false)
  }

  if (loading) {
    return <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {currentStatus === 'new' && (
        <button
          onClick={() => handle('under_review')}
          className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100 transition-colors"
        >
          <Eye className="h-3.5 w-3.5" />
          Mark Under Review
        </button>
      )}
      <button
        onClick={() => handle('actioned')}
        className="inline-flex items-center gap-1.5 rounded-lg border border-green-200 bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-100 transition-colors"
      >
        <CheckCircle2 className="h-3.5 w-3.5" />
        Mark Actioned
      </button>
      <button
        onClick={() => handle('dismissed')}
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
      >
        <XCircle className="h-3.5 w-3.5" />
        Dismiss
      </button>
    </div>
  )
}