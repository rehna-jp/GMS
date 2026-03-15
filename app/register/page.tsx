// app/register/page.tsx
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/actions/auth'
import RegisterForm from '@/components/auth/RegisterForm'

export default async function RegisterPage() {
  const user = await getCurrentUser()

  // Only allow admins to access this page
  if (!user || user.profile?.role !== 'admin') {
    redirect('/dashboard')
  }

  return <RegisterForm />
}