// app/public/tips/page.tsx
import Link from 'next/link'
import { ArrowLeft, Shield, MessageSquare } from 'lucide-react'
import TipSubmissionForm from '@/components/public/TipSubmissionForm'

export default function PublicTipsPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top nav bar */}
      <div className="bg-white/80 backdrop-blur-md shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-primary/90 rounded-lg flex items-center justify-center">
              <Shield className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-semibold text-slate-700 group-hover:text-primary transition-colors hidden sm:block">
              GMS
            </span>
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </div>
      </div>

      {/* Hero hero */}
      <div className="bg-gradient-to-br from-primary to-blue-800 py-12 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="mb-4 flex justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm border border-white/25">
              <MessageSquare className="h-7 w-7 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-3">Report a Concern</h1>
          <p className="text-blue-200 text-sm leading-relaxed max-w-md mx-auto">
            Your report is completely anonymous. No personal information is collected.
            You&apos;ll receive a reference number to track your concern.
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10 -mt-4">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-md p-6 sm:p-8">
          <TipSubmissionForm />
        </div>
        <p className="mt-4 text-center text-xs text-slate-400">
          Government Monitoring System &mdash; Public Transparency Portal
        </p>
      </div>
    </div>
  )
}