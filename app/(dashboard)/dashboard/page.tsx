// app/(dashboard)/dashboard/page.tsx
import { getCurrentUser } from '@/lib/actions/auth'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  FolderKanban,
  CheckCircle2,
  Clock,
  AlertTriangle,
  TrendingUp,
  DollarSign,
} from 'lucide-react'

async function getDashboardStats(userId: string, role: string) {
  const supabase = await createClient()

  if (role === 'contractor') {
    // Contractor stats
    const { data: projects } = await supabase
      .from('projects')
      .select('*, submissions(*)')
      .eq('contractor_id', userId)

    const { data: submissions } = await supabase
      .from('submissions')
      .select('*')
      .eq('contractor_id', userId)

    return {
      totalProjects: projects?.length || 0,
      activeProjects: projects?.filter(p => p.status === 'active').length || 0,
      totalSubmissions: submissions?.length || 0,
      pendingSubmissions: submissions?.filter(s => s.status === 'pending').length || 0,
      approvedSubmissions: submissions?.filter(s => s.status === 'approved').length || 0,
      recentSubmissions: submissions?.slice(0, 5) || [],
    }
  } else if (role === 'official' || role === 'admin') {
    // Official/Admin stats
    const { data: projects } = await supabase
      .from('projects')
      .select('*')

    const { data: submissions } = await supabase
      .from('submissions')
      .select('*, projects(name), users(full_name)')
      .order('submitted_at', { ascending: false })
      .limit(10)

    const { data: tips } = await supabase
      .from('citizen_tips')
      .select('*')
      .eq('status', 'new')

    return {
      totalProjects: projects?.length || 0,
      activeProjects: projects?.filter(p => p.status === 'active').length || 0,
      delayedProjects: projects?.filter(p => p.status === 'delayed').length || 0,
      flaggedProjects: projects?.filter(p => p.status === 'flagged').length || 0,
      pendingReviews: submissions?.filter(s => s.status === 'pending').length || 0,
      newTips: tips?.length || 0,
      recentSubmissions: submissions || [],
      totalBudget: projects?.reduce((sum, p) => sum + Number(p.budget_total || 0), 0) || 0,
      spentBudget: projects?.reduce((sum, p) => sum + Number(p.budget_spent || 0), 0) || 0,
    }
  }

  // Default return for unknown roles
  return {
    totalProjects: 0,
    activeProjects: 0,
    totalSubmissions: 0,
    pendingSubmissions: 0,
    approvedSubmissions: 0,
    recentSubmissions: [],
    delayedProjects: 0,
    flaggedProjects: 0,
    pendingReviews: 0,
    newTips: 0,
    totalBudget: 0,
    spentBudget: 0,
  }
}

export default async function DashboardPage() {
  const user = await getCurrentUser()
  const role = user?.profile?.role || 'contractor'
  const stats = await getDashboardStats(user?.id || '', role)

  if (role === 'contractor') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.profile?.full_name}!
          </h1>
          <p className="text-gray-600 mt-1">
            Here&apos;s an overview of your projects
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Projects
              </CardTitle>
              <FolderKanban className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalProjects || 0}</div>
              <p className="text-xs text-green-600 mt-1">
                <TrendingUp className="inline h-3 w-3" /> {stats.activeProjects || 0} active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Submissions
              </CardTitle>
              <CheckCircle2 className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalSubmissions || 0}</div>
              <p className="text-xs text-green-600 mt-1">
                {stats.approvedSubmissions || 0} approved
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Pending Reviews
              </CardTitle>
              <Clock className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {stats.pendingSubmissions || 0}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Awaiting official review
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Approval Rate
              </CardTitle>
              <CheckCircle2 className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {(stats.totalSubmissions || 0) > 0
                  ? Math.round(((stats.approvedSubmissions || 0) / (stats.totalSubmissions || 1)) * 100)
                  : 0}%
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Of all submissions
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Submissions */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Submissions</CardTitle>
          </CardHeader>
          <CardContent>
            {(stats.recentSubmissions || []).length > 0 ? (
              <div className="space-y-4">
                {(stats.recentSubmissions || []).map((submission: any) => (
                  <div
                    key={submission.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{submission.submission_number}</p>
                      <p className="text-sm text-gray-500">
                        {submission.completion_percentage}% complete
                      </p>
                    </div>
                    <Badge
                      variant={
                        submission.status === 'approved'
                          ? 'default'
                          : submission.status === 'flagged'
                          ? 'destructive'
                          : 'secondary'
                      }
                    >
                      {submission.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">
                No submissions yet. Upload your first progress update!
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  // Official/Admin Dashboard
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">
          System overview and pending items
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Projects
            </CardTitle>
            <FolderKanban className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProjects || 0}</div>
            <div className="flex items-center gap-4 mt-2 text-xs">
              <span className="text-green-600">{stats.activeProjects || 0} active</span>
              <span className="text-orange-600">{stats.delayedProjects || 0} delayed</span>
              <span className="text-red-600">{stats.flaggedProjects || 0} flagged</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Pending Reviews
            </CardTitle>
            <Clock className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {stats.pendingReviews || 0}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Submissions awaiting review
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Citizen Tips
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats.newTips || 0}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              New concerns reported
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Budget Utilization
            </CardTitle>
            <DollarSign className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(stats.totalBudget || 0) > 0
                ? Math.round(((stats.spentBudget || 0) / (stats.totalBudget || 1)) * 100)
                : 0}%
            </div>
            <p className="text-xs text-gray-500 mt-1">
              GH₵ {((stats.spentBudget || 0) / 1000000).toFixed(1)}M of {((stats.totalBudget || 0) / 1000000).toFixed(1)}M
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Submissions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Submissions - Pending Review</CardTitle>
        </CardHeader>
        <CardContent>
          {(stats.recentSubmissions || []).filter((s: any) => s.status === 'pending').length > 0 ? (
            <div className="space-y-4">
              {(stats.recentSubmissions || [])
                .filter((s: any) => s.status === 'pending')
                .slice(0, 5)
                .map((submission: any) => (
                  <div
                    key={submission.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                  >
                    <div>
                      <p className="font-medium">{submission.submission_number}</p>
                      <p className="text-sm text-gray-500">
                        {submission.projects?.name} • {submission.users?.full_name}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(submission.submitted_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {submission.completion_percentage}% Complete
                      </p>
                      <Badge variant="secondary" className="mt-1">
                        {submission.gps_verified ? 'GPS Verified' : 'GPS Pending'}
                      </Badge>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">
              No pending submissions to review
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}