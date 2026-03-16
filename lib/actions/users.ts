// lib/actions/users.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getUsers(filters?: { role?: string; status?: string }) {
  const supabase = await createClient()

  let query = supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false })

  if (filters?.role && filters.role !== 'all') {
    query = query.eq('role', filters.role)
  }
  if (filters?.status && filters.status !== 'all') {
    query = query.eq('status', filters.status)
  }

  const { data, error } = await query
  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

export async function updateUserStatus(
  userId: string,
  status: 'active' | 'inactive' | 'suspended'
) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Prevent self-suspension
  if (userId === user.id) return { error: 'You cannot change your own status' }

  const { error } = await supabase
    .from('users')
    .update({ status })
    .eq('id', userId)

  if (error) return { error: error.message }

  // Audit log
  await supabase.from('audit_logs').insert({
    user_id: user.id,
    action: `user_${status}`,
    entity_type: 'users',
    entity_id: userId,
    table_name: 'users',
    record_id: userId,
    new_value: JSON.stringify({ status }),
  })

  revalidatePath('/users')
  return { success: true }
}

export async function getUserStats() {
  const supabase = await createClient()

  const [
    { count: total },
    { count: admins },
    { count: officials },
    { count: contractors },
    { count: active },
    { count: suspended },
  ] = await Promise.all([
    supabase.from('users').select('*', { count: 'exact', head: true }),
    supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'admin'),
    supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'official'),
    supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'contractor'),
    supabase.from('users').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('users').select('*', { count: 'exact', head: true }).eq('status', 'suspended'),
  ])

  return {
    total: total ?? 0,
    admins: admins ?? 0,
    officials: officials ?? 0,
    contractors: contractors ?? 0,
    active: active ?? 0,
    suspended: suspended ?? 0,
  }
}