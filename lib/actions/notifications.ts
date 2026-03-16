// lib/actions/notifications.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface CreateNotificationInput {
  userId: string
  title: string
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
  submissionId?: string
  projectId?: string
}

export async function createNotification(input: CreateNotificationInput) {
  const supabase = await createClient()

  const { error } = await supabase.from('notifications').insert({
    user_id: input.userId,
    type: input.type,
    title: input.title,
    message: input.message,
    is_read: false,
    // link to the submission page if provided
    link: input.submissionId ? `/submissions/${input.submissionId}` : null,
    submission_id: input.submissionId ?? null,
    project_id: input.projectId ?? null,
  })

  if (error) {
    console.error('createNotification error:', error.message, error.details)
  }
}

export async function getNotifications() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Not authenticated' }

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

export async function markNotificationRead(notificationId: string) {
  const supabase = await createClient()

  await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId)

  revalidatePath('/')
}

export async function markAllNotificationsRead() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', user.id)

  revalidatePath('/')
}