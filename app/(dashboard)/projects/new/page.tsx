// app/(dashboard)/projects/new/page.tsx
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/actions/auth'
import { getContractors } from '@/lib/actions/projects'
import ProjectForm from '@/components/projects/ProjectForm'

export default async function NewProjectPage() {
  const user = await getCurrentUser()

  // Only officials and admins can create projects
  if (!user || !['admin', 'official'].includes(user.profile?.role)) {
    redirect('/dashboard')
  }

  const contractors = await getContractors()

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Create New Project</h1>
        <p className="text-gray-600 mt-2">
          Add a new infrastructure project to the monitoring system
        </p>
      </div>

      <ProjectForm contractors={contractors} />
    </div>
  )
}