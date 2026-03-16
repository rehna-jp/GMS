// components/layout/Sidebar.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  FolderKanban,
  Upload,
  FileCheck,
  BarChart3,
  Users,
  MessageSquare,
  Camera,
} from 'lucide-react'

const menuItems = {
  admin: [
    { icon: LayoutDashboard, label: 'Dashboard',        href: '/dashboard' },
    { icon: FolderKanban,    label: 'Projects',         href: '/projects' },
    { icon: Users,           label: 'User Management',  href: '/users' },
    { icon: Camera,          label: 'Submissions',      href: '/submissions' },
    { icon: BarChart3,       label: 'Reports',          href: '/reports' },
  ],
  official: [
    { icon: LayoutDashboard, label: 'Dashboard',          href: '/dashboard' },
    { icon: FolderKanban,    label: 'Projects',           href: '/projects' },
    { icon: Camera,          label: 'Review Submissions', href: '/submissions' },
    { icon: MessageSquare,   label: 'Citizen Tips',       href: '/tips' },
    { icon: BarChart3,       label: 'Reports',            href: '/reports' },
  ],
  contractor: [
    { icon: LayoutDashboard, label: 'Dashboard',       href: '/dashboard' },
    { icon: FolderKanban,    label: 'My Projects',     href: '/projects' },
    { icon: Camera,          label: 'Submissions',     href: '/submissions' },
    { icon: Upload,          label: 'New Submission',  href: '/submissions/new' },
  ],
}

export default function Sidebar({ user }: { user: any }) {
  const pathname = usePathname()
  const role = user?.profile?.role || 'contractor'
  const items = menuItems[role as keyof typeof menuItems] || menuItems.contractor

  return (
    <aside className="hidden lg:block fixed left-0 top-16 w-64 h-[calc(100vh-4rem)] bg-white border-r border-gray-200">
      <nav className="p-4 space-y-2">
        {items.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors',
                isActive
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-700 hover:bg-gray-50'
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}