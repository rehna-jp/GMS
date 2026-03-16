// components/projects/EditProjectForm.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateProject } from '@/lib/actions/projects'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { AlertCircle, CheckCircle2 } from 'lucide-react'

const GHANA_REGIONS = [
  'Greater Accra', 'Ashanti', 'Western', 'Eastern', 'Central', 
  'Northern', 'Upper East', 'Upper West', 'Volta', 'Bono',
  'Bono East', 'Ahafo', 'Savannah', 'North East', 'Oti', 'Western North'
]

const PROJECT_TYPES = [
  'Road Construction',
  'Bridge Construction',
  'School Building',
  'Hospital/Clinic',
  'Water Supply',
  'Drainage System',
  'Market Construction',
  'Community Center',
  'Other Infrastructure'
]

const PROJECT_STATUSES = [
  'active',
  'delayed',
  'flagged',
  'completed',
  'suspended'
]

interface EditProjectFormProps {
  project: any
  contractors: Array<{ id: string; full_name: string; email: string }>
}

export default function EditProjectForm({ project, contractors }: EditProjectFormProps) {
  const router = useRouter()
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
      const result = await updateProject(project.id, formData)
      
      if (result?.error) {
        setError(result.error)
      } else {
        setSuccess(true)
        setTimeout(() => {
          router.push(`/projects/${project.id}`)
        }, 1500)
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Information</CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
            <div className="text-sm text-red-800">{error}</div>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
            <div className="text-sm text-green-800">
              Project updated successfully! Redirecting...
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="name">Project Name *</Label>
                <Input
                  id="name"
                  name="name"
                  required
                  disabled={loading}
                  defaultValue={project.name}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  rows={4}
                  disabled={loading}
                  defaultValue={project.description || ''}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="project_type">Project Type *</Label>
                <select
                  id="project_type"
                  name="project_type"
                  required
                  disabled={loading}
                  defaultValue={project.project_type}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {PROJECT_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Project Status *</Label>
                <select
                  id="status"
                  name="status"
                  required
                  disabled={loading}
                  defaultValue={project.status}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {PROJECT_STATUSES.map(status => (
                    <option key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="contractor_id">Assign Contractor</Label>
                <select
                  id="contractor_id"
                  name="contractor_id"
                  disabled={loading}
                  defaultValue={project.contractor_id || ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">No contractor assigned</option>
                  {contractors.map(contractor => (
                    <option key={contractor.id} value={contractor.id}>
                      {contractor.full_name} ({contractor.email})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Location</h3>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location_region">Region *</Label>
                <select
                  id="location_region"
                  name="location_region"
                  required
                  disabled={loading}
                  defaultValue={project.location_region}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {GHANA_REGIONS.map(region => (
                    <option key={region} value={region}>{region}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location_district">District *</Label>
                <Input
                  id="location_district"
                  name="location_district"
                  required
                  disabled={loading}
                  defaultValue={project.location_district}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gps_latitude">GPS Latitude *</Label>
                <Input
                  id="gps_latitude"
                  name="gps_latitude"
                  type="number"
                  step="any"
                  required
                  disabled={loading}
                  defaultValue={project.gps_latitude}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gps_longitude">GPS Longitude *</Label>
                <Input
                  id="gps_longitude"
                  name="gps_longitude"
                  type="number"
                  step="any"
                  required
                  disabled={loading}
                  defaultValue={project.gps_longitude}
                />
              </div>
            </div>
          </div>

          {/* Budget & Timeline */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Budget & Timeline</h3>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="budget_total">Total Budget (GH₵) *</Label>
                <Input
                  id="budget_total"
                  name="budget_total"
                  type="number"
                  step="0.01"
                  required
                  disabled={loading}
                  defaultValue={project.budget_total}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="start_date">Start Date *</Label>
                <Input
                  id="start_date"
                  name="start_date"
                  type="date"
                  required
                  disabled={loading}
                  defaultValue={project.start_date}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="end_date">Expected End Date *</Label>
                <Input
                  id="end_date"
                  name="end_date"
                  type="date"
                  required
                  disabled={loading}
                  defaultValue={project.end_date}
                />
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-4 pt-4">
            <Button
              type="submit"
              disabled={loading || success}
              className="flex-1"
            >
              {loading ? 'Saving Changes...' : 'Save Changes'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={loading}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}