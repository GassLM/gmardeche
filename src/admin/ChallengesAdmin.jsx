import { useState } from 'react'
import { useAdmin } from './AdminApp.jsx'
import {
  createChallenge, updateChallenge, deleteChallenge,
  revealChallenge, startChallenge, completeChallenge, updateSettings,
} from '../lib/api.js'
import { Card, Button, LiveDot, Lock } from '../lib/ui.jsx'
import { Field, Input, Textarea } from './fields.jsx'

const STATUS_LABEL = {
  hidden: '🔒 Cachee', revealed: '👁️ Revelee', live: '🔴 En direct', completed: '✅ Terminee',
}

export default function ChallengesAdmin() {
  const { game, reload, confirm } = useAdmin()
  const [editing, setEditing] = useState(null)

  async function add() {
    await createChallenge({ internal_name: 'Nouvelle epreuve', sort: game.challenges.length + 1 })
    reload()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl uppercase">Epreuves</h2>
        <Button variant="sun" onClick={add} className="px-3 py-2 text-sm">+ Ajouter</Button>
      </div>

      <div className="space-y-3">
        {game.challenges.map((c) => (
          <ChallengeRow key={c.id} c={c} game={game} reload={reload} confirm={confirm}
                        editing={editing === c.id} setEditing={setEditing} />
        ))}
      </div>
    </div>
  )
}

function ChallengeRow({ c, game, reload, confirm, editing, setEditing }) {
  const teams = game.teams
  const isFocus = game.settings?.ceremony_challenge_id === c.id

  async function doReveal() {
    if (!(await confirm(`Reveler publiquement "${c.public_name || c.internal_name}" ?`))) return
    await revealChallenge(c); reload()
  }
  async function doLive() { await startChallenge(c); reload() }
  async function setWinner(teamId) {
    const team = teams.find((t) => t.id === teamId)
    await completeChallenge(c, teamId, team?.name); reload()
  }
  async function toggle(field, value, meta) { await updateChallenge(c.id, { [field]: value }, meta); reload() }
  async function del() {
    if (!(await confirm('Supprimer cette epreuve ?'))) return
    await deleteChallenge(c.id); reload()
  }
  async function focusCeremony() {
    await updateSettings({ ceremony_challenge_id: isFocus ? null : c.id }); reload()
  }

  return (
    <Card className={`p-4 ${c.status === 'live' ? 'ring-2 ring-coral/50' : ''}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="font-mono text-[11px] uppercase text-cream/40">
            #{c.sort} · {STATUS_LABEL[c.status]}
          </div>
          <div className="truncate font-display text-xl uppercase">{c.public_name || c.internal_name}</div>
          <div className="mt-0.5 flex items-center gap-2 text-xs">
            <span className="rounded bg-white/10 px-2 py-0.5 font-mono">{c.points} pts</span>
            <span className="text-cream/40">interne : {c.internal_name}</span>
          </div>
        </div>
        {c.status === 'live' && <LiveDot />}
      </div>

      {/* Actions de cycle de vie */}
      <div className="mt-3 flex flex-wrap gap-2">
        {c.status === 'hidden'   && <Button variant="primary" className="px-3 py-2 text-sm" onClick={doReveal}>Reveler</Button>}
        {c.status === 'revealed' && <Button variant="danger"  className="px-3 py-2 text-sm" onClick={doLive}>Passer en LIVE</Button>}
        {c.status === 'live' && (
          <div className="flex flex-wrap gap-2">
            <span className="self-center text-sm text-cream/60">Vainqueur :</span>
            {teams.map((t) => (
              <Button key={t.id} variant="ghost" className="px-3 py-2 text-sm" onClick={() => setWinner(t.id)}>
                {t.name}
              </Button>
            ))}
          </div>
        )}
        {c.status === 'completed' && (
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-cream/60">Vainqueur :</span>
            {teams.map((t) => (
              <button key={t.id} onClick={() => setWinner(t.id)}
                className={`rounded-lg px-3 py-2 font-semibold ${c.winning_team_id === t.id
                  ? 'text-night' : 'bg-white/5 text-cream/70'}`}
                style={c.winning_team_id === t.id ? { background: t.color } : {}}>
                {t.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Reglages de visibilite */}
      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
        <MiniToggle label="Montrer vainqueur" on={c.reveal_winner}
          onClick={() => toggle('reveal_winner', !c.reveal_winner)} />
        <MiniToggle label="Reveler points" on={c.points_revealed}
          onClick={() => toggle('points_revealed', !c.points_revealed)} warn />
        <MiniToggle label={isFocus ? 'Focus ceremonie ✓' : 'Focus ceremonie'} on={isFocus}
          onClick={focusCeremony} />
        <button onClick={() => setEditing(editing ? null : c.id)}
          className="rounded-xl bg-white/5 px-3 py-2 font-semibold text-cream/70 ring-1 ring-white/10">
          {editing ? 'Fermer' : '✎ Modifier'}
        </button>
      </div>

      {editing && <EditForm c={c} onDone={() => { setEditing(null); reload() }} onDelete={del} />}
    </Card>
  )
}

function MiniToggle({ label, on, onClick, warn }) {
  return (
    <button onClick={onClick}
      className={`rounded-xl px-3 py-2 text-left font-semibold ring-1 transition
        ${on ? (warn ? 'bg-sun/20 text-sun ring-sun/40' : 'bg-azur/20 text-azur ring-azur/40')
             : 'bg-white/5 text-cream/60 ring-white/10'}`}>
      {label}
    </button>
  )
}

function EditForm({ c, onDone, onDelete }) {
  const [form, setForm] = useState({
    internal_name: c.internal_name, public_name: c.public_name || '',
    description: c.description || '', points: c.points, sort: c.sort,
  })
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  async function save() {
    await updateChallenge(c.id, {
      internal_name: form.internal_name, public_name: form.public_name,
      description: form.description, points: Number(form.points) || 0, sort: Number(form.sort) || 0,
    })
    onDone()
  }

  return (
    <div className="mt-3 space-y-3 rounded-xl bg-black/20 p-3">
      <Field label="Nom interne (prive)"><Input value={form.internal_name} onChange={set('internal_name')} /></Field>
      <Field label="Nom public"><Input value={form.public_name} onChange={set('public_name')} /></Field>
      <Field label="Description"><Textarea rows={2} value={form.description} onChange={set('description')} /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Points (prive)"><Input type="number" value={form.points} onChange={set('points')} /></Field>
        <Field label="Ordre"><Input type="number" value={form.sort} onChange={set('sort')} /></Field>
      </div>
      <div className="flex gap-2">
        <Button variant="primary" className="flex-1 py-2 text-sm" onClick={save}>Enregistrer</Button>
        <Button variant="danger" className="py-2 text-sm" onClick={onDelete}>Supprimer</Button>
      </div>
    </div>
  )
}
