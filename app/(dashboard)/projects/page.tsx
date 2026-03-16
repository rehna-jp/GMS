// app/(dashboard)/projects/page.tsx
import Link from 'next/link'
import { getCurrentUser } from '@/lib/actions/auth'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, MapPin, Calendar, DollarSign } from 'lucide-react'

export default async function ProjectsPage() {
  const user = await getCurrentUser()
  const supabase = await createClient()

  // Fetch projects based on user role
  let query = supabase
    .from('projects')
    .select(`
      *,
      contractor:users!projects_contractor_id_fkey(full_name),
      official:users!projects_primary_official_id_fkey(full_name)
    `)
    .order('created_at', { ascending: false })

  // If contractor, only show their projects
  if (user?.profile?.role === 'contractor') {
    query = query.eq('contractor_id', user.id)
  }

  const { data: projects } = await query

  const canCreateProject = ['admin', 'official'].includes(user?.profile?.role || '')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
          <p className="text-gray-600 mt-1">
            {user?.profile?.role === 'contractor' 
              ? 'Your assigned projects' 
              : 'All infrastructure projects'}
          </p>
        </div>
        {canCreateProject && (
          <Link href="/projects/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </Button>
          </Link>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Projects
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projects?.length || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Active
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {projects?.filter(p => p.status === 'active').length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Delayed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {projects?.filter(p => p.status === 'delayed').length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {projects?.filter(p => p.status === 'completed').length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Projects Grid */}
      {projects && projects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project: any) => (
            <Card key={project.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2">{project.name}</CardTitle>
                    <p className="text-sm text-gray-600">{project.project_number}</p>
                  </div>
                  <Badge
                    variant={
                      project.status === 'active' ? 'default' :
                      project.status === 'delayed' ? 'destructive' :
                      project.status === 'flagged' ? 'destructive' :
                      project.status === 'completed' ? 'default' :
                      'secondary'
                    }
                  >
                    {project.status}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                <div className="flex items-center text-sm text-gray-600">
                  <MapPin className="h-4 w-4 mr-2" />
                  {project.location_region}, {project.location_district}
                </div>

                <div className="flex items-center text-sm text-gray-600">
                  <DollarSign className="h-4 w-4 mr-2" />
                  Budget: GH₵ {(project.budget_total / 1000000).toFixed(2)}M
                </div>

                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="h-4 w-4 mr-2" />
                  {new Date(project.start_date).toLocaleDateString()}
                </div>

                {/* Progress Bar */}
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Progress</span>
                    <span className="font-medium">{project.completion_percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${project.completion_percentage}%` }}
                    />
                  </div>
                </div>

                {/* Contractor */}
                {project.contractor && (
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Contractor:</span> {project.contractor.full_name}
                  </div>
                )}

                <Link href={`/projects/${project.id}`}>
                  <Button variant="outline" className="w-full mt-4">
                    View Details
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12">
          <div className="text-center text-gray-500">
            <p className="text-lg font-medium mb-2">No projects found</p>
            {canCreateProject && (
              <p className="text-sm mb-4">Get started by creating your first project</p>
            )}
            {canCreateProject && (
              <Link href="/projects/new">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Project
                </Button>
              </Link>
            )}
          </div>
        </Card>
      )}
    </div>
  )
}