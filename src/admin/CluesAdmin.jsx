import { useState } from 'react'
import { useAdmin } from './AdminApp.jsx'
import { createClue, updateClue, deleteClue, markClueFound } from '../lib/api.js'
import { Card, Button, Lock } from '../lib/ui.jsx'
import { Field, Input, Textarea, Select } from './fields.jsx'

export default function CluesAdmin() {
  const { game, reload, confirm } = useAdmin()
  const nextNumber = (Math.max(0, ...game.clues.map((c) => c.number)) + 1)

  async function add() {
    await createClue({ number: nextNumber, level: 1, text: '', location: '' })
    reload()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl uppercase">Indices</h2>
        <Button variant="sun" onClick={add} className="px-3 py-2 text-sm">+ Ajouter</Button>
      </div>
      <p className="text-sm text-cream/50">
        Un indice non trouve n'est jamais envoye au public. Un indice trouve mais non publie
        apparait comme "contenu non publie".
      </p>

      <div className="space-y-3">
        {game.clues.map((c) => (
          <ClueRow key={c.id} c={c} game={game} reload={reload} confirm={confirm} />
        ))}
      </div>
    </div>
  )
}

function ClueRow({ c, game, reload, confirm }) {
  const [form, setForm] = useState({ text: c.text || '', location: c.location || '', level: c.level, number: c.number })
  const [open, setOpen] = useState(false)
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })
  const team = game.teams.find((t) => t.id === c.found_by_team_id)

  async function save() {
    await updateClue(c.id, {
      text: form.text, location: form.location,
      level: Number(form.level), number: Number(form.number),
    })
    setOpen(false); reload()
  }
  async function found(teamId) {
    const t = game.teams.find((x) => x.id === teamId)
    await markClueFound(c, teamId, t?.name); reload()
  }
  async function del() {
    if (!(await confirm('Supprimer cet indice ?'))) return
    await deleteClue(c.id); reload()
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div className="font-mono text-xs uppercase text-cream/50">Indice #{c.number} · Niv. {c.level}</div>
        <div className="flex items-center gap-2">
          {c.found
            ? <span className="rounded-full bg-azur/20 px-2 py-0.5 text-xs font-bold text-azur">Trouve</span>
            : <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-cream/50">Non trouve</span>}
          {c.found && (c.published
            ? <span className="rounded-full bg-sun/20 px-2 py-0.5 text-xs font-bold text-sun">Publie</span>
            : <Lock>Non publie</Lock>)}
        </div>
      </div>

      <p className="mt-2 text-cream/80">{c.text || <span className="text-cream/40">(pas de texte)</span>}</p>
      {c.location && <p className="text-xs text-cream/50">📍 {c.location}</p>}
      {team && <p className="mt-1 text-xs" style={{ color: team.color }}>Trouve par {team.name}</p>}

      <div className="mt-3 flex flex-wrap gap-2 text-sm">
        {!c.found && game.teams.map((t) => (
          <Button key={t.id} variant="ghost" className="px-3 py-2 text-sm" onClick={() => found(t.id)}>
            Trouve : {t.name}
          </Button>
        ))}
        {c.found && (
          <Button variant={c.published ? 'ghost' : 'primary'} className="px-3 py-2 text-sm"
            onClick={async () => { await updateClue(c.id, { published: !c.published }); reload() }}>
            {c.published ? 'Depublier le texte' : 'Publier le texte'}
          </Button>
        )}
        <Button variant="ghost" className="px-3 py-2 text-sm" onClick={() => setOpen(!open)}>
          {open ? 'Fermer' : '✎ Modifier'}
        </Button>
      </div>

      {open && (
        <div className="mt-3 space-y-3 rounded-xl bg-black/20 p-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Numero"><Input type="number" value={form.number} onChange={set('number')} /></Field>
            <Field label="Niveau">
              <Select value={form.level} onChange={set('level')}>
                <option value={1}>1 - vague</option>
                <option value={2}>2 - precis</option>
                <option value={3}>3 - proche solution</option>
              </Select>
            </Field>
          </div>
          <Field label="Texte de l'indice"><Textarea rows={2} value={form.text} onChange={set('text')} /></Field>
          <Field label="Zone / piece (prive tant que non publie)"><Input value={form.location} onChange={set('location')} /></Field>
          <div className="flex gap-2">
            <Button variant="primary" className="flex-1 py-2 text-sm" onClick={save}>Enregistrer</Button>
            <Button variant="danger" className="py-2 text-sm" onClick={del}>Supprimer</Button>
          </div>
        </div>
      )}
    </Card>
  )
}
