// app/(dashboard)/projects/[id]/page.tsx
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getCurrentUser } from '@/lib/actions/auth'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  MapPin, Calendar, DollarSign, User, Edit, 
  TrendingUp, CheckCircle, Clock
} from 'lucide-react'
import MilestonesList from '@/components/projects/MilestonesList'
import AddMilestoneButton from '@/components/projects/AddMilestoneButton'

export default async function ProjectDetailPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params
  const user = await getCurrentUser()
  const supabase = await createClient()

  // Fetch project with related data
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

  if (error || !project) {
    notFound()
  }

  // Fetch submissions count
  const { count: submissionsCount } = await supabase
    .from('submissions')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', id)

  const canEdit = ['admin', 'official'].includes(user?.profile?.role || '')

  return (
    <div className="space-y-6">
      {/* Header with Edit Button */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
                <Badge
                  variant={
                    project.status === 'active' ? 'default' :
                    project.status === 'delayed' ? 'destructive' :
                    project.status === 'completed' ? 'default' :
                    'secondary'
                  }
                >
                  {project.status}
                </Badge>
              </div>
              <p className="text-gray-600">{project.project_number}</p>
            </div>
            
            {/* Edit Button */}
            {canEdit && (
              <Link href={`/projects/${project.id}/edit`}>
                <Button size="lg">
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Project
                </Button>
              </Link>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{project.completion_percentage}%</div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${project.completion_percentage}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Budget
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              GH₵ {(project.budget_total / 1000000).toFixed(2)}M
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Spent: GH₵ {(project.budget_spent / 1000000).toFixed(2)}M
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Milestones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{project.milestones?.length || 0}</div>
            <p className="text-xs text-gray-500 mt-1">
              {project.milestones?.filter((m: any) => m.status === 'approved').length || 0} approved
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Submissions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{submissionsCount || 0}</div>
            <p className="text-xs text-gray-500 mt-1">Total updates</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>Project Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 whitespace-pre-wrap">
                {project.description || 'No description provided.'}
              </p>
            </CardContent>
          </Card>

          {/* Milestones */}
          <Card>
            <CardHeader>
              <div className="flex flex-row items-center justify-between">
                <CardTitle>Milestones ({project.milestones?.length || 0})</CardTitle>
                {canEdit && <AddMilestoneButton projectId={project.id} />}
              </div>
            </CardHeader>
            <CardContent>
              <MilestonesList milestones={project.milestones || []} />
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Location */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Location</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-2">
                <MapPin className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">{project.location_region}</p>
                  <p className="text-sm text-gray-600">{project.location_district}</p>
                </div>
              </div>
              <div className="text-sm text-gray-600 pl-7">
                <p className="font-mono text-xs">
                  {project.gps_latitude}, {project.gps_longitude}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-2">
                <Calendar className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-600">Start Date</p>
                  <p className="font-medium">
                    {new Date(project.start_date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Calendar className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-600">End Date</p>
                  <p className="font-medium">
                    {new Date(project.end_date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Team */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Team</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Primary Official</p>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <p className="font-medium">{project.official?.full_name || 'Not assigned'}</p>
                </div>
              </div>
              
              {project.contractor ? (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Contractor</p>
                  <div className="flex items-start gap-2">
                    <User className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">{project.contractor.full_name}</p>
                      <p className="text-xs text-gray-500">{project.contractor.email}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-500 italic">
                  No contractor assigned yet
                </div>
              )}
            </CardContent>
          </Card>

          {/* Project Type */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Project Type</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant="outline" className="text-sm">
                {project.project_type}
              </Badge>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}