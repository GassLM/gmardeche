import { useGame } from './PublicLayout.jsx'
import { Card, SectionTitle } from '../lib/ui.jsx'
import { eventIcon, formatTime } from './Home.jsx'

export default function Timeline() {
  const { timeline, teams } = useGame()
  const teamById = (id) => teams.find((t) => t.id === id)

  return (
    <div className="space-y-5">
      <SectionTitle eyebrow="Le journal en direct" title="📺 Le fil de l'aventure" />

      {timeline.length === 0 ? (
        <Card className="p-6 text-center text-cream/50">L'aventure n'a pas encore commence.</Card>
      ) : (
        <div className="relative space-y-3 pl-6">
          <div className="absolute inset-y-2 left-2 w-px bg-white/15" />
          {timeline.map((e) => {
            const team = teamById(e.team_id)
            return (
              <div key={e.id} className="relative">
                <span className="absolute -left-[18px] top-3 h-3 w-3 rounded-full ring-4 ring-night"
                      style={{ background: team?.color || '#F7B733' }} />
                <Card className="p-3">
                  <div className="flex items-start gap-3">
                    <span className="text-xl">{eventIcon(e.type)}</span>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold">{e.title}</div>
                      {e.description && <div className="text-sm text-cream/70">{e.description}</div>}
                      <div className="mt-0.5 font-mono text-[11px] text-cream/45">{formatTime(e.event_time)}</div>
                    </div>
                  </div>
                </Card>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
