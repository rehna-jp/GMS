// components/projects/AddMilestoneButton.tsx
'use client'

import { useState } from 'react'
import { createMilestone } from '@/lib/actions/projects'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Plus, AlertCircle, CheckCircle2 } from 'lucide-react'

export default function AddMilestoneButton({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setSuccess(false)
    setLoading(true)

    const formData = new FormData(e.currentTarget)

    try {
      const result = await createMilestone(projectId, formData)

      if (result?.error) {
        setError(result.error)
      } else {
        setSuccess(true)
        // Reset form and close after delay
        setTimeout(() => {
          setOpen(false)
          setSuccess(false)
          e.currentTarget.reset()
        }, 1500)
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Add Milestone
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add New Milestone</DialogTitle>
          <DialogDescription>
            Create a milestone to track specific project deliverables
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
            <div className="text-sm text-red-800">{error}</div>
          </div>
        )}

        {success && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
            <div className="text-sm text-green-800">Milestone created successfully!</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Milestone Name *</Label>
            <Input
              id="name"
              name="name"
              placeholder="e.g., Foundation Completion"
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Detailed description of this milestone..."
              rows={3}
              disabled={loading}
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="target_date">Target Date *</Label>
              <Input
                id="target_date"
                name="target_date"
                type="date"
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="budget_allocated">Budget Allocated (GH₵) *</Label>
              <Input
                id="budget_allocated"
                name="budget_allocated"
                type="number"
                step="0.01"
                placeholder="e.g., 500000"
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="display_order">Display Order</Label>
            <Input
              id="display_order"
              name="display_order"
              type="number"
              placeholder="e.g., 1, 2, 3..."
              defaultValue={1}
              disabled={loading}
            />
            <p className="text-xs text-gray-500">
              Order in which this milestone appears (1 = first, 2 = second, etc.)
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={loading} className="flex-1 shadow-sm">
              {loading ? 'Creating...' : 'Create Milestone'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
              className="hover:bg-slate-50 hover:text-slate-900 border-slate-200"
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}