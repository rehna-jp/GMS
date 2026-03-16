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
  MapPin, RefreshCw, XCircle, Eye,
} from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic' // Always fetch fresh data

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('users')
    .select('role, full_name')
    .eq('id', user?.id ?? '')
    .single()

  const role = profile?.role ?? 'contractor'
  const firstName = profile?.full_name?.split(' ')[0] ?? 'there'

  // Fetch data based on role
  const [statusData, regionData, trendData, recentActivity] = await Promise.all([
    getSubmissionsByStatus(),
    getProjectsByRegion(),
    getMonthlySubmissionTrend(),
    getRecentActivity(6),
  ])

  // ── ADMIN DASHBOARD ────────────────────────────────────────────────────────
  if (role === 'admin') {
    const stats = await getAdminStats()
    const pendingReviews = await getPendingReviews(5)

    return (
      <div className="mx-auto max-w-7xl px-4 py-8 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Good {getTimeOfDay()}, {firstName} 👋
          </h1>
          <p className="mt-1 text-slate-500">System overview — all projects and submissions</p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatsCard
            title="Total Projects"
            value={stats.totalProjects}
            subtitle={`${stats.activeProjects} active`}
            icon={FolderKanban}
            iconBg="bg-blue-50"
            iconColor="text-blue-600"
          />
          <StatsCard
            title="Pending Reviews"
            value={stats.pendingSubmissions}
            subtitle="Awaiting review"
            icon={Clock}
            iconBg="bg-amber-50"
            iconColor="text-amber-600"
            urgent={stats.pendingSubmissions > 5}
            trend={stats.pendingSubmissions > 0 ? 'up' : 'neutral'}
            trendLabel={stats.pendingSubmissions > 0 ? 'Needs attention' : 'All clear'}
          />
          <StatsCard
            title="Approved"
            value={stats.approvedSubmissions}
            subtitle="Total approved"
            icon={CheckCircle2}
            iconBg="bg-green-50"
            iconColor="text-green-600"
            trend="up"
            trendLabel={`${stats.gpsVerificationRate}% approval rate`}
          />
          <StatsCard
            title="Flagged"
            value={stats.flaggedSubmissions}
            subtitle="Fraud alerts"
            icon={AlertTriangle}
            iconBg="bg-red-50"
            iconColor="text-red-600"
            urgent={stats.flaggedSubmissions > 0}
          />
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatsCard
            title="Total Users"
            value={stats.totalUsers}
            subtitle={`${stats.totalContractors} contractors`}
            icon={Users}
            iconBg="bg-purple-50"
            iconColor="text-purple-600"
          />
          <StatsCard
            title="Flagged Projects"
            value={stats.flaggedProjects}
            subtitle="Need investigation"
            icon={XCircle}
            iconBg="bg-red-50"
            iconColor="text-red-600"
            urgent={stats.flaggedProjects > 0}
          />
          <StatsCard
            title="All Submissions"
            value={stats.totalSubmissions}
            subtitle="Across all projects"
            icon={Camera}
            iconBg="bg-slate-100"
            iconColor="text-slate-600"
          />
          <StatsCard
            title="GPS Rate"
            value={`${stats.gpsVerificationRate}%`}
            subtitle="Submissions approved"
            icon={TrendingUp}
            iconBg="bg-emerald-50"
            iconColor="text-emerald-600"
          />
        </div>

        {/* Charts + Pending reviews */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            {/* Trend */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="mb-4 font-semibold text-slate-900">Submission Trend (6 months)</h2>
              <SubmissionTrendChart data={trendData} />
            </div>

            {/* Region bar */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="mb-4 font-semibold text-slate-900">Projects by Region</h2>
              <ProjectsByRegionChart data={regionData} />
            </div>
          </div>

          <div className="space-y-6">
            {/* Status donut */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="mb-4 font-semibold text-slate-900">Submissions by Status</h2>
              <SubmissionStatusChart data={statusData} />
            </div>

            {/* Pending reviews */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-semibold text-slate-900">Pending Reviews</h2>
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
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 font-semibold text-slate-900">Recent Activity</h2>
          <RecentActivity activities={recentActivity as any} />
        </div>
      </div>
    )
  }

  // ── OFFICIAL DASHBOARD ─────────────────────────────────────────────────────
  if (role === 'official') {
    const stats = await getOfficialStats(user?.id ?? '')
    const pendingReviews = await getPendingReviews(6)

    return (
      <div className="mx-auto max-w-7xl px-4 py-8 space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Good {getTimeOfDay()}, {firstName} 👋
          </h1>
          <p className="mt-1 text-slate-500">Review dashboard — submissions awaiting your decision</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatsCard
            title="Pending Reviews"
            value={stats.pendingReviews}
            subtitle="Awaiting review"
            icon={Clock}
            iconBg="bg-amber-50"
            iconColor="text-amber-600"
            urgent={stats.pendingReviews > 0}
          />
          <StatsCard
            title="Under Review"
            value={stats.underReview}
            subtitle="In progress"
            icon={Eye}
            iconBg="bg-blue-50"
            iconColor="text-blue-600"
          />
          <StatsCard
            title="Approved This Month"
            value={stats.approvedThisMonth}
            subtitle="This month"
            icon={CheckCircle2}
            iconBg="bg-green-50"
            iconColor="text-green-600"
          />
          <StatsCard
            title="Flagged This Month"
            value={stats.flaggedThisMonth}
            subtitle="Fraud alerts"
            icon={AlertTriangle}
            iconBg="bg-red-50"
            iconColor="text-red-600"
            urgent={stats.flaggedThisMonth > 0}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            {/* Trend chart */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="mb-4 font-semibold text-slate-900">Submission Trend</h2>
              <SubmissionTrendChart data={trendData} />
            </div>

            {/* Recent activity */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="mb-4 font-semibold text-slate-900">Recent Activity</h2>
              <RecentActivity activities={recentActivity as any} />
            </div>
          </div>

          <div className="space-y-6">
            {/* Status donut */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="mb-4 font-semibold text-slate-900">Submissions by Status</h2>
              <SubmissionStatusChart data={statusData} />
            </div>

            {/* Pending reviews */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-semibold text-slate-900">Needs Review</h2>
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

  // ── CONTRACTOR DASHBOARD ───────────────────────────────────────────────────
  const stats = await getContractorStats(user?.id ?? '')
  const myProjects = await getContractorProjects(user?.id ?? '')

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 space-y-8">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Good {getTimeOfDay()}, {firstName} 👋
          </h1>
          <p className="mt-1 text-slate-500">Your project submissions and progress</p>
        </div>
        <Link
          href="/submissions/new"
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
        >
          <Camera className="h-4 w-4" />
          New Submission
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatsCard
          title="My Projects"
          value={stats.myProjects}
          subtitle="Assigned to you"
          icon={Building2}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
        />
        <StatsCard
          title="Approved"
          value={stats.approvedSubmissions}
          subtitle={`${stats.approvalRate}% approval rate`}
          icon={CheckCircle2}
          iconBg="bg-green-50"
          iconColor="text-green-600"
          trend="up"
          trendLabel={`${stats.approvalRate}% approval rate`}
        />
        <StatsCard
          title="Needs Action"
          value={stats.changesRequested + stats.flaggedSubmissions}
          subtitle="Changes requested or flagged"
          icon={AlertTriangle}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
          urgent={(stats.changesRequested + stats.flaggedSubmissions) > 0}
        />
      </div>

      {/* Submission status summary */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Pending', value: stats.pendingSubmissions, color: 'bg-blue-500' },
          { label: 'Under Review', value: stats.changesRequested, color: 'bg-amber-500' },
          { label: 'Flagged', value: stats.flaggedSubmissions, color: 'bg-red-500' },
        ].map(item => (
          <div key={item.label} className="rounded-xl border border-slate-200 bg-white p-4 text-center shadow-sm">
            <div className={`mx-auto mb-2 h-2 w-8 rounded-full ${item.color}`} />
            <p className="text-2xl font-bold text-slate-900">{item.value}</p>
            <p className="text-xs text-slate-500">{item.label}</p>
          </div>
        ))}
      </div>

      {/* My projects */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">My Projects</h2>
          <Link href="/projects" className="text-xs font-medium text-blue-600 hover:text-blue-800">
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
                className="group flex items-center gap-4 rounded-xl border border-slate-100 p-3 transition-all hover:border-blue-200 hover:shadow-sm"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-medium text-slate-700 group-hover:text-blue-700">
                      {project.name}
                    </p>
                    <span className="shrink-0 text-xs font-bold text-slate-600">
                      {project.completion_percentage}%
                    </span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-blue-500 transition-all"
                        style={{ width: `${project.completion_percentage}%` }}
                      />
                    </div>
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {project.location_region}
                    </span>
                    <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                      project.status === 'active' ? 'bg-green-100 text-green-700' :
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

// ── Helper ────────────────────────────────────────────────────────────────────
function getTimeOfDay(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'morning'
  if (hour < 17) return 'afternoon'
  return 'evening'
}