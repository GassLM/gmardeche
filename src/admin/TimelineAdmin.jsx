import { useState } from 'react'
import { useAdmin } from './AdminApp.jsx'
import { createTimelineEvent, deleteTimelineEvent } from '../lib/api.js'
import { Card, Button } from '../lib/ui.jsx'
import { Field, Input, Textarea, Select, Toggle } from './fields.jsx'
import { formatTime, eventIcon } from '../public/Home.jsx'

const TYPES = [
  ['info', '🎬 Info'], ['challenge', '🎯 Epreuve'], ['live', '🔴 Direct'],
  ['win', '🏆 Victoire'], ['clue', '🔍 Indice'], ['mystery', '🗝️ Mystere'],
]

export default function TimelineAdmin() {
  const { game, reload, confirm } = useAdmin()
  const [form, setForm] = useState({
    type: 'info', title: '', description: '', team_id: '', is_public: true,
  })
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  async function publish() {
    if (!form.title.trim()) return
    await createTimelineEvent({
      type: form.type, title: form.title, description: form.description,
      team_id: form.team_id || null, is_public: form.is_public,
    })
    setForm({ ...form, title: '', description: '' })
    reload()
  }
  async function del(id) {
    if (!(await confirm('Supprimer cet evenement ?'))) return
    await deleteTimelineEvent(id); reload()
  }

  return (
    <div className="space-y-4">
      <h2 className="font-display text-2xl uppercase">Fil de l'aventure</h2>
      <p className="text-sm text-cream/50">
        Certains evenements (revelation, LIVE, victoire, indice trouve, mystere resolu) sont
        deja generes automatiquement. Ici tu peux en ajouter a la main.
      </p>

      <Card className="space-y-3 p-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Type">
            <Select value={form.type} onChange={set('type')}>
              {TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </Select>
          </Field>
          <Field label="Equipe (optionnel)">
            <Select value={form.team_id} onChange={set('team_id')}>
              <option value="">-</option>
              {game.teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </Select>
          </Field>
        </div>
        <Field label="Titre"><Input value={form.title} onChange={set('title')} placeholder="ex : Le jeu commence !" /></Field>
        <Field label="Description (optionnel)"><Textarea rows={2} value={form.description} onChange={set('description')} /></Field>
        <Toggle checked={form.is_public} onChange={(v) => setForm({ ...form, is_public: v })} label="Public" />
        <Button variant="sun" className="w-full py-2.5" onClick={publish}>Publier</Button>
      </Card>

      <div className="space-y-2">
        {game.timeline.map((e) => (
          <Card key={e.id} className="flex items-center justify-between p-3">
            <div className="flex items-center gap-3">
              <span className="text-xl">{eventIcon(e.type)}</span>
              <div>
                <div className="font-semibold">{e.title} {!e.is_public && <span className="text-xs text-cream/40">(prive)</span>}</div>
                <div className="font-mono text-[11px] text-cream/40">{formatTime(e.event_time)}</div>
              </div>
            </div>
            <button onClick={() => del(e.id)} className="rounded-lg bg-coral/20 px-2 py-1 text-xs text-coral">✕</button>
          </Card>
        ))}
      </div>
    </div>
  )
}
