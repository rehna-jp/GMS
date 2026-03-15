// app/public/map/page.tsx
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ArrowLeft, MapPin } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

export default async function PublicMapPage() {
  const supabase = await createClient()
  
  // Fetch all projects (no auth needed - public data)
  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/">
              <Button variant="ghost">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">
              Project Map
            </h1>
            <Link href="/public/tips">
              <Button variant="outline">Report a Concern</Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Map Placeholder */}
        <Card className="p-8 mb-8 bg-gray-100 h-96 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <MapPin className="h-16 w-16 mx-auto mb-4" />
            <p className="text-lg font-medium">Interactive Map Coming Soon</p>
            <p className="text-sm">We&apos;ll add Google Maps/Leaflet integration in Week 6</p>
          </div>
        </Card>

        {/* Projects List */}
        <h2 className="text-xl font-bold mb-4">All Projects ({projects?.length || 0})</h2>
        
        {projects && projects.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project: any) => (
              <Card key={project.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-bold text-lg">{project.name}</h3>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    project.status === 'active' ? 'bg-green-100 text-green-700' :
                    project.status === 'delayed' ? 'bg-orange-100 text-orange-700' :
                    project.status === 'flagged' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {project.status}
                  </span>
                </div>
                
                <div className="space-y-2 text-sm text-gray-600">
                  <p>
                    <MapPin className="inline h-4 w-4 mr-1" />
                    {project.location_region}, {project.location_district}
                  </p>
                  <p>
                    <strong>Budget:</strong> GH₵ {(project.budget_total / 1000000).toFixed(1)}M
                  </p>
                  <p>
                    <strong>Progress:</strong> {project.completion_percentage}%
                  </p>
                </div>

                <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${project.completion_percentage}%` }}
                  />
                </div>

                <Link href={`/public/projects/${project.id}`}>
                  <Button variant="outline" className="w-full mt-4">
                    View Details
                  </Button>
                </Link>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center text-gray-500">
            <p>No projects available yet</p>
          </Card>
        )}
      </div>
    </div>
  )
}