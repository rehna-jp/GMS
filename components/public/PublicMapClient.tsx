// components/public/PublicMapClient.tsx
'use client'

import { useState } from 'react'

interface Project {
  id: string
  name: string
  project_number: string
  status: string
  gps_latitude: number
  gps_longitude: number
  location_region: string
  completion_percentage: number
}

const STATUS_COLORS: Record<string, string> = {
  active:    '#22c55e',
  completed: '#3b82f6',
  flagged:   '#ef4444',
  delayed:   '#f59e0b',
  suspended: '#94a3b8',
}

export function PublicMapClient({ projects }: { projects: Project[] }) {
  const [selected, setSelected] = useState<Project | null>(null)

  // Build Google Maps embed URL with markers
  // Center on Ghana
  const ghanaLat = 7.9465
  const ghanaLng = -1.0232
  const zoom = 7

  // Build markers query string for Google Maps embed
  const markersQuery = projects
    .map(p => `${p.gps_latitude},${p.gps_longitude}`)
    .slice(0, 20) // Google Maps embed supports limited markers
    .join('|')

  // Use iframe embed centered on Ghana
  const mapSrc = `https://maps.google.com/maps?q=${ghanaLat},${ghanaLng}&z=${zoom}&output=embed`

  return (
    <div className="relative">
      {/* Google Maps iframe */}
      <iframe
        src={mapSrc}
        width="100%"
        height="420"
        style={{ border: 0 }}
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        className="w-full"
      />

      {/* Project pins overlay — shows clickable project list below map */}
      <div className="border-t border-slate-100 p-3">
        <p className="mb-2 text-xs font-medium text-slate-500">
          Click a project below to view its location:
        </p>
        <div className="flex flex-wrap gap-2">
          {projects.slice(0, 12).map(project => (
            <a
              key={project.id}
              href={`https://www.google.com/maps?q=${project.gps_latitude},${project.gps_longitude}&z=15`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 hover:border-blue-300 hover:text-blue-600 transition-colors shadow-sm"
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: STATUS_COLORS[project.status] ?? '#94a3b8' }}
              />
              {project.name.length > 20 ? project.name.slice(0, 20) + '…' : project.name}
            </a>
          ))}
          {projects.length > 12 && (
            <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-400">
              +{projects.length - 12} more
            </span>
          )}
        </div>

        {/* Legend */}
        <div className="mt-3 flex flex-wrap gap-3">
          {Object.entries(STATUS_COLORS).map(([status, color]) => (
            <div key={status} className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
              <span className="capitalize">{status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}