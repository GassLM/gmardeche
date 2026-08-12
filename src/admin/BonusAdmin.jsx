import { useState } from 'react'
import { useAdmin } from './AdminApp.jsx'
import { createBonus, updateBonus, deleteBonus } from '../lib/api.js'
import { Card, Button, Lock } from '../lib/ui.jsx'
import { Field, Input, Toggle } from './fields.jsx'

// Les 11 bonus sont pre-charges par le seed (2 pts chacun, non attribues).
// Ici on les attribue a une equipe (ou "non attribue"), on choisit de les
// rendre publics ou non, et on peut en ajouter / supprimer a la volee.
export default function BonusAdmin() {
  const { game, reload, confirm } = useAdmin()
  const [form, setForm] = useState({ points: 2, reason: '', is_public: false })
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  async function add() {
    if (!form.reason.trim()) return
    await createBonus({
      team_id: null, points: Number(form.points) || 0,
      reason: form.reason.trim(), is_public: form.is_public,
    })
    setForm({ points: 2, reason: '', is_public: false })
    reload()
  }
  async function setTeam(id, team_id) { await updateBonus(id, { team_id: team_id || null }); reload() }
  async function del(id) {
    if (!(await confirm('Supprimer ce bonus ?'))) return
    await deleteBonus(id); reload()
  }

  const total = game.teams.map((t) => ({
    t, n: game.bonuses.filter((b) => b.team_id === t.id).length,
    pts: game.bonuses.filter((b) => b.team_id === t.id).reduce((s, b) => s + (b.points || 0), 0),
  }))

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <h2 className="font-display text-2xl uppercase">Bonus (2 pts)</h2>
        <div className="flex gap-3 text-right">
          {total.map(({ t, n, pts }) => (
            <div key={t.id} className="text-xs">
              <div className="font-display uppercase" style={{ color: t.color }}>{t.name}</div>
              <div className="font-mono text-cream/60">{n} bonus - +{pts}</div>
            </div>
          ))}
        </div>
      </div>

      <p className="text-xs text-cream/50">
        Attribue chaque bonus a une equipe pour qu'il compte dans le score. "Non attribue" = ignore.
        Les montants restent secrets cote public.
      </p>

      <div className="space-y-2">
        {game.bonuses.map((b) => {
          const t = game.teams.find((x) => x.id === b.team_id)
          return (
            <Card key={b.id} className="flex flex-wrap items-center justify-between gap-2 p-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sun2">+{b.points}</span>
                  {b.is_public
                    ? <span className="rounded bg-sun/20 px-2 py-0.5 text-[10px] font-bold text-sun">public</span>
                    : <Lock>prive</Lock>}
                </div>
                <div className="truncate text-sm text-cream/80">{b.reason || '-'}</div>
              </div>
              <div className="flex items-center gap-1">
                <select
                  value={b.team_id || ''}
                  onChange={(e) => setTeam(b.id, e.target.value)}
                  className="rounded-lg border border-white/10 bg-night2 px-2 py-1.5 text-xs"
                  style={{ color: t?.color || undefined }}
                >
                  <option value="">Non attribue</option>
                  {game.teams.map((tm) => <option key={tm.id} value={tm.id}>{tm.name}</option>)}
                </select>
                <button onClick={async () => { await updateBonus(b.id, { is_public: !b.is_public }); reload() }}
                  className="rounded-lg bg-white/5 px-2 py-1.5 text-xs">{b.is_public ? 'Cacher' : 'Publier'}</button>
                <button onClick={() => del(b.id)} className="rounded-lg bg-coral/20 px-2 py-1.5 text-xs text-coral">✕</button>
              </div>
            </Card>
          )
        })}
        {game.bonuses.length === 0 && <p className="text-sm text-cream/40">Aucun bonus.</p>}
      </div>

      <Card className="space-y-3 p-4">
        <div className="text-sm font-bold text-cream/70">Ajouter un bonus supplementaire</div>
        <div className="grid grid-cols-4 gap-3">
          <Field label="Points"><Input type="number" value={form.points} onChange={set('points')} /></Field>
          <div className="col-span-3">
            <Field label="Motif"><Input value={form.reason} onChange={set('reason')} placeholder="ex : Jeu 3 : fou rire collectif" /></Field>
          </div>
        </div>
        <Toggle checked={form.is_public} onChange={(v) => setForm({ ...form, is_public: v })}
          label="Visible publiquement" hint="Affiche 'bonus recu' cote public, jamais le montant." />
        <Button variant="sun" className="w-full py-2.5" onClick={add}>Ajouter (non attribue)</Button>
      </Card>
    </div>
  )
}
