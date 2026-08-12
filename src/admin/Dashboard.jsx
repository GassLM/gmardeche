import { useAdmin } from './AdminApp.jsx'
import { computeScores, undoLastAction } from '../lib/api.js'
import { Card, Button } from '../lib/ui.jsx'
import { formatTime } from '../public/Home.jsx'

export default function Dashboard() {
  const { game, reload, confirm } = useAdmin()
  const scores = computeScores(game)
  const teams = game.teams
  const doneCount = game.challenges.filter((c) => c.status === 'completed').length
  const upcoming = game.challenges.filter((c) => c.status !== 'completed').length
  const cluesFound = game.clues.filter((c) => c.found).length

  async function undo() {
    if (!(await confirm('Annuler la derniere action modifiable ?'))) return
    const { error } = await undoLastAction()
    if (error) alert(error.message)
    reload()
  }

  return (
    <div className="space-y-6">
      {/* Score reel (PRIVE) */}
      <div>
        <div className="mb-2 flex items-center gap-2">
          <h2 className="font-display text-2xl uppercase">Score reel</h2>
          <span className="rounded-full bg-coral/20 px-2 py-0.5 text-[10px] font-bold uppercase text-coral">prive</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {teams.map((t) => {
            const s = scores[t.id]
            return (
              <Card key={t.id} className="p-4 text-center">
                <div className="font-display text-lg uppercase" style={{ color: t.color }}>{t.name}</div>
                <div className="font-display text-5xl text-sun2">{s?.total ?? 0}</div>
                <div className="text-[11px] uppercase text-cream/50">{s?.wins ?? 0} victoire(s)</div>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Compteurs */}
      <div className="grid grid-cols-3 gap-3">
        <Mini value={`${doneCount}`} label="Epreuves finies" />
        <Mini value={`${upcoming}`} label="A venir" />
        <Mini value={`${cluesFound}`} label="Indices trouves" />
      </div>

      {/* Detail des scores */}
      <div className="grid gap-3 sm:grid-cols-2">
        {teams.map((t) => {
          const s = scores[t.id]
          return (
            <Card key={t.id} className="p-4">
              <div className="mb-2 font-display uppercase" style={{ color: t.color }}>{t.name}</div>
              <ul className="space-y-1 text-sm">
                {s?.detail.length
                  ? s.detail.map((d, i) => (
                      <li key={i} className="flex justify-between">
                        <span className="text-cream/70">{d.label}</span>
                        <span className="font-mono text-sun2">+{d.pts}</span>
                      </li>
                    ))
                  : <li className="text-cream/40">Aucun point pour l'instant.</li>}
              </ul>
            </Card>
          )
        })}
      </div>

      {/* Historique + annuler */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="font-display text-xl uppercase">Dernieres actions</h3>
          <Button variant="ghost" onClick={undo} className="px-3 py-2 text-sm">↩︎ Annuler</Button>
        </div>
        <Card className="divide-y divide-white/5">
          {game.actions.slice(0, 12).map((a) => (
            <div key={a.id} className="flex items-center justify-between px-4 py-2 text-sm">
              <span className="text-cream/80">{prettyAction(a)}</span>
              <span className="font-mono text-[11px] text-cream/40">{formatTime(a.created_at)}</span>
            </div>
          ))}
          {game.actions.length === 0 && (
            <div className="px-4 py-4 text-center text-sm text-cream/40">Aucune action enregistree.</div>
          )}
        </Card>
      </div>
    </div>
  )
}

function Mini({ value, label }) {
  return (
    <Card className="p-3 text-center">
      <div className="font-display text-3xl text-cream">{value}</div>
      <div className="text-[10px] uppercase text-cream/50">{label}</div>
    </Card>
  )
}

function prettyAction(a) {
  const map = {
    reveal_challenge: 'Epreuve revelee',
    start_challenge: 'Epreuve passee en LIVE',
    complete_challenge: 'Vainqueur enregistre',
    update_challenge: 'Epreuve modifiee',
    create_challenge: 'Epreuve creee',
    delete_challenge: 'Epreuve supprimee',
    update_settings: 'Parametres modifies',
    create_bonus: 'Bonus attribue',
    update_clue: 'Indice modifie',
    create_clue: 'Indice cree',
    update_mystery: 'Mystere mis a jour',
    update_envelope: 'Enveloppe mise a jour',
    create_timeline: 'Evenement publie',
    undo: 'Action annulee',
  }
  return map[a.action] || a.action
}
