// app/(dashboard)/projects/page.tsx
import Link from 'next/link'
import { getCurrentUser } from '@/lib/actions/auth'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, MapPin, Calendar, DollarSign, FolderKanban } from 'lucide-react'

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
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-blue-800 px-6 py-8 text-white shadow-lg">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 70% 50%, white 1px, transparent 1px)', backgroundSize: '24px 24px' }}
        />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-blue-200 uppercase tracking-wider mb-1">Infrastructure</p>
            <h1 className="text-2xl font-bold">Projects</h1>
            <p className="mt-1 text-blue-200 text-sm">
              {user?.profile?.role === 'contractor'
                ? 'Your assigned projects'
                : 'All infrastructure projects'}
            </p>
          </div>
          {canCreateProject && (
            <Link href="/projects/new">
              <Button className="bg-white/15 backdrop-blur-sm border border-white/25 text-white hover:bg-white/25 shadow-sm">
                <Plus className="mr-2 h-4 w-4" />
                New Project
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Total Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{projects?.length || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Projects Grid */}
      {projects && projects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project: any) => (
            <Card key={project.id} className="hover:shadow-md hover:border-primary/30 hover:-translate-y-0.5 transition-all duration-200 border-slate-200 shadow-sm">
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg mb-1 truncate text-slate-800">{project.name}</CardTitle>
                    <p className="text-sm text-slate-500 truncate">{project.project_number}</p>
                  </div>
                  <Badge
                    variant={
                      project.status === 'active' ? 'default' :
                        project.status === 'delayed' ? 'destructive' :
                          project.status === 'flagged' ? 'destructive' :
                            project.status === 'completed' ? 'default' :
                              'secondary'
                    }
                    className="shrink-0"
                  >
                    {project.status}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-slate-600">
                    <MapPin className="h-4 w-4 mr-2 text-slate-400 shrink-0" />
                    <span className="truncate">{project.location_region}, {project.location_district}</span>
                  </div>

                  <div className="flex items-center text-sm text-slate-600">
                    <DollarSign className="h-4 w-4 mr-2 text-slate-400 shrink-0" />
                    <span className="truncate">Budget: GH₵ {(project.budget_total / 1000000).toFixed(2)}M</span>
                  </div>

                  <div className="flex items-center text-sm text-slate-600">
                    <Calendar className="h-4 w-4 mr-2 text-slate-400 shrink-0" />
                    <span>{new Date(project.start_date).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-slate-500 font-medium">Progress</span>
                    <span className="font-bold text-slate-700">{project.completion_percentage}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-primary h-full rounded-full transition-all duration-500"
                      style={{ width: `${project.completion_percentage}%` }}
                    />
                  </div>
                </div>

                {/* Contractor */}
                {project.contractor && (
                  <div className="text-sm text-slate-600 truncate">
                    <span className="font-medium text-slate-700">Contractor:</span> {project.contractor.full_name}
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