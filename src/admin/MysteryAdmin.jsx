import { useState } from 'react'
import { useAdmin } from './AdminApp.jsx'
import { updateMystery } from '../lib/api.js'
import { Card, Button } from '../lib/ui.jsx'
import { Field, Input, Textarea, Select, Toggle } from './fields.jsx'

export default function MysteryAdmin() {
  const { game, reload, confirm } = useAdmin()
  const m = game.mystery
  const [form, setForm] = useState({
    solution: m?.solution || '', bonus_points: m?.bonus_points ?? 0,
    solved: m?.solved || false, solved_by_team_id: m?.solved_by_team_id || game.teams[0]?.id || '',
  })
  if (!m) return <p className="text-cream/60">Aucune ligne "mystere". Relance le seed.</p>
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  async function save() {
    await updateMystery(m.id, {
      solution: form.solution, bonus_points: Number(form.bonus_points) || 0,
    })
    reload()
  }
  async function toggleSolved() {
    const willSolve = !form.solved
    if (willSolve && !(await confirm('Marquer le mystere comme resolu ?'))) return
    const team = game.teams.find((t) => t.id === form.solved_by_team_id)
    await updateMystery(m.id, {
      solved: willSolve,
      solved_by_team_id: willSolve ? form.solved_by_team_id : null,
      solved_at: willSolve ? new Date().toISOString() : null,
    }, willSolve ? { timeline: ['mystery', 'Le Mystere de la Maison est resolu !', team ? `Par ${team.name}` : null, form.solved_by_team_id, true] } : {})
    setForm({ ...form, solved: willSolve })
    reload()
  }

  return (
    <div className="space-y-4">
      <h2 className="font-display text-2xl uppercase">🔍 Mystere de la Maison</h2>

      <Card className="space-y-3 p-4 ring-1 ring-coral/30">
        <div className="text-xs font-bold uppercase text-coral">Solution (strictement privee, jamais exposee)</div>
        <Textarea rows={3} value={form.solution} onChange={set('solution')} />
        <Field label="Bonus points a la resolution (prive)">
          <Input type="number" value={form.bonus_points} onChange={set('bonus_points')} />
        </Field>
        <Button variant="primary" className="w-full py-2.5" onClick={save}>Enregistrer</Button>
      </Card>

      <Card className="space-y-3 p-4">
        <Field label="Equipe qui a resolu">
          <Select value={form.solved_by_team_id} onChange={set('solved_by_team_id')}>
            {game.teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </Select>
        </Field>
        <Button variant={form.solved ? 'danger' : 'sun'} className="w-full py-2.5" onClick={toggleSolved}>
          {form.solved ? 'Annuler la resolution' : 'Marquer comme resolu'}
        </Button>
        {m.solved && <p className="text-center text-sm text-sun2">🗝️ Mystere resolu.</p>}
      </Card>
    </div>
  )
}
