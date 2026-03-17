// components/layout/Navbar.tsx
'use client'

import Link from 'next/link'
import { logout } from '@/lib/actions/auth'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { LogOut, Settings, User, Key } from 'lucide-react'
import { NotificationBell } from '@/components/ui/notification-bell'


export default function Navbar({ user }: { user: any }) {
  const initials = user?.profile?.full_name
    ?.split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase() || 'U'

  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm px-4 py-3 fixed top-0 left-0 right-0 z-50">
      <div className="flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-4 pl-10 transition-opacity hover:opacity-90">
          <div className="w-12 h-10 bg-primary/90 shadow-md rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">GMS</span>
          </div>
        </Link>

        <div className="flex items-center space-x-4">
          {user?.profile?.role === 'admin' && (
            <Link href="/register">
              <Button variant="outline" size="sm">
                + Create User
              </Button>
            </Link>
          )}
          {/* Notifications */}
          <NotificationBell />
          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center space-x-2">
                <Avatar>
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium">
                    {user?.profile?.full_name}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">
                    {user?.profile?.role}
                  </p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/change-password" className="flex items-center cursor-pointer">
                  <Key className="mr-2 h-4 w-4" />
                  Change Password
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600"
                onClick={() => logout()}
              >

                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  )
}