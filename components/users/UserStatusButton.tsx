// components/users/UserStatusButton.tsx
'use client'

import { useState } from 'react'
import { updateUserStatus } from '@/lib/actions/users'
import { Loader2, CheckCircle2, XCircle, RotateCcw } from 'lucide-react'

interface UserStatusButtonProps {
  userId: string
  currentStatus: string
  userName: string
}

export function UserStatusButton({ userId, currentStatus, userName }: UserStatusButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleAction = async (newStatus: 'active' | 'inactive' | 'suspended') => {
    if (!confirm(`Are you sure you want to ${newStatus === 'active' ? 'activate' : newStatus} ${userName}?`)) return
    setLoading(true)
    setError('')

    const result = await updateUserStatus(userId, newStatus)
    if (result.error) setError(result.error)
    setLoading(false)
  }

  if (loading) {
    return <Loader2 className="h-4 w-4 animate-spin text-slate-400 ml-auto" />
  }

  return (
    <div className="flex items-center justify-end gap-1">
      {error && <span className="text-xs text-red-500 mr-2">{error}</span>}

      {currentStatus !== 'active' && (
        <button
          onClick={() => handleAction('active')}
          className="inline-flex items-center gap-1 rounded-lg border border-green-200 bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700 hover:bg-green-100 transition-colors"
        >
          <CheckCircle2 className="h-3 w-3" />
          Activate
        </button>
      )}

      {currentStatus === 'active' && (
        <button
          onClick={() => handleAction('suspended')}
          className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-100 transition-colors"
        >
          <XCircle className="h-3 w-3" />
          Suspend
        </button>
      )}

      {currentStatus === 'suspended' && (
        <button
          onClick={() => handleAction('inactive')}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <RotateCcw className="h-3 w-3" />
          Reset
        </button>
      )}
    </div>
  )
}