// components/public/TipSubmissionForm.tsx
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createClient } from '@/lib/supabase/client'

interface Project {
  id: string
  name: string
  project_number: string
  location_region: string
}

const CATEGORIES = [
  { value: 'corruption',     label: '💰 Corruption' },
  { value: 'poor_quality',   label: '🔨 Poor Quality Work' },
  { value: 'abandonment',    label: '🚫 Project Abandonment' },
  { value: 'safety_hazard',  label: '⚠️ Safety Hazard' },
  { value: 'wrong_location', label: '📍 Wrong Location' },
  { value: 'overpricing',    label: '💸 Overpricing' },
  { value: 'other',          label: '📝 Other' },
]

export default function TipSubmissionForm() {
  const [submitted, setSubmitted] = useState(false)
  const [referenceNumber, setReferenceNumber] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [projects, setProjects] = useState<Project[]>([])

  const [category, setCategory] = useState('')
  const [projectId, setProjectId] = useState('')
  const [description, setDescription] = useState('')

  // Load public projects for dropdown
  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('projects')
        .select('id, name, project_number, location_region')
        .order('name')
      if (data) setProjects(data)
    }
    load()
  }, [])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!category) {
      setError('Please select a category.')
      setLoading(false)
      return
    }
    if (!description.trim()) {
      setError('Please provide a description.')
      setLoading(false)
      return
    }

    try {
      const supabase = createClient()

      const { data, error: insertError } = await supabase
        .from('citizen_tips')
        .insert({
          project_id: projectId || null,
          category,
          description: description.trim(),
          status: 'new',
          submitted_at: new Date().toISOString(),
        })
        .select('reference_number')
        .single()

      if (insertError) {
        setError('Failed to submit tip. Please try again.')
        console.error(insertError)
        setLoading(false)
        return
      }

      // Notify officials if project is selected
      if (projectId) {
        const { data: project } = await supabase
          .from('projects')
          .select('name, primary_official_id')
          .eq('id', projectId)
          .single()

        if (project?.primary_official_id) {
          await supabase.from('notifications').insert({
            user_id: project.primary_official_id,
            type: 'warning',
            title: 'New Citizen Tip',
            message: `A citizen submitted a tip about "${project.name}". Review it in the Tips section. 💬`,
            is_read: false,
            project_id: projectId,
          })
        }

        // Notify admins
        const { data: admins } = await supabase
          .from('users')
          .select('id')
          .eq('role', 'admin')
          .eq('status', 'active')

        if (admins && admins.length > 0) {
          await supabase.from('notifications').insert(
            admins.map((admin: any) => ({
              user_id: admin.id,
              type: 'warning',
              title: 'New Citizen Tip',
              message: `A citizen submitted a tip about "${project?.name ?? 'a project'}". 💬`,
              is_read: false,
              project_id: projectId,
            }))
          )
        }
      }

      setReferenceNumber(data?.reference_number ?? `TIP-${Date.now()}`)
      setSubmitted(true)
    } catch (err) {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-green-600">✓ Tip Submitted Successfully</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
            <p className="font-medium mb-2">Your Reference Number:</p>
            <p className="text-3xl font-bold text-green-700 mb-4">{referenceNumber}</p>
            <p className="text-sm text-gray-600">
              Save this number to track your concern later.
              Government officials will review your report within 48 hours.
            </p>
          </div>
          <Button
            onClick={() => {
              setSubmitted(false)
              setCategory('')
              setProjectId('')
              setDescription('')
            }}
            className="w-full"
          >
            Submit Another Concern
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Anonymous Tip Form</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Category <span className="text-red-500">*</span></Label>
            <select
              id="category"
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select a category…</option>
              {CATEGORIES.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          {/* Project */}
          <div className="space-y-2">
            <Label htmlFor="project">
              Related Project <span className="text-gray-400 font-normal">(optional)</span>
            </Label>
            <select
              id="project"
              value={projectId}
              onChange={e => setProjectId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a project…</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>
                  {p.project_number} — {p.name} ({p.location_region})
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">
              Description <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Please describe your concern in detail — what you saw, when, and where…"
              rows={6}
              required
            />
          </div>

          {/* Privacy notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              <strong>Your Privacy:</strong> This form does not collect any personal
              information. Your submission is completely anonymous.
              You will receive a reference number to track this concern.
            </p>
          </div>

          {/* Error */}
          {error && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Submitting…' : 'Submit Anonymous Tip'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}