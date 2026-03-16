// app/(dashboard)/projects/[id]/edit/page.tsx
import { notFound, redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/actions/auth'
import { createClient } from '@/lib/supabase/server'
import { getContractors } from '@/lib/actions/projects'
import EditProjectForm from '@/components/projects/EditProjectForm'

export default async function EditProjectPage({ 
  params 
}: { 
  params: Promise<{ id: string }>  // ← Changed to Promise
}) {
  const { id } = await params  // ← Added await
  const user = await getCurrentUser()

  // Only officials and admins can edit projects
  if (!user || !['admin', 'official'].includes(user.profile?.role)) {
    redirect('/dashboard')
  }

  const supabase = await createClient()

  // Fetch project
  const { data: project, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !project) {
    notFound()
  }

  const contractors = await getContractors()

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Edit Project</h1>
        <p className="text-gray-600 mt-2">
          Update project information and settings
        </p>
      </div>

      <EditProjectForm 
        project={project} 
        contractors={contractors}
      />
    </div>
  )
}