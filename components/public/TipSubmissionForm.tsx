// components/public/TipSubmissionForm.tsx
'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

export default function TipSubmissionForm() {
  const [submitted, setSubmitted] = useState(false)
  const [referenceNumber, setReferenceNumber] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    // We'll implement the actual submission in Week 6
    // For now, just simulate it
    setTimeout(() => {
      const refNum = `TIP-${new Date().getFullYear()}-${Math.floor(Math.random() * 90000) + 10000}`
      setReferenceNumber(refNum)
      setSubmitted(true)
      setLoading(false)
    }, 1000)
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
              Government officials will review your report.
            </p>
          </div>
          <Button onClick={() => setSubmitted(false)} className="w-full">
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
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <select
              id="category"
              name="category"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            >
              <option value="">Select a category</option>
              <option value="quality">Quality Concern</option>
              <option value="safety">Safety Issue</option>
              <option value="fraud">Suspected Fraud</option>
              <option value="delay">Project Delay</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="project">Project (Optional)</Label>
            <Input
              id="project"
              name="project"
              placeholder="Name or location of project"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Please describe your concern in detail..."
              rows={6}
              required
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              <strong>Your Privacy:</strong> This form does not collect any personal 
              information. Your IP address is not logged. You will receive a reference 
              number to track this concern anonymously.
            </p>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit Anonymous Tip'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}