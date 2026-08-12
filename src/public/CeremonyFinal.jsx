import { useEffect, useState } from 'react'
import { fireConfetti } from './Ranking.jsx'

// Revelation finale plein ecran : decompte 3-2-1, scores, vainqueur.
export function FinalRevealScreen({ scores }) {
  const [count, setCount] = useState(3)
  const [done, setDone] = useState(false)
  const sorted = [...scores].sort((a, b) => b.total - a.total)
  const winner = sorted[0]

  useEffect(() => {
    if (count > 0) {
      const t = setTimeout(() => setCount((c) => c - 1), 1000)
      return () => clearTimeout(t)
    }
    setDone(true)
    fireConfetti()
    const id = setInterval(fireConfetti, 2500)
    return () => clearInterval(id)
  }, [count])

  if (!done) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div key={count} className="font-display text-[16rem] leading-none text-sun2 animate-popin">
          {count === 0 ? 'GO' : count}
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-10 p-8">
      <div className="grid w-full max-w-4xl grid-cols-2 gap-6">
        {sorted.slice(0, 2).map((s, i) => (
          <div key={s.team_id}
               className="animate-popin rounded-3xl bg-white/5 p-8 text-center ring-1 ring-white/10"
               style={{ animationDelay: `${i * 0.2}s` }}>
            <div className="font-display text-3xl uppercase" style={{ color: s.color }}>{s.name}</div>
            <div className="mt-4 font-display text-8xl text-sun2">{s.total}</div>
            <div className="font-display text-xl uppercase text-cream/60">points</div>
          </div>
        ))}
      </div>

      {winner && (
        <div className="animate-popin text-center" style={{ animationDelay: '0.6s' }}>
          <div className="text-7xl">🏆</div>
          <div className="mt-2 font-display text-6xl uppercase text-shimmer">{winner.name}</div>
          <div className="font-display text-3xl uppercase text-cream/80">Grands vainqueurs</div>
          <div className="mt-3 font-mono text-sm uppercase tracking-[.3em] text-cream/50">
            Ardeche 2026
          </div>
        </div>
      )}
    </div>
  )
}
