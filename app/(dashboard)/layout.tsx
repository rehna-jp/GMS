// app/(dashboard)/layout.tsx
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/actions/auth'
import Navbar from '@/components/layout/Navbar'
import Sidebar from '@/components/layout/Sidebar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} />
      <div className="flex">
        <Sidebar user={user} />
        <main className="flex-1 p-6 lg:ml-64">
          {children}
        </main>
      </div>
    </div>
  )
}