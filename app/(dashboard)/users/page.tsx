// app/(dashboard)/users/page.tsx
import { createClient } from '@/lib/supabase/server'
import { getUsers, getUserStats, updateUserStatus } from '@/lib/actions/users'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import {
  Users, Shield, HardHat, UserCheck,
  UserX, Plus, Search, CheckCircle2,
  XCircle, Clock, AlertTriangle,
} from 'lucide-react'
import { UserStatusButton } from '@/components/users/UserStatusButton'

export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: Promise<{ role?: string; status?: string }>
}

const ROLE_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  admin:      { label: 'Admin',      icon: Shield,    color: 'text-purple-600 bg-purple-50 border-purple-200' },
  official:   { label: 'Official',   icon: UserCheck, color: 'text-blue-600 bg-blue-50 border-blue-200' },
  contractor: { label: 'Contractor', icon: HardHat,   color: 'text-amber-600 bg-amber-50 border-amber-200' },
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  active:    { label: 'Active',    color: 'text-green-700 bg-green-50 border-green-200' },
  inactive:  { label: 'Inactive',  color: 'text-slate-600 bg-slate-50 border-slate-200' },
  suspended: { label: 'Suspended', color: 'text-red-700 bg-red-50 border-red-200' },
}

export default async function UsersPage({ searchParams }: PageProps) {
  const { role, status } = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user?.id ?? '')
    .single()

  if (profile?.role !== 'admin') notFound()

  const [{ data: users }, stats] = await Promise.all([
    getUsers({ role, status }),
    getUserStats(),
  ])

  const ROLE_TABS = [
    { key: 'all',        label: 'All',         count: stats.total },
    { key: 'admin',      label: 'Admins',      count: stats.admins },
    { key: 'official',   label: 'Officials',   count: stats.officials },
    { key: 'contractor', label: 'Contractors', count: stats.contractors },
  ]

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
          <p className="mt-1 text-slate-500">
            Manage system users — activate, suspend, and monitor accounts
          </p>
        </div>
        <Link
          href="/register"
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Create User
        </Link>
      </div>

      {/* Stats row */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Total Users',  value: stats.total,     icon: Users,     bg: 'bg-slate-50',   color: 'text-slate-600' },
          { label: 'Active',       value: stats.active,    icon: CheckCircle2, bg: 'bg-green-50', color: 'text-green-600' },
          { label: 'Suspended',    value: stats.suspended, icon: XCircle,   bg: 'bg-red-50',     color: 'text-red-600' },
          { label: 'Contractors',  value: stats.contractors, icon: HardHat, bg: 'bg-amber-50',   color: 'text-amber-600' },
        ].map(stat => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wide">{stat.label}</p>
                  <p className="mt-1 text-2xl font-bold text-slate-900">{stat.value}</p>
                </div>
                <div className={`rounded-xl p-2.5 ${stat.bg}`}>
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Role filter tabs */}
      <div className="mb-4 flex gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-slate-50 p-1">
        {ROLE_TABS.map(tab => {
          const active = (role ?? 'all') === tab.key
          return (
            <Link
              key={tab.key}
              href={tab.key === 'all' ? '/users' : `/users?role=${tab.key}`}
              className={`
                flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all
                ${active ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}
              `}
            >
              {tab.label}
              <span className={`rounded-full px-1.5 py-0.5 text-xs ${
                active ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-500'
              }`}>
                {tab.count}
              </span>
            </Link>
          )
        })}
      </div>

      {/* Users table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {!users || users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <Users className="mb-3 h-10 w-10 opacity-30" />
            <p className="text-sm">No users found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">User</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Role</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400 hidden sm:table-cell">Phone</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400 hidden md:table-cell">Joined</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {users.map((u: any) => {
                  const roleCfg = ROLE_CONFIG[u.role] ?? ROLE_CONFIG.contractor
                  const statusCfg = STATUS_CONFIG[u.status] ?? STATUS_CONFIG.active
                  const RoleIcon = roleCfg.icon
                  const initials = u.full_name
                    ?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) ?? '??'

                  return (
                    <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                      {/* User */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-xs font-bold text-white">
                            {initials}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-800">{u.full_name}</p>
                            <p className="text-xs text-slate-400">{u.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${roleCfg.color}`}>
                          <RoleIcon className="h-3 w-3" />
                          {roleCfg.label}
                        </span>
                      </td>

                      {/* Phone */}
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span className="text-sm text-slate-500">{u.phone ?? '—'}</span>
                      </td>

                      {/* Joined */}
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="text-sm text-slate-500">
                          {format(new Date(u.created_at), 'MMM d, yyyy')}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusCfg.color}`}>
                          {statusCfg.label}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right">
                        <UserStatusButton
                          userId={u.id}
                          currentStatus={u.status}
                          userName={u.full_name}
                        />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}