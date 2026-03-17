// components/layout/Sidebar.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  FolderKanban,
  Upload,
  Camera,
  BarChart3,
  Users,
  MessageSquare,
  Menu,
  X,
} from 'lucide-react'

const menuItems = {
  admin: [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
    { icon: FolderKanban, label: 'Projects', href: '/projects' },
    { icon: Users, label: 'User Management', href: '/users' },
    { icon: Camera, label: 'Submissions', href: '/submissions' },
    { icon: MessageSquare, label: 'Citizen Tips', href: '/tips' },
    { icon: BarChart3, label: 'Reports', href: '/reports' },
  ],
  official: [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
    { icon: FolderKanban, label: 'Projects', href: '/projects' },
    { icon: Camera, label: 'Review Submissions', href: '/submissions' },
    { icon: MessageSquare, label: 'Citizen Tips', href: '/tips' },
    { icon: BarChart3, label: 'Reports', href: '/reports' },
  ],
  contractor: [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
    { icon: FolderKanban, label: 'My Projects', href: '/projects' },
    { icon: Camera, label: 'Submissions', href: '/submissions' },
    { icon: Upload, label: 'New Submission', href: '/submissions/new' },
  ],
}

export default function Sidebar({ user }: { user: any }) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const role = user?.profile?.role || 'contractor'
  const items = menuItems[role as keyof typeof menuItems] || menuItems.contractor

  const NavLinks = ({ onNavigate }: { onNavigate?: () => void }) => (
    <nav className="p-4 space-y-1">
      {items.map((item) => {
        const Icon = item.icon
        const isActive = pathname === item.href
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              'flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors',
              isActive
                ? 'bg-primary/10 text-primary font-semibold shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            )}
          >
            <Icon className="h-5 w-5 shrink-0" />
            <span className="font-medium">{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )

  return (
    <>
      {/* ── Desktop sidebar ───────────────────────────────────────────────── */}
      <aside className="hidden lg:block fixed left-0 top-16 w-64 h-[calc(100vh-4rem)] bg-white border-r border-slate-200 shadow-sm z-30">
        <NavLinks />
      </aside>

      {/* ── Mobile hamburger button (shown in navbar area) ────────────────── */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-3.5 left-4 z-50 flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* ── Mobile overlay backdrop ───────────────────────────────────────── */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Mobile drawer ─────────────────────────────────────────────────── */}
      <div
        className={cn(
          'lg:hidden fixed left-0 top-0 z-50 h-full w-72 bg-white shadow-2xl',
          'transform transition-transform duration-300 ease-in-out',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4">
          <Link href="/" className="flex items-center gap-3 transition-opacity hover:opacity-90">
            <div className="flex h-8 w-9 items-center justify-center rounded-lg bg-primary shadow-sm">
              <span className="text-sm font-bold text-white">GMS</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">Monitoring System</p>
              <p className="text-xs capitalize text-slate-500">{role}</p>
            </div>
          </Link>
          <button
            onClick={() => setMobileOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Drawer nav links */}
        <NavLinks onNavigate={() => setMobileOpen(false)} />
      </div>
    </>
  )
}