// app/(dashboard)/dashboard/page.tsx
import { createClient } from '@/lib/supabase/server'
import { StatsCard } from '@/components/dashboard/StatsCard'
import { RecentActivity } from '@/components/dashboard/RecentActivity'
import { PendingReviews } from '@/components/dashboard/PendingReviews'
import {
  SubmissionStatusChart,
  ProjectsByRegionChart,
  SubmissionTrendChart,
} from '@/components/dashboard/SubmissionsChart'
import {
  getAdminStats,
  getOfficialStats,
  getContractorStats,
  getSubmissionsByStatus,
  getProjectsByRegion,
  getMonthlySubmissionTrend,
  getRecentActivity,
  getPendingReviews,
  getContractorProjects,
} from '@/lib/actions/analytics'
import {
  FolderKanban, Users, Camera, AlertTriangle,
  CheckCircle2, Clock, TrendingUp, Building2,
  MapPin, XCircle, Eye, Shield,
} from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('users')
    .select('role, full_name')
    .eq('id', user?.id ?? '')
    .single()

  const role = profile?.role ?? 'contractor'
  const fullName = profile?.full_name ?? 'there'

  const [statusData, regionData, trendData, recentActivity] = await Promise.all([
    getSubmissionsByStatus(),
    getProjectsByRegion(),
    getMonthlySubmissionTrend(),
    getRecentActivity(6),
  ])

  // ── ADMIN DASHBOARD ─────────────────────────────────────────────────────────
  if (role === 'admin') {
    const stats = await getAdminStats()
    const pendingReviews = await getPendingReviews(5)

    return (
      <div className="mx-auto max-w-7xl px-4 py-8 space-y-8">
        {/* Hero Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-blue-800 px-6 py-8 text-white shadow-lg">
          <div className="absolute inset-0 opacity-10"
            style={{ backgroundImage: 'radial-gradient(circle at 70% 50%, white 1px, transparent 1px)', backgroundSize: '24px 24px' }}
          />
          <div className="relative flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-blue-200 uppercase tracking-wider mb-1">Admin Panel</p>
              <h1 className="text-2xl font-bold">
                Good {getTimeOfDay()}, {fullName} 👋
              </h1>
              <p className="mt-1 text-blue-200 text-sm">System overview — all projects and submissions</p>
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-white/10 backdrop-blur-sm px-4 py-2 text-sm font-medium border border-white/20">
              <Shield className="h-4 w-4 text-blue-200" />
              <span>Admin Access</span>
            </div>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatsCard title="Total Projects" value={stats.totalProjects} subtitle={`${stats.activeProjects} active`} icon={FolderKanban} iconBg="bg-primary/10" iconColor="text-primary" />
          <StatsCard title="Pending Reviews" value={stats.pendingSubmissions} subtitle="Awaiting review" icon={Clock} iconBg="bg-amber-50" iconColor="text-amber-600" urgent={stats.pendingSubmissions > 5} trend={stats.pendingSubmissions > 0 ? 'up' : 'neutral'} trendLabel={stats.pendingSubmissions > 0 ? 'Needs attention' : 'All clear'} />
          <StatsCard title="Approved" value={stats.approvedSubmissions} subtitle="Total approved" icon={CheckCircle2} iconBg="bg-green-50" iconColor="text-green-600" trend="up" trendLabel={`${stats.gpsVerificationRate}% approval rate`} />
          <StatsCard title="Flagged" value={stats.flaggedSubmissions} subtitle="Fraud alerts" icon={AlertTriangle} iconBg="bg-red-50" iconColor="text-red-600" urgent={stats.flaggedSubmissions > 0} />
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatsCard title="Total Users" value={stats.totalUsers} subtitle={`${stats.totalContractors} contractors`} icon={Users} iconBg="bg-purple-50" iconColor="text-purple-600" />
          <StatsCard title="Flagged Projects" value={stats.flaggedProjects} subtitle="Need investigation" icon={XCircle} iconBg="bg-red-50" iconColor="text-red-600" urgent={stats.flaggedProjects > 0} />
          <StatsCard title="All Submissions" value={stats.totalSubmissions} subtitle="Across all projects" icon={Camera} iconBg="bg-slate-100" iconColor="text-slate-600" />
          <StatsCard title="GPS Rate" value={`${stats.gpsVerificationRate}%`} subtitle="Submissions approved" icon={TrendingUp} iconBg="bg-emerald-50" iconColor="text-emerald-600" />
        </div>

        {/* Charts + Pending reviews */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
              <h2 className="mb-1 font-semibold text-slate-900">Submission Trend</h2>
              <p className="mb-4 text-xs text-slate-400">Last 6 months</p>
              <SubmissionTrendChart data={trendData} />
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
              <h2 className="mb-1 font-semibold text-slate-900">Projects by Region</h2>
              <p className="mb-4 text-xs text-slate-400">Distribution across regions</p>
              <ProjectsByRegionChart data={regionData} />
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
              <h2 className="mb-1 font-semibold text-slate-900">Submissions by Status</h2>
              <p className="mb-4 text-xs text-slate-400">Current breakdown</p>
              <SubmissionStatusChart data={statusData} />
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-slate-900">Pending Reviews</h2>
                  <p className="text-xs text-slate-400">Require attention</p>
                </div>
                {stats.pendingSubmissions > 0 && (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700">
                    {stats.pendingSubmissions}
                  </span>
                )}
              </div>
              <PendingReviews reviews={pendingReviews as any} />
            </div>
          </div>
        </div>

        {/* Recent activity */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
          <h2 className="mb-1 font-semibold text-slate-900">Recent Activity</h2>
          <p className="mb-4 text-xs text-slate-400">Latest actions across all projects</p>
          <RecentActivity activities={recentActivity as any} />
        </div>
      </div>
    )
  }

  // ── OFFICIAL DASHBOARD ──────────────────────────────────────────────────────
  if (role === 'official') {
    const stats = await getOfficialStats(user?.id ?? '')
    const pendingReviews = await getPendingReviews(6)

    return (
      <div className="mx-auto max-w-7xl px-4 py-8 space-y-8">
        {/* Hero Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-blue-800 px-6 py-8 text-white shadow-lg">
          <div className="absolute inset-0 opacity-10"
            style={{ backgroundImage: 'radial-gradient(circle at 70% 50%, white 1px, transparent 1px)', backgroundSize: '24px 24px' }}
          />
          <div className="relative flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-blue-200 uppercase tracking-wider mb-1">Official Portal</p>
              <h1 className="text-2xl font-bold">
                Good {getTimeOfDay()}, {fullName} 👋
              </h1>
              <p className="mt-1 text-blue-200 text-sm">Review dashboard — submissions awaiting your decision</p>
            </div>
            {stats.pendingReviews > 0 && (
              <div className="flex items-center gap-2 rounded-xl bg-amber-400/20 backdrop-blur-sm px-4 py-2 text-sm font-medium border border-amber-300/30">
                <Clock className="h-4 w-4 text-amber-200" />
                <span>{stats.pendingReviews} pending</span>
              </div>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatsCard title="Pending Reviews" value={stats.pendingReviews} subtitle="Awaiting review" icon={Clock} iconBg="bg-amber-50" iconColor="text-amber-600" urgent={stats.pendingReviews > 0} />
          <StatsCard title="Under Review" value={stats.underReview} subtitle="In progress" icon={Eye} iconBg="bg-primary/10" iconColor="text-primary" />
          <StatsCard title="Approved This Month" value={stats.approvedThisMonth} subtitle="This month" icon={CheckCircle2} iconBg="bg-green-50" iconColor="text-green-600" />
          <StatsCard title="Flagged This Month" value={stats.flaggedThisMonth} subtitle="Fraud alerts" icon={AlertTriangle} iconBg="bg-red-50" iconColor="text-red-600" urgent={stats.flaggedThisMonth > 0} />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
              <h2 className="mb-1 font-semibold text-slate-900">Submission Trend</h2>
              <p className="mb-4 text-xs text-slate-400">Last 6 months</p>
              <SubmissionTrendChart data={trendData} />
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
              <h2 className="mb-1 font-semibold text-slate-900">Recent Activity</h2>
              <p className="mb-4 text-xs text-slate-400">Latest submission actions</p>
              <RecentActivity activities={recentActivity as any} />
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
              <h2 className="mb-1 font-semibold text-slate-900">Submissions by Status</h2>
              <p className="mb-4 text-xs text-slate-400">Current breakdown</p>
              <SubmissionStatusChart data={statusData} />
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-slate-900">Needs Review</h2>
                  <p className="text-xs text-slate-400">Submissions waiting</p>
                </div>
                {stats.pendingReviews > 0 && (
                  <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-600">
                    {stats.pendingReviews} pending
                  </span>
                )}
              </div>
              <PendingReviews reviews={pendingReviews as any} />
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── CONTRACTOR DASHBOARD ────────────────────────────────────────────────────
  const stats = await getContractorStats(user?.id ?? '')
  const myProjects = await getContractorProjects(user?.id ?? '')

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 space-y-8">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-blue-800 px-6 py-8 text-white shadow-lg">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 70% 50%, white 1px, transparent 1px)', backgroundSize: '24px 24px' }}
        />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-blue-200 uppercase tracking-wider mb-1">Contractor Portal</p>
            <h1 className="text-2xl font-bold">
              Good {getTimeOfDay()}, {fullName} 👋
            </h1>
            <p className="mt-1 text-blue-200 text-sm">Your project submissions and progress</p>
          </div>
          <Link
            href="/submissions/new"
            className="inline-flex items-center gap-2 rounded-xl bg-white/15 backdrop-blur-sm border border-white/25 px-4 py-2 text-sm font-semibold text-white hover:bg-white/25 transition-all shadow-sm"
          >
            <Camera className="h-4 w-4" />
            New Submission
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatsCard title="My Projects" value={stats.myProjects} subtitle="Assigned to you" icon={Building2} iconBg="bg-primary/10" iconColor="text-primary" />
        <StatsCard title="Approved" value={stats.approvedSubmissions} subtitle={`${stats.approvalRate}% approval rate`} icon={CheckCircle2} iconBg="bg-green-50" iconColor="text-green-600" trend="up" trendLabel={`${stats.approvalRate}% approval rate`} />
        <StatsCard title="Needs Action" value={stats.changesRequested + stats.flaggedSubmissions} subtitle="Changes requested or flagged" icon={AlertTriangle} iconBg="bg-amber-50" iconColor="text-amber-600" urgent={(stats.changesRequested + stats.flaggedSubmissions) > 0} />
      </div>

      {/* Submission status summary */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Pending', value: stats.pendingSubmissions, color: 'bg-primary', light: 'bg-primary/10', text: 'text-primary' },
          { label: 'Under Review', value: stats.changesRequested, color: 'bg-amber-500', light: 'bg-amber-50', text: 'text-amber-700' },
          { label: 'Flagged', value: stats.flaggedSubmissions, color: 'bg-red-500', light: 'bg-red-50', text: 'text-red-700' },
        ].map(item => (
          <div key={item.label} className="rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm hover:shadow-md transition-shadow">
            <div className={`mx-auto mb-3 h-2 w-10 rounded-full ${item.color}`} />
            <p className={`text-3xl font-bold ${item.text}`}>{item.value}</p>
            <p className="text-xs text-slate-500 mt-1">{item.label}</p>
          </div>
        ))}
      </div>

      {/* My projects */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-slate-900">My Projects</h2>
            <p className="text-xs text-slate-400">Your assigned infrastructure projects</p>
          </div>
          <Link href="/projects" className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors">
            View all →
          </Link>
        </div>

        {myProjects.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-400">No projects assigned yet</p>
        ) : (
          <div className="space-y-3">
            {myProjects.map((project: any) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="group flex items-center gap-4 rounded-xl border border-slate-100 p-3 transition-all hover:border-primary/30 hover:bg-primary/5 hover:shadow-sm"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-medium text-slate-700 group-hover:text-primary">
                      {project.name}
                    </p>
                    <span className="shrink-0 text-xs font-bold text-slate-600">
                      {project.completion_percentage}%
                    </span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${project.completion_percentage}%` }}
                      />
                    </div>
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {project.location_region}
                    </span>
                    <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${project.status === 'active' ? 'bg-green-100 text-green-700' :
                      project.status === 'flagged' ? 'bg-red-100 text-red-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                      {project.status}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Helper ─────────────────────────────────────────────────────────────────────
function getTimeOfDay(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'morning'
  if (hour < 17) return 'afternoon'
  return 'evening'
}