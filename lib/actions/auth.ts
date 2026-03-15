// lib/actions/auth.ts
'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()  // ← ADD await

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function signup(formData: FormData) {
  try {
    const supabase = await createClient()

    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const fullName = formData.get('fullName') as string
    const phone = formData.get('phone') as string
    const role = formData.get('role') as string

    // SECURITY: Prevent creating admin users through this function
    if (role === 'admin') {
      return { error: 'Admin users cannot be created through this form' }
    }

    // Verify the current user is an admin (server-side check)
    const currentUser = await getCurrentUser()
    if (!currentUser || currentUser.profile?.role !== 'admin') {
      return { error: 'Unauthorized: Only admins can create users' }
    }

    console.log('Admin creating user:', { email, fullName, role })

    // Create auth user
    const { error: signUpError, data: authData } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone: phone,
          role: role,
        },
      },
    })

    if (signUpError) {
      console.error('Signup error:', signUpError)
      return { error: signUpError.message }
    }

    // Create user profile
    if (authData.user) {
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: email,
          full_name: fullName,
          phone: phone || null,
          role: role,
          status: 'active',
          must_change_password: true,
        })

      if (profileError) {
        console.error('Profile creation error:', profileError)
        return { error: `Profile creation failed: ${profileError.message}` }
      }
    }

    // Don't redirect - just return success
    return { success: true }
  } catch (error: any) {
    console.error('Unexpected error during signup:', error)
    return { error: error.message || 'An unexpected error occurred' }
  }
}

export async function logout() {
  const supabase = await createClient()  // ← ADD await
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}

export async function getCurrentUser() {
  const supabase = await createClient()  // ← ADD await
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return null

  // Get user profile with role
  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  return { ...user, profile }
}


export async function changePassword(currentPassword: string, newPassword: string) {
  try {
    const supabase = await createClient()

    // Verify current password by trying to sign in
    const user = await getCurrentUser()
    if (!user) {
      return { error: 'Not authenticated' }
    }

    // Update password in Supabase Auth
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword
    })

    if (updateError) {
      return { error: updateError.message }
    }

    // Update the must_change_password flag
    const { error: profileError } = await supabase
      .from('users')
      .update({ must_change_password: false })
      .eq('id', user.id)

    if (profileError) {
      return { error: profileError.message }
    }

    revalidatePath('/', 'layout')
    return { success: true }
  } catch (error: any) {
    return { error: error.message }
  }
}