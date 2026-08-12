import { useEffect, useState } from 'react'
import confetti from 'canvas-confetti'
import { useGame } from './PublicLayout.jsx'
import { Card, SectionTitle } from '../lib/ui.jsx'

export default function Ranking() {
  const { finalScores, settings } = useGame()
  const revealed = settings?.reveal_scores && finalScores.length > 0

  if (!revealed) {
    return (
      <div className="space-y-5">
        <SectionTitle eyebrow="Le verdict" title="🏆 Classement general" />
        <Card className="flex flex-col items-center gap-4 p-10 text-center">
          <div className="text-6xl animate-floaty">🔒</div>
          <div className="font-display text-3xl uppercase text-shimmer">Classement secret</div>
          <p className="max-w-xs text-cream/70">
            Les scores seront reveles lors de la ceremonie finale. Aucun chiffre n'est disponible avant.
          </p>
        </Card>
      </div>
    )
  }

  return <FinalReveal scores={finalScores} />
}

function FinalReveal({ scores }) {
  const [count, setCount] = useState(3)
  const [done, setDone] = useState(false)
  const sorted = [...scores].sort((a, b) => b.total - a.total)
  const winner = sorted[0]

  useEffect(() => {
    if (count > 0) {
      const t = setTimeout(() => setCount((c) => c - 1), 900)
      return () => clearTimeout(t)
    }
    setDone(true)
    fireConfetti()
  }, [count])

  if (!done) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <div key={count} className="font-display text-[9rem] leading-none text-sun2 animate-popin">
          {count === 0 ? 'GO' : count}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <SectionTitle eyebrow="Le verdict" title="🏆 Classement final" />
      <div className="space-y-4">
        {sorted.map((s, i) => (
          <Card key={s.team_id}
            className={`animate-popin p-5 ${i === 0 ? 'ring-2 ring-sun/70' : ''}`}
            style={{ animationDelay: `${i * 0.15}s` }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="font-display text-3xl text-cream/40">{i + 1}</span>
                <span className="font-display text-2xl uppercase" style={{ color: s.color }}>{s.name}</span>
              </div>
              <div className="font-display text-4xl text-sun2">{s.total}</div>
            </div>
          </Card>
        ))}
      </div>

      {winner && (
        <Card className="animate-popin p-8 text-center ring-2 ring-sun/60"
              style={{ animationDelay: '0.5s' }}>
          <div className="text-5xl">🏆</div>
          <div className="mt-2 font-display text-4xl uppercase text-shimmer">{winner.name}</div>
          <div className="mt-1 font-display text-xl uppercase text-cream/80">Grands vainqueurs</div>
          <div className="mt-3 font-mono text-xs uppercase tracking-widest text-cream/50">
            La Cuvee des FDP · Saison 2 · Ardeche 2026
          </div>
        </Card>
      )}
    </div>
  )
}

export function fireConfetti() {
  const end = Date.now() + 1500
  const colors = ['#F7B733', '#17C3B2', '#FF5A5F', '#2E86FF', '#FFD166']
  ;(function frame() {
    confetti({ particleCount: 4, angle: 60, spread: 60, origin: { x: 0 }, colors })
    confetti({ particleCount: 4, angle: 120, spread: 60, origin: { x: 1 }, colors })
    if (Date.now() < end) requestAnimationFrame(frame)
  })()
}
