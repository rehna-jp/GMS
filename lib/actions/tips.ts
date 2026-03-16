// lib/actions/tips.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getTips(filters?: { status?: string; category?: string }) {
  const supabase = await createClient()

  let query = supabase
    .from('citizen_tips')
    .select(`
      *,
      projects(name, project_number, location_region)
    `)
    .order('submitted_at', { ascending: false })

  if (filters?.status && filters.status !== 'all') {
    query = query.eq('status', filters.status)
  }
  if (filters?.category && filters.category !== 'all') {
    query = query.eq('category', filters.category)
  }

  const { data, error } = await query
  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

export async function updateTipStatus(
  tipId: string,
  status: 'under_review' | 'actioned' | 'dismissed'
) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('citizen_tips')
    .update({ status })
    .eq('id', tipId)

  if (error) return { error: error.message }

  revalidatePath('/tips')
  return { success: true }
}

export async function getTipStats() {
  const supabase = await createClient()

  const [
    { count: total },
    { count: newTips },
    { count: underReview },
    { count: actioned },
    { count: dismissed },
  ] = await Promise.all([
    supabase.from('citizen_tips').select('*', { count: 'exact', head: true }),
    supabase.from('citizen_tips').select('*', { count: 'exact', head: true }).eq('status', 'new'),
    supabase.from('citizen_tips').select('*', { count: 'exact', head: true }).eq('status', 'under_review'),
    supabase.from('citizen_tips').select('*', { count: 'exact', head: true }).eq('status', 'actioned'),
    supabase.from('citizen_tips').select('*', { count: 'exact', head: true }).eq('status', 'dismissed'),
  ])

  return {
    total: total ?? 0,
    new: newTips ?? 0,
    underReview: underReview ?? 0,
    actioned: actioned ?? 0,
    dismissed: dismissed ?? 0,
  }
}

// Public — no auth required
export async function submitTip(input: {
  projectId: string
  category: string
  description: string
}) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('citizen_tips')
    .insert({
      project_id: input.projectId,
      category: input.category,
      description: input.description,
      status: 'new',
      submitted_at: new Date().toISOString(),
    })

  if (error) return { error: error.message }
  revalidatePath('/tips')
  return { success: true }
}