// app/page.tsx
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MapPin, Eye, MessageSquare, Shield, ArrowRight } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Navigation Bar */}
      <nav className="bg-white/80 backdrop-blur-md shadow-sm border-b border-slate-200 sticky top-0 z-50 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-3 transition-opacity hover:opacity-90">
              <div className="w-10 h-10 bg-primary/90 shadow-md rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  <span className="hidden sm:inline">Government Monitoring System</span>
                  <span className="sm:hidden">GMS</span>
                </h1>
                <p className="text-xs text-slate-500 font-medium">
                  Transparent Infrastructure Tracking
                </p>
              </div>
            </Link>
            <Link href="/login">
              <Button variant="outline" className="text-slate-700 border-slate-300 hover:bg-slate-50">
                Staff Login
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative overflow-hidden bg-white">
        {/* Subtle Background Elements */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-primary opacity-20 blur-[100px]"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32 relative z-10">
          <div className="text-center max-w-4xl mx-auto duration-700 animate-in fade-in slide-in-from-bottom-8">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-6">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-primary opacity-40"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              Public Transparency Portal
            </span>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-slate-900 tracking-tight mb-8 leading-tight">
              Track Government Projects <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">
                In Real-Time
              </span>
            </h1>
            <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
              View verified progress on infrastructure projects across Ghana. Explore locations, track budgets, and ensure accountability through our public transparency portal.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/public/map">
                <Button size="lg" className="h-14 px-8 text-base bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/30 group">
                  <MapPin className="mr-2 h-5 w-5" />
                  Explore the Map
                  <ArrowRight className="ml-2 h-4 w-4 opacity-70 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/public/tips">
                <Button size="lg" variant="outline" className="h-14 px-8 text-base border-slate-200 hover:bg-slate-50 text-slate-700 bg-white">
                  <MessageSquare className="mr-2 h-5 w-5" />
                  Report a Concern
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-slate-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-x divide-slate-800">
            {[
              { label: 'Active Projects', value: '150+' },
              { label: 'GPS Verified', value: '95%' },
              { label: 'Total Budget Tracked', value: '₵450M' },
              { label: 'Transparency', value: '100%' },
            ].map((stat, i) => (
              <div key={i} className="flex flex-col items-center justify-center">
                <div className="text-4xl md:text-5xl font-bold mb-2 tracking-tight text-white">
                  {stat.value}
                </div>
                <div className="text-sm font-medium text-slate-400 uppercase tracking-wider">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="flex-1 bg-slate-50 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">How the Portal Works</h2>
            <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">Providing complete visibility into ongoing public infrastructure developments.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="bg-white border-slate-200 shadow-sm hover:shadow-xl hover:border-primary/20 transition-all duration-300 group">
              <CardHeader className="p-8">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                  <MapPin className="h-7 w-7 text-primary group-hover:text-white" />
                </div>
                <CardTitle className="text-xl text-slate-900">Interactive Map</CardTitle>
                <CardDescription className="text-base mt-3 text-slate-600 leading-relaxed">
                  Navigate through all government infrastructure projects on our interactive map. Filter by region and see live status updates.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-white border-slate-200 shadow-sm hover:shadow-xl hover:border-primary/20 transition-all duration-300 group">
              <CardHeader className="p-8">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mb-6 group-hover:bg-blue-500 group-hover:text-white transition-colors duration-300">
                  <Eye className="h-7 w-7 text-blue-600 group-hover:text-white" />
                </div>
                <CardTitle className="text-xl text-slate-900">Verified Progress</CardTitle>
                <CardDescription className="text-base mt-3 text-slate-600 leading-relaxed">
                  Review GPS-verified site photos submitted by contractors. Track completion percentages alongside financial utilization.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-white border-slate-200 shadow-sm hover:shadow-xl hover:border-primary/20 transition-all duration-300 group">
              <CardHeader className="p-8">
                <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center mb-6 group-hover:bg-amber-500 group-hover:text-white transition-colors duration-300">
                  <MessageSquare className="h-7 w-7 text-amber-600 group-hover:text-white" />
                </div>
                <CardTitle className="text-xl text-slate-900">Anonymous Reports</CardTitle>
                <CardDescription className="text-base mt-3 text-slate-600 leading-relaxed">
                  Notice an issue onsite? Submit tips securely and anonymously regarding project quality, delays, or suspected irregularities.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 text-slate-600 py-10 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-slate-400" />
            <span className="font-semibold text-slate-800">Government Monitoring System</span>
          </div>
          <div className="text-sm text-slate-500 text-center md:text-right">
            <p>© {new Date().getFullYear()} Government of Ghana - Public Portal</p>
            <p className="mt-1">Promoting transparency and accountability in public projects.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}