// app/page.tsx
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MapPin, Eye, MessageSquare, Shield } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Ghana Project Monitor
                </h1>
                <p className="text-xs text-gray-500">
                  Transparent Infrastructure Tracking
                </p>
              </div>
            </div>
            <Link href="/login">
              <Button variant="outline">Staff Login</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Track Government Projects
            <br />
            <span className="text-blue-600">In Real-Time</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            View progress on infrastructure projects across Ghana. 
            See verified photos, GPS locations, and budget information. 
            Report concerns anonymously.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/public/map">
              <Button size="lg" className="text-lg px-8">
                <MapPin className="mr-2 h-5 w-5" />
                View Project Map
              </Button>
            </Link>
            <Link href="/public/tips">
              <Button size="lg" variant="outline" className="text-lg px-8">
                <MessageSquare className="mr-2 h-5 w-5" />
                Report a Concern
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-3 gap-8">
          <Card>
            <CardHeader>
              <MapPin className="h-12 w-12 text-blue-600 mb-4" />
              <CardTitle>Interactive Map</CardTitle>
              <CardDescription>
                View all government infrastructure projects on an interactive map 
                with real-time status updates
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Eye className="h-12 w-12 text-blue-600 mb-4" />
              <CardTitle>Verified Progress</CardTitle>
              <CardDescription>
                See GPS-verified photos, completion percentages, and budget 
                utilization for every project
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <MessageSquare className="h-12 w-12 text-blue-600 mb-4" />
              <CardTitle>Anonymous Tips</CardTitle>
              <CardDescription>
                Report concerns about project quality or irregularities 
                completely anonymously
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-blue-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-2">150+</div>
              <div className="text-blue-100">Active Projects</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">95%</div>
              <div className="text-blue-100">GPS Verified</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">₵450M</div>
              <div className="text-blue-100">Total Budget</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">100%</div>
              <div className="text-blue-100">Transparent</div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p>© 2026 Government of Ghana - Ministry of Infrastructure</p>
          <p className="text-sm text-gray-500 mt-2">
            Promoting transparency and accountability in public projects
          </p>
        </div>
      </footer>
    </div>
  )
}