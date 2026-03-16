// components/projects/MilestonesList.tsx
import { Badge } from '@/components/ui/badge'
import { Calendar, DollarSign, CheckCircle, Clock, AlertCircle } from 'lucide-react'

interface Milestone {
  id: string
  name: string
  description: string
  target_date: string
  budget_allocated: number
  status: string
  completion_percentage: number
  display_order: number
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
      {sortedMilestones.map((milestone, index) => (
        <div
          key={milestone.id}
          className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-semibold text-sm">
                {index + 1}
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">{milestone.name}</h4>
                {milestone.description && (
                  <p className="text-sm text-gray-600 mt-1">{milestone.description}</p>
                )}
              </div>
            </div>
            <Badge
              variant={
                milestone.status === 'approved' ? 'default' :
                milestone.status === 'in_progress' ? 'default' :
                milestone.status === 'flagged' ? 'destructive' :
                'secondary'
              }
            >
              {milestone.status}
            </Badge>
          </div>

          <div className="grid md:grid-cols-3 gap-4 mt-4">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-gray-600">Target Date</p>
                <p className="font-medium">
                  {new Date(milestone.target_date).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <DollarSign className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-gray-600">Budget</p>
                <p className="font-medium">
                  GH₵ {(milestone.budget_allocated / 1000000).toFixed(2)}M
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm">
              {milestone.completion_percentage === 100 ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : milestone.completion_percentage > 0 ? (
                <Clock className="h-4 w-4 text-orange-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-gray-400" />
              )}
              <div>
                <p className="text-gray-600">Progress</p>
                <p className="font-medium">{milestone.completion_percentage}%</p>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          {milestone.completion_percentage > 0 && (
            <div className="mt-3">
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div
                  className="bg-blue-600 h-1.5 rounded-full transition-all"
                  style={{ width: `${milestone.completion_percentage}%` }}
                />
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}