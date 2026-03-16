// lib/actions/analytics.ts
'use server'

import { createClient } from '@/lib/supabase/server'

// ── Admin / Official stats ────────────────────────────────────────────────────

export async function getAdminStats() {
  const supabase = await createClient()

  const [
    { count: totalProjects },
    { count: activeProjects },
    { count: flaggedProjects },
    { count: totalSubmissions },
    { count: pendingSubmissions },
    { count: approvedSubmissions },
    { count: flaggedSubmissions },
    { count: totalUsers },
    { count: totalContractors },
  ] = await Promise.all([
    supabase.from('projects').select('*', { count: 'exact', head: true }),
    supabase.from('projects').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('projects').select('*', { count: 'exact', head: true }).eq('status', 'flagged'),
    supabase.from('submissions').select('*', { count: 'exact', head: true }),
    supabase.from('submissions').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('submissions').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
    supabase.from('submissions').select('*', { count: 'exact', head: true }).eq('status', 'flagged'),
    supabase.from('users').select('*', { count: 'exact', head: true }),
    supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'contractor'),
  ])

  return {
    totalProjects: totalProjects ?? 0,
    activeProjects: activeProjects ?? 0,
    flaggedProjects: flaggedProjects ?? 0,
    totalSubmissions: totalSubmissions ?? 0,
    pendingSubmissions: pendingSubmissions ?? 0,
    approvedSubmissions: approvedSubmissions ?? 0,
    flaggedSubmissions: flaggedSubmissions ?? 0,
    totalUsers: totalUsers ?? 0,
    totalContractors: totalContractors ?? 0,
    gpsVerificationRate: totalSubmissions
      ? Math.round(((approvedSubmissions ?? 0) / totalSubmissions) * 100)
      : 0,
  }
}

export async function getOfficialStats(officialId: string) {
  const supabase = await createClient()

  const [
    { count: myProjects },
    { count: pendingReviews },
    { count: underReview },
    { count: approvedThisMonth },
    { count: flaggedThisMonth },
  ] = await Promise.all([
    supabase.from('projects').select('*', { count: 'exact', head: true }).eq('primary_official_id', officialId),
    supabase.from('submissions').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('submissions').select('*', { count: 'exact', head: true }).eq('status', 'under_review'),
    supabase.from('submissions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'approved')
      .gte('reviewed_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
    supabase.from('submissions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'flagged')
      .gte('reviewed_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
  ])

  return {
    myProjects: myProjects ?? 0,
    pendingReviews: pendingReviews ?? 0,
    underReview: underReview ?? 0,
    approvedThisMonth: approvedThisMonth ?? 0,
    flaggedThisMonth: flaggedThisMonth ?? 0,
  }
}

export async function getContractorStats(contractorId: string) {
  const supabase = await createClient()

  const [
    { count: myProjects },
    { count: totalSubmissions },
    { count: pendingSubmissions },
    { count: approvedSubmissions },
    { count: flaggedSubmissions },
    { count: changesRequested },
  ] = await Promise.all([
    supabase.from('projects').select('*', { count: 'exact', head: true }).eq('contractor_id', contractorId),
    supabase.from('submissions').select('*', { count: 'exact', head: true }).eq('contractor_id', contractorId),
    supabase.from('submissions').select('*', { count: 'exact', head: true }).eq('contractor_id', contractorId).eq('status', 'pending'),
    supabase.from('submissions').select('*', { count: 'exact', head: true }).eq('contractor_id', contractorId).eq('status', 'approved'),
    supabase.from('submissions').select('*', { count: 'exact', head: true }).eq('contractor_id', contractorId).eq('status', 'flagged'),
    supabase.from('submissions').select('*', { count: 'exact', head: true }).eq('contractor_id', contractorId).eq('status', 'under_review'),
  ])

  return {
    myProjects: myProjects ?? 0,
    totalSubmissions: totalSubmissions ?? 0,
    pendingSubmissions: pendingSubmissions ?? 0,
    approvedSubmissions: approvedSubmissions ?? 0,
    flaggedSubmissions: flaggedSubmissions ?? 0,
    changesRequested: changesRequested ?? 0,
    approvalRate: totalSubmissions
      ? Math.round(((approvedSubmissions ?? 0) / totalSubmissions) * 100)
      : 0,
  }
}

// ── Chart data ────────────────────────────────────────────────────────────────

export async function getSubmissionsByStatus() {
  const supabase = await createClient()

  const { data } = await supabase
    .from('submissions')
    .select('status')

  if (!data) return []

  const counts: Record<string, number> = {}
  data.forEach(s => {
    counts[s.status] = (counts[s.status] ?? 0) + 1
  })

  return Object.entries(counts).map(([status, count]) => ({ status, count }))
}

export async function getProjectsByRegion() {
  const supabase = await createClient()

  const { data } = await supabase
    .from('projects')
    .select('location_region')

  if (!data) return []

  const counts: Record<string, number> = {}
  data.forEach(p => {
    const region = p.location_region ?? 'Unknown'
    counts[region] = (counts[region] ?? 0) + 1
  })

  return Object.entries(counts)
    .map(([region, count]) => ({ region, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8) // top 8 regions
}

export async function getMonthlySubmissionTrend() {
  const supabase = await createClient()

  // Last 6 months
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5)
  sixMonthsAgo.setDate(1)

  const { data } = await supabase
    .from('submissions')
    .select('submitted_at, status')
    .gte('submitted_at', sixMonthsAgo.toISOString())
    .order('submitted_at')

  if (!data) return []

  // Group by month
  const months: Record<string, { total: number; approved: number; flagged: number }> = {}

  data.forEach(s => {
    const date = new Date(s.submitted_at)
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    const label = date.toLocaleDateString('en-GH', { month: 'short', year: '2-digit' })

    if (!months[key]) months[key] = { total: 0, approved: 0, flagged: 0 }
    months[key].total++
    if (s.status === 'approved') months[key].approved++
    if (s.status === 'flagged') months[key].flagged++
  })

  return Object.entries(months).map(([key, val]) => ({
    month: key,
    label: new Date(key).toLocaleDateString('en-GH', { month: 'short', year: '2-digit' }),
    ...val,
  }))
}

// ── Recent activity feed ──────────────────────────────────────────────────────

export async function getRecentActivity(limit = 8) {
  const supabase = await createClient()

  const { data } = await supabase
    .from('audit_logs')
    .select('*, users(full_name, role)')
    .eq('table_name', 'submissions')
    .order('created_at', { ascending: false })
    .limit(limit)

  return data ?? []
}

// ── Pending reviews for officials ─────────────────────────────────────────────

export async function getPendingReviews(limit = 5) {
  const supabase = await createClient()

  const { data } = await supabase
    .from('submissions')
    .select(`
      id, submission_number, status, submitted_at, completion_percentage,
      projects(name, location_region),
      users!submissions_contractor_id_fkey(full_name)
    `)
    .in('status', ['pending', 'under_review'])
    .order('submitted_at', { ascending: true })
    .limit(limit)

  return data ?? []
}

// ── Contractor's projects with live progress ──────────────────────────────────

export async function getContractorProjects(contractorId: string) {
  const supabase = await createClient()

  const { data } = await supabase
    .from('projects')
    .select(`
      id, name, project_number, status, completion_percentage,
      location_region, end_date,
      milestones(id, name, status, completion_percentage)
    `)
    .eq('contractor_id', contractorId)
    .order('created_at', { ascending: false })

  return data ?? []
}