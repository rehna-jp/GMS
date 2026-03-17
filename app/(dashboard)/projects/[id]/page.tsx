// app/(dashboard)/projects/[id]/page.tsx
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getCurrentUser } from '@/lib/actions/auth'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  MapPin, Calendar, DollarSign, User, Edit,
  TrendingUp, CheckCircle, Clock, Building2, ChevronLeft
} from 'lucide-react'
import MilestonesList from '@/components/projects/MilestonesList'
import AddMilestoneButton from '@/components/projects/AddMilestoneButton'

export const dynamic = 'force-dynamic'

const STATUS_BADGE: Record<string, string> = {
  active: 'bg-green-100 text-green-700 border-green-200',
  delayed: 'bg-red-100 text-red-700 border-red-200',
  completed: 'bg-primary/10 text-primary border-primary/20',
  flagged: 'bg-red-100 text-red-700 border-red-200',
  planning: 'bg-slate-100 text-slate-600 border-slate-200',
}

export default async function ProjectDetailPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const user = await getCurrentUser()
  const supabase = await createClient()

  const { data: project, error } = await supabase
    .from('projects')
    .select(`
      *,
      contractor:users!projects_contractor_id_fkey(id, full_name, email, phone),
      official:users!projects_primary_official_id_fkey(id, full_name, email),
      milestones(*)
    `)
    .eq('id', id)
    .single()

  if (error || !project) notFound()

  const { count: submissionsCount } = await supabase
    .from('submissions')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', id)

  const { data: milestoneSubmissions } = await supabase
    .from('submissions')
    .select('milestone_id')
    .eq('project_id', id)
    .not('milestone_id', 'is', null)

  const submissionCountMap: Record<string, number> = {}
  milestoneSubmissions?.forEach(s => {
    if (s.milestone_id) {
      submissionCountMap[s.milestone_id] = (submissionCountMap[s.milestone_id] ?? 0) + 1
    }
  })

  const milestonesWithCounts = (project.milestones ?? []).map((m: any) => ({
    ...m,
    submission_count: submissionCountMap[m.id] ?? 0,
  }))

  const canEdit = ['admin', 'official'].includes(user?.profile?.role || '')

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 space-y-6">
      {/* Back link */}
      <Link
        href="/projects"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to Projects
      </Link>

      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-blue-800 px-6 py-8 text-white shadow-lg">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 70% 50%, white 1px, transparent 1px)', backgroundSize: '24px 24px' }}
        />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-blue-200 uppercase tracking-wider mb-2">
              {project.project_type} · {project.project_number}
            </p>
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold">{project.name}</h1>
              <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${STATUS_BADGE[project.status] ?? STATUS_BADGE.planning}`}>
                {project.status}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-blue-200 text-sm">
              <MapPin className="h-3.5 w-3.5" />
              {project.location_region}{project.location_district ? `, ${project.location_district}` : ''}
            </div>
          </div>
          {canEdit && (
            <Link href={`/projects/${project.id}/edit`}>
              <Button className="bg-white/15 backdrop-blur-sm border border-white/25 text-white hover:bg-white/25 shadow-sm">
                <Edit className="mr-2 h-4 w-4" />
                Edit Project
              </Button>
            </Link>
          )}
        </div>

        {/* Progress bar inside hero */}
        <div className="relative mt-6">
          <div className="flex items-center justify-between mb-1.5 text-sm">
            <span className="text-blue-200">Overall Progress</span>
            <span className="font-bold">{project.completion_percentage}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-white/20">
            <div
              className="h-full rounded-full bg-white/80 transition-all"
              style={{ width: `${project.completion_percentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          {
            label: 'Budget Total',
            value: `GH₵ ${Number(project.budget_total ?? 0).toLocaleString()}`,
            sub: `Spent: GH₵ ${Number(project.budget_spent ?? 0).toLocaleString()}`,
            icon: DollarSign, bg: 'bg-primary/10', color: 'text-primary',
          },
          {
            label: 'Milestones',
            value: project.milestones?.length ?? 0,
            sub: `${project.milestones?.filter((m: any) => m.status === 'approved').length ?? 0} approved`,
            icon: CheckCircle, bg: 'bg-green-50', color: 'text-green-600',
          },
          {
            label: 'Submissions',
            value: submissionsCount ?? 0,
            sub: 'Total updates',
            icon: Building2, bg: 'bg-amber-50', color: 'text-amber-600',
          },
          {
            label: 'Timeline',
            value: new Date(project.end_date).toLocaleDateString('en-GH', { month: 'short', year: 'numeric' }),
            sub: `Started ${new Date(project.start_date).toLocaleDateString('en-GH', { month: 'short', year: 'numeric' })}`,
            icon: Calendar, bg: 'bg-slate-100', color: 'text-slate-600',
          },
        ].map(stat => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-400">{stat.label}</p>
                  <p className="mt-1.5 text-xl font-bold text-slate-900 truncate">{stat.value}</p>
                  <p className="mt-0.5 text-xs text-slate-500 truncate">{stat.sub}</p>
                </div>
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${stat.bg}`}>
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Main content */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">

          {/* Description */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-3 font-semibold text-slate-900">Project Description</h2>
            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
              {project.description || 'No description provided.'}
            </p>
          </div>

          {/* Milestones */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-slate-900">
                  Milestones
                  <span className="ml-2 text-sm font-normal text-slate-400">({project.milestones?.length || 0})</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">Project deliverables and phases</p>
              </div>
              {canEdit && <AddMilestoneButton projectId={project.id} />}
            </div>
            <MilestonesList milestones={milestonesWithCounts} />
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-5">

          {/* Location */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 font-semibold text-slate-900">Location</h2>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                  <MapPin className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-slate-800">{project.location_region}</p>
                  <p className="text-sm text-slate-500">{project.location_district}</p>
                  <p className="mt-1 font-mono text-xs text-slate-400">
                    {project.gps_latitude}, {project.gps_longitude}
                  </p>
                </div>
              </div>
              <a
                href={`https://www.google.com/maps?q=${project.gps_latitude},${project.gps_longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/10 transition-colors"
              >
                <MapPin className="h-3 w-3" />
                View on Google Maps
              </a>
            </div>
          </div>

          {/* Timeline */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 font-semibold text-slate-900">Timeline</h2>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-50">
                  <Calendar className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">Start Date</p>
                  <p className="font-medium text-slate-800">
                    {new Date(project.start_date).toLocaleDateString('en-GH', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50">
                  <Clock className="h-4 w-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">End Date</p>
                  <p className="font-medium text-slate-800">
                    {new Date(project.end_date).toLocaleDateString('en-GH', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Team */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 font-semibold text-slate-900">Team</h2>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-slate-400 mb-2">Primary Official</p>
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {project.official?.full_name?.charAt(0) ?? '?'}
                  </div>
                  <p className="text-sm font-medium text-slate-800">{project.official?.full_name || 'Not assigned'}</p>
                </div>
              </div>
              {project.contractor ? (
                <div>
                  <p className="text-xs text-slate-400 mb-2">Contractor</p>
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-50 text-xs font-bold text-amber-600">
                      {project.contractor.full_name?.charAt(0) ?? '?'}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800">{project.contractor.full_name}</p>
                      <p className="text-xs text-slate-400">{project.contractor.email}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-400 italic">No contractor assigned yet</p>
              )}
            </div>
          </div>

          {/* Project Type */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-3 font-semibold text-slate-900">Project Type</h2>
            <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
              {project.project_type}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}