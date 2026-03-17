// components/projects/ProjectForm.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createProject } from '@/lib/actions/projects'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { AlertCircle } from 'lucide-react'

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

interface ProjectFormProps {
  contractors: Array<{ id: string; full_name: string; email: string }>
  initialData?: any
  projectId?: string
}

export default function ProjectForm({ contractors, initialData, projectId }: ProjectFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const formData = new FormData(e.currentTarget)

    try {
      const result = await createProject(formData)

      if (result?.error) {
        setError(result.error)
        setLoading(false)
      }
      // Success redirects automatically via server action
    } catch (err: any) {
      // Next.js redirect() throws internally — don't treat it as an error
      if (err?.message?.includes('NEXT_REDIRECT') || err?.digest?.includes('NEXT_REDIRECT')) {
        return // navigation is happening, do nothing
      }
      setError(err.message || 'An error occurred')
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

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-800">Basic Information</h3>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="name">Project Name *</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="e.g., Kumasi-Accra Highway Expansion"
                  required
                  disabled={loading}
                  defaultValue={initialData?.name}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Detailed description of the project..."
                  rows={4}
                  disabled={loading}
                  defaultValue={initialData?.description}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="project_type">Project Type *</Label>
                <select
                  id="project_type"
                  name="project_type"
                  required
                  disabled={loading}
                  defaultValue={initialData?.project_type}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select type</option>
                  {PROJECT_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contractor_id">Assign Contractor</Label>
                <select
                  id="contractor_id"
                  name="contractor_id"
                  disabled={loading}
                  defaultValue={initialData?.contractor_id}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">No contractor assigned yet</option>
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
            <h3 className="text-lg font-semibold text-slate-800">Location</h3>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location_region">Region *</Label>
                <select
                  id="location_region"
                  name="location_region"
                  required
                  disabled={loading}
                  defaultValue={initialData?.location_region}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select region</option>
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
                  placeholder="e.g., Kumasi Metropolitan"
                  required
                  disabled={loading}
                  defaultValue={initialData?.location_district}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gps_latitude">GPS Latitude *</Label>
                <Input
                  id="gps_latitude"
                  name="gps_latitude"
                  type="number"
                  step="any"
                  placeholder="e.g., 6.6885"
                  required
                  disabled={loading}
                  defaultValue={initialData?.gps_latitude}
                />
                <p className="text-xs text-gray-500">Example: Accra = 5.6037</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="gps_longitude">GPS Longitude *</Label>
                <Input
                  id="gps_longitude"
                  name="gps_longitude"
                  type="number"
                  step="any"
                  placeholder="e.g., -1.6244"
                  required
                  disabled={loading}
                  defaultValue={initialData?.gps_longitude}
                />
                <p className="text-xs text-gray-500">Example: Accra = -0.1870</p>
              </div>
            </div>
          </div>

          {/* Budget & Timeline */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-800">Budget & Timeline</h3>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="budget_total">Total Budget (GH₵) *</Label>
                <Input
                  id="budget_total"
                  name="budget_total"
                  type="number"
                  step="0.01"
                  placeholder="e.g., 5000000"
                  required
                  disabled={loading}
                  defaultValue={initialData?.budget_total}
                />
                <p className="text-xs text-gray-500">Enter amount in cedis</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="start_date">Start Date *</Label>
                <Input
                  id="start_date"
                  name="start_date"
                  type="date"
                  required
                  disabled={loading}
                  defaultValue={initialData?.start_date}
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
                  defaultValue={initialData?.end_date}
                />
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-4 pt-4">
            <Button
              type="submit"
              disabled={loading}
              className="flex-1"
            >
              {loading ? 'Creating Project...' : 'Create Project'}
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