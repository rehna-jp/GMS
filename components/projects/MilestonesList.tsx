// components/projects/MilestonesList.tsx
import { Badge } from '@/components/ui/badge'
import { Calendar, DollarSign, CheckCircle, Clock, AlertCircle, Camera } from 'lucide-react'

interface Milestone {
  id: string
  name: string
  description: string
  target_date: string
  budget_allocated: number
  status: string
  completion_percentage: number
  display_order: number
  submission_count?: number // optional — passed from detail page
}

const STATUS_CONFIG: Record<string, { label: string; classes: string }> = {
  pending:      { label: 'Pending',      classes: 'bg-slate-100 text-slate-600 border-slate-200' },
  in_progress:  { label: 'In Progress',  classes: 'bg-blue-100 text-blue-700 border-blue-200' },
  under_review: { label: 'Under Review', classes: 'bg-amber-100 text-amber-700 border-amber-200' },
  approved:     { label: 'Approved',     classes: 'bg-green-100 text-green-700 border-green-200' },
  flagged:      { label: 'Flagged',      classes: 'bg-red-100 text-red-700 border-red-200' },
}

export default function MilestonesList({ milestones }: { milestones: Milestone[] }) {
  if (!milestones || milestones.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No milestones added yet</p>
        <p className="text-sm mt-1">Add milestones to track project progress</p>
      </div>
    )
  }

  const sortedMilestones = [...milestones].sort((a, b) => a.display_order - b.display_order)

  return (
    <div className="space-y-4">
      {sortedMilestones.map((milestone, index) => {
        const statusCfg = STATUS_CONFIG[milestone.status] ?? STATUS_CONFIG.pending
        const isOverdue = new Date(milestone.target_date) < new Date() &&
          milestone.status !== 'approved'

        return (
          <div
            key={milestone.id}
            className={`border rounded-xl p-4 transition-colors hover:bg-gray-50 ${
              isOverdue ? 'border-red-200 bg-red-50/30' : 'border-slate-200'
            }`}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-3 gap-3">
              <div className="flex items-start gap-3">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full font-semibold text-sm shrink-0 ${
                  milestone.status === 'approved'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-blue-100 text-blue-600'
                }`}>
                  {milestone.status === 'approved'
                    ? <CheckCircle className="h-4 w-4" />
                    : index + 1
                  }
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">{milestone.name}</h4>
                  {milestone.description && (
                    <p className="text-sm text-gray-500 mt-0.5">{milestone.description}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {isOverdue && (
                  <span className="text-xs font-medium text-red-600 bg-red-100 border border-red-200 rounded-full px-2 py-0.5">
                    Overdue
                  </span>
                )}
                <span className={`text-xs font-semibold border rounded-full px-2.5 py-0.5 ${statusCfg.classes}`}>
                  {statusCfg.label}
                </span>
              </div>
            </div>

            {/* Progress bar — always visible */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-500">Progress</span>
                <span className="text-xs font-bold text-gray-700">
                  {milestone.completion_percentage}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    milestone.completion_percentage >= 100 ? 'bg-green-500' :
                    milestone.completion_percentage > 0 ? 'bg-blue-500' :
                    'bg-gray-300'
                  }`}
                  style={{ width: `${milestone.completion_percentage}%` }}
                />
              </div>
            </div>

            {/* Metadata grid */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className={`h-4 w-4 shrink-0 ${isOverdue ? 'text-red-400' : 'text-gray-400'}`} />
                <div>
                  <p className="text-xs text-gray-500">Target Date</p>
                  <p className={`font-medium text-xs ${isOverdue ? 'text-red-600' : 'text-gray-700'}`}>
                    {new Date(milestone.target_date).toLocaleDateString('en-GH', {
                      day: 'numeric', month: 'short', year: 'numeric'
                    })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <DollarSign className="h-4 w-4 shrink-0 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Budget</p>
                  <p className="font-medium text-xs text-gray-700">
                    GH₵ {Number(milestone.budget_allocated ?? 0).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <Camera className="h-4 w-4 shrink-0 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Submissions</p>
                  <p className="font-medium text-xs text-gray-700">
                    {milestone.submission_count ?? 0} submitted
                  </p>
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}