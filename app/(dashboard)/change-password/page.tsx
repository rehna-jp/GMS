// app/(dashboard)/change-password/page.tsx
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/actions/auth'
import ChangePasswordForm from '@/components/auth/ChangePasswordForm'

export default async function ChangePasswordPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Change Password</h1>
        <p className="text-gray-600 mt-2">
          {user.profile?.must_change_password ? (
            <span className="text-orange-600 font-medium">
              ⚠️ You must change your temporary password before continuing
            </span>
          ) : (
            'Update your account password'
          )}
        </p>
      </div>

      <ChangePasswordForm mustChange={user.profile?.must_change_password || false} />
    </div>
  )
}