// app/public/tips/page.tsx
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import TipSubmissionForm from '@/components/public/TipSubmissionForm'

export default function PublicTipsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/">
            <Button variant="ghost">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Report a Concern
          </h1>
          <p className="text-gray-600">
            Your report is completely anonymous. No personal information is collected.
            You&apos;ll receive a reference number to track your concern.
          </p>
        </div>

        <TipSubmissionForm />
      </div>
    </div>
  )
}