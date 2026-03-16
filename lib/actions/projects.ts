// lib/actions/projects.ts
'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from './auth'

export async function createProject(formData: FormData) {
  try {
    const supabase = await createClient()
    const user = await getCurrentUser()

    // Only officials and admins can create projects
    if (!user || !['admin', 'official'].includes(user.profile?.role)) {
      return { error: 'Unauthorized: Only officials can create projects' }
    }

    const projectData = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      location_region: formData.get('location_region') as string,
      location_district: formData.get('location_district') as string,
      gps_latitude: parseFloat(formData.get('gps_latitude') as string),
      gps_longitude: parseFloat(formData.get('gps_longitude') as string),
      project_type: formData.get('project_type') as string,
      budget_total: parseFloat(formData.get('budget_total') as string),
      start_date: formData.get('start_date') as string,
      end_date: formData.get('end_date') as string,
      contractor_id: formData.get('contractor_id') as string || null,
      primary_official_id: user.id,
      status: 'active',
      completion_percentage: 0,
      budget_spent: 0,
    }

    const { data, error } = await supabase
      .from('projects')
      .insert(projectData)
      .select()
      .single()

    if (error) {
      console.error('Project creation error:', error)
      return { error: error.message }
    }

    revalidatePath('/projects')
    redirect(`/projects/${data.id}`)
  } catch (error: any) {
    console.error('Unexpected error:', error)
    return { error: error.message || 'An unexpected error occurred' }
  }
}

export async function updateProject(projectId: string, formData: FormData) {
  try {
    const supabase = await createClient()
    const user = await getCurrentUser()

    if (!user || !['admin', 'official'].includes(user.profile?.role)) {
      return { error: 'Unauthorized' }
    }

    const projectData = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      location_region: formData.get('location_region') as string,
      location_district: formData.get('location_district') as string,
      gps_latitude: parseFloat(formData.get('gps_latitude') as string),
      gps_longitude: parseFloat(formData.get('gps_longitude') as string),
      project_type: formData.get('project_type') as string,
      budget_total: parseFloat(formData.get('budget_total') as string),
      start_date: formData.get('start_date') as string,
      end_date: formData.get('end_date') as string,
      contractor_id: formData.get('contractor_id') as string || null,
      status: formData.get('status') as string,
    }

    const { error } = await supabase
      .from('projects')
      .update(projectData)
      .eq('id', projectId)

    if (error) {
      return { error: error.message }
    }

    revalidatePath('/projects')
    revalidatePath(`/projects/${projectId}`)
    return { success: true }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function deleteProject(projectId: string) {
  try {
    const supabase = await createClient()
    const user = await getCurrentUser()

    if (!user || user.profile?.role !== 'admin') {
      return { error: 'Unauthorized: Only admins can delete projects' }
    }

    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId)

    if (error) {
      return { error: error.message }
    }

    revalidatePath('/projects')
    redirect('/projects')
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function getContractors() {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('users')
      .select('id, full_name, email')
      .eq('role', 'contractor')
      .eq('status', 'active')
      .order('full_name')

    if (error) {
      console.error('Error fetching contractors:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Unexpected error:', error)
    return []
  }
}

export async function createMilestone(projectId: string, formData: FormData) {
  try {
    const supabase = await createClient()
    const user = await getCurrentUser()

    if (!user || !['admin', 'official'].includes(user.profile?.role)) {
      return { error: 'Unauthorized' }
    }

    const milestoneData = {
      project_id: projectId,
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      target_date: formData.get('target_date') as string,
      budget_allocated: parseFloat(formData.get('budget_allocated') as string),
      display_order: parseInt(formData.get('display_order') as string) || 0,
      status: 'pending',
      completion_percentage: 0,
    }

    const { error } = await supabase
      .from('milestones')
      .insert(milestoneData)

    if (error) {
      return { error: error.message }
    }

    revalidatePath(`/projects/${projectId}`)
    return { success: true }
  } catch (error: any) {
    return { error: error.message }
  }
}