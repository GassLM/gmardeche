import { useState } from 'react'
import { useAdmin } from './AdminApp.jsx'
import { updateEnvelope } from '../lib/api.js'
import { Card, Button } from '../lib/ui.jsx'
import { Field, Input, Textarea, Select, Toggle } from './fields.jsx'

export default function EnvelopesAdmin() {
  const { game, reload } = useAdmin()
  return (
    <div className="space-y-4">
      <h2 className="font-display text-2xl uppercase">Enveloppes</h2>
      {game.envelopes.map((e) => (
        <EnvelopeRow key={e.id} e={e} teams={game.teams} reload={reload} />
      ))}
      {game.envelopes.length === 0 && <p className="text-cream/50">Aucune enveloppe (relance le seed).</p>}
    </div>
  )
}

function EnvelopeRow({ e, teams, reload }) {
  const [form, setForm] = useState({
    owner_team_id: e.owner_team_id || '', points: e.points ?? 0,
    message: e.message || '', opened: e.opened, revealed: e.revealed,
  })
  const set = (k) => (ev) => setForm({ ...form, [k]: ev.target.value })

  async function save(extra = {}) {
    await updateEnvelope(e.id, {
      owner_team_id: form.owner_team_id || null, points: Number(form.points) || 0,
      message: form.message, ...extra,
    })
    reload()
  }

  return (
    <Card className="space-y-3 p-4">
      <div className="font-display text-xl uppercase">Enveloppe n°{e.number}</div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Equipe qui la possede">
          <Select value={form.owner_team_id} onChange={set('owner_team_id')}>
            <option value="">-</option>
            {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </Select>
        </Field>
        <Field label="Points (prive)"><Input type="number" value={form.points} onChange={set('points')} /></Field>
      </div>
      <Field label="Contenu de la lettre (prive tant que non revele)">
        <Textarea rows={2} value={form.message} onChange={set('message')} />
      </Field>
      <div className="grid grid-cols-2 gap-2">
        <Toggle checked={form.opened} label="Ouverte"
          onChange={(v) => { setForm({ ...form, opened: v }); updateEnvelope(e.id, { opened: v }).then(reload) }} />
        <Toggle checked={form.revealed} label="Lettre revelee"
          onChange={(v) => { setForm({ ...form, revealed: v }); updateEnvelope(e.id, { revealed: v }).then(reload) }} />
      </div>
      <Button variant="primary" className="w-full py-2.5" onClick={() => save()}>Enregistrer</Button>
    </Card>
  )
}
