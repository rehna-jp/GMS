// app/public/map/page.tsx
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { MapPin, ExternalLink, FolderKanban, CheckCircle2, Clock, AlertTriangle } from 'lucide-react'
import { PublicMapClient } from '@/components/public/PublicMapClient'

export const dynamic = 'force-dynamic'

export default async function PublicMapPage() {
  const supabase = createClient()

  const { data: projects } = await (await supabase)
    .from('projects')
    .select(`
      id, name, project_number, project_type, status,
      location_region, location_district,
      gps_latitude, gps_longitude,
      completion_percentage, budget_total,
      start_date, end_date
    `)
    .not('gps_latitude', 'is', null)
    .order('created_at', { ascending: false })

  const stats = {
    total: projects?.length ?? 0,
    active: projects?.filter(p => p.status === 'active').length ?? 0,
    completed: projects?.filter(p => p.status === 'completed').length ?? 0,
    flagged: projects?.filter(p => p.status === 'flagged').length ?? 0,
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Public navbar */}
      <nav className="border-b border-slate-200 bg-white px-4 py-3 shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
              <span className="text-sm font-bold text-white">GP</span>
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">Ghana Project Monitor</p>
              <p className="text-xs text-slate-400">Public Transparency Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/public/tips"
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Submit a Tip
            </Link>
            <Link
              href="/login"
              className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 transition-colors"
            >
              Staff Login
            </Link>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-7xl px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Infrastructure Projects Map</h1>
          <p className="mt-1 text-slate-500">
            Track government infrastructure projects across Ghana in real time
          </p>
        </div>

        {/* Stats bar */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'Total Projects', value: stats.total,     icon: FolderKanban,  color: 'text-blue-600',  bg: 'bg-blue-50' },
            { label: 'Active',         value: stats.active,    icon: Clock,         color: 'text-amber-600', bg: 'bg-amber-50' },
            { label: 'Completed',      value: stats.completed, icon: CheckCircle2,  color: 'text-green-600', bg: 'bg-green-50' },
            { label: 'Flagged',        value: stats.flagged,   icon: AlertTriangle, color: 'text-red-600',   bg: 'bg-red-50' },
          ].map(stat => {
            const Icon = stat.icon
            return (
              <div key={stat.label} className={`rounded-xl border border-slate-200 bg-white p-4 shadow-sm`}>
                <div className="flex items-center gap-3">
                  <div className={`rounded-lg p-2 ${stat.bg}`}>
                    <Icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-slate-900">{stat.value}</p>
                    <p className="text-xs text-slate-400">{stat.label}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Map embed */}
          <div className="lg:col-span-2">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-4 py-3 flex items-center justify-between">
                <h2 className="font-semibold text-slate-900 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-blue-600" />
                  Project Locations
                </h2>
                <span className="text-xs text-slate-400">{stats.total} projects plotted</span>
              </div>
              <PublicMapClient projects={projects ?? []} />
            </div>
          </div>

          {/* Project list */}
          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            <h2 className="font-semibold text-slate-900 px-1">All Projects</h2>
            {(projects ?? []).map(project => (
              <div
                key={project.id}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-800 leading-tight">{project.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{project.project_number}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    project.status === 'active'    ? 'bg-green-100 text-green-700' :
                    project.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                    project.status === 'flagged'   ? 'bg-red-100 text-red-700' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    {project.status}
                  </span>
                </div>

                <div className="flex items-center gap-1 text-xs text-slate-400 mb-2">
                  <MapPin className="h-3 w-3" />
                  {project.location_district}, {project.location_region}
                </div>

                {/* Progress */}
                <div className="mb-2">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400">Progress</span>
                    <span className="font-medium text-slate-600">{project.completion_percentage}%</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-blue-500"
                      style={{ width: `${project.completion_percentage}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">
                    GH₵ {Number(project.budget_total ?? 0).toLocaleString()}
                  </span>
                  <a
                    href={`https://www.google.com/maps?q=${project.gps_latitude},${project.gps_longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
                  >
                    <ExternalLink className="h-3 w-3" />
                    View on Maps
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}