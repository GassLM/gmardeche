import { useEffect, useRef, useState, useCallback } from 'react'
import { supabase } from './supabase'

// =====================================================================
//  API PUBLIQUE  -  lit UNIQUEMENT les vues v_public_* (aucun secret)
// =====================================================================

export async function fetchPublicGame() {
  const [
    settings, teams, players, challenges, clues,
    bonuses, mystery, envelopes, timeline, finalScores,
  ] = await Promise.all([
    supabase.from('v_public_settings').select('*').single(),
    supabase.from('v_public_teams').select('*'),
    supabase.from('v_public_players').select('*'),
    supabase.from('v_public_challenges').select('*'),
    supabase.from('v_public_clues').select('*'),
    supabase.from('v_public_bonuses').select('*'),
    supabase.from('v_public_mystery').select('*').maybeSingle(),
    supabase.from('v_public_envelopes').select('*'),
    supabase.from('v_public_timeline').select('*'),
    supabase.from('v_public_final_scores').select('*'),
  ])

  return {
    settings: settings.data ?? null,
    teams: teams.data ?? [],
    players: players.data ?? [],
    challenges: challenges.data ?? [],
    clues: clues.data ?? [],
    bonuses: bonuses.data ?? [],
    mystery: mystery.data ?? null,
    envelopes: envelopes.data ?? [],
    timeline: timeline.data ?? [],
    finalScores: finalScores.data ?? [], // vide tant que reveal_scores = false
  }
}

// =====================================================================
//  TEMPS REEL  -  s'abonne au signal public + polling de secours
// =====================================================================

export function useRealtimeRefresh(onChange, intervalMs = 8000) {
  const cb = useRef(onChange)
  cb.current = onChange

  useEffect(() => {
    // 1) push instantane via la table de signal (aucun secret ne transite)
    const channel = supabase
      .channel('realtime_public')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'realtime_public' },
        () => cb.current?.(),
      )
      .subscribe()

    // 2) filet de securite : polling regulier
    const id = setInterval(() => cb.current?.(), intervalMs)

    return () => {
      supabase.removeChannel(channel)
      clearInterval(id)
    }
  }, [intervalMs])
}

// Hook complet pour les pages publiques.
export function usePublicGame() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const g = await fetchPublicGame()
      setData(g)
    } catch (e) {
      console.error('Chargement public impossible', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])
  useRealtimeRefresh(load)

  return { data, loading, reload: load }
}

// =====================================================================
//  AUTH ADMIN
// =====================================================================

export async function signIn(email, password) {
  return supabase.auth.signInWithPassword({ email, password })
}
export async function signOut() {
  return supabase.auth.signOut()
}
export function onAuth(cb) {
  supabase.auth.getSession().then(({ data }) => cb(data.session))
  const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => cb(session))
  return () => sub.subscription.unsubscribe()
}

// =====================================================================
//  API ADMIN  -  lit les tables de base (RLS -> reserve a l'admin)
// =====================================================================

export async function fetchAdminGame() {
  const [
    settings, teams, players, challenges, clues,
    bonuses, mystery, envelopes, timeline, actions,
  ] = await Promise.all([
    supabase.from('game_settings').select('*').eq('id', 1).single(),
    supabase.from('teams').select('*').order('sort'),
    supabase.from('players').select('*').order('sort'),
    supabase.from('challenges').select('*').order('sort'),
    supabase.from('clues').select('*').order('number'),
    supabase.from('bonuses').select('*').order('created_at', { ascending: false }),
    supabase.from('mystery').select('*').maybeSingle(),
    supabase.from('envelopes').select('*').order('number'),
    supabase.from('timeline_events').select('*').order('event_time', { ascending: false }),
    supabase.from('admin_actions').select('*').order('created_at', { ascending: false }).limit(30),
  ])

  return {
    settings: settings.data ?? null,
    teams: teams.data ?? [],
    players: players.data ?? [],
    challenges: challenges.data ?? [],
    clues: clues.data ?? [],
    bonuses: bonuses.data ?? [],
    mystery: mystery.data ?? null,
    envelopes: envelopes.data ?? [],
    timeline: timeline.data ?? [],
    actions: actions.data ?? [],
  }
}

// Journal d'action + possibilite d'annuler (previous_data conserve).
async function logAction(action, entityType, entityId, previousData, newData) {
  await supabase.from('admin_actions').insert({
    action, entity_type: entityType, entity_id: entityId,
    previous_data: previousData ?? null, new_data: newData ?? null,
  })
}

// Ajoute automatiquement un evenement au fil de l'aventure.
async function addTimeline(type, title, description, teamId, isPublic = true) {
  await supabase.from('timeline_events').insert({
    type, title, description: description ?? null,
    team_id: teamId ?? null, is_public: isPublic,
  })
}

// ---- Parametres ----------------------------------------------------
export async function updateSettings(patch) {
  const { data: prev } = await supabase.from('game_settings').select('*').eq('id', 1).single()
  const { error } = await supabase.from('game_settings').update(patch).eq('id', 1)
  if (!error) await logAction('update_settings', 'settings', null, prev, patch)
  return { error }
}

// ---- Epreuves ------------------------------------------------------
export async function createChallenge(payload) {
  const { data, error } = await supabase.from('challenges').insert({
    internal_name: payload.internal_name || 'Nouvelle epreuve',
    public_name: payload.public_name || '',
    description: payload.description || '',
    points: payload.points ?? 0,
    sort: payload.sort ?? 99,
    status: 'hidden',
  }).select().single()
  if (!error) await logAction('create_challenge', 'challenge', data.id, null, data)
  return { data, error }
}

export async function updateChallenge(id, patch, meta = {}) {
  const { data: prev } = await supabase.from('challenges').select('*').eq('id', id).single()
  const { error } = await supabase.from('challenges').update(patch).eq('id', id)
  if (!error) {
    await logAction(meta.action || 'update_challenge', 'challenge', id, prev, patch)
    if (meta.timeline) await addTimeline(...meta.timeline)
  }
  return { error }
}

export async function deleteChallenge(id) {
  const { data: prev } = await supabase.from('challenges').select('*').eq('id', id).single()
  const { error } = await supabase.from('challenges').delete().eq('id', id)
  if (!error) await logAction('delete_challenge', 'challenge', id, prev, null)
  return { error }
}

// Actions de cycle de vie (avec generation d'evenement du fil).
export const revealChallenge = (c) =>
  updateChallenge(c.id, { status: 'revealed', revealed_at: new Date().toISOString() },
    { action: 'reveal_challenge',
      timeline: ['challenge', `Nouvelle epreuve : ${c.public_name}`, null, null, true] })

export const startChallenge = (c) =>
  updateChallenge(c.id, { status: 'live', started_at: new Date().toISOString() },
    { action: 'start_challenge',
      timeline: ['live', `EN DIRECT : ${c.public_name}`, null, null, true] })

export const completeChallenge = (c, winningTeamId, teamName) =>
  updateChallenge(c.id,
    { status: 'completed', winning_team_id: winningTeamId, completed_at: new Date().toISOString() },
    { action: 'complete_challenge',
      timeline: ['win', `Victoire : ${teamName}`, `Epreuve : ${c.public_name}`, winningTeamId, true] })

// ---- Indices -------------------------------------------------------
export async function createClue(payload) {
  const { data, error } = await supabase.from('clues').insert({
    number: payload.number, text: payload.text || '',
    level: payload.level ?? 1, location: payload.location || '',
  }).select().single()
  if (!error) await logAction('create_clue', 'clue', data.id, null, data)
  return { data, error }
}
export async function updateClue(id, patch) {
  const { data: prev } = await supabase.from('clues').select('*').eq('id', id).single()
  const { error } = await supabase.from('clues').update(patch).eq('id', id)
  if (!error) await logAction('update_clue', 'clue', id, prev, patch)
  return { error }
}
export async function deleteClue(id) {
  const { error } = await supabase.from('clues').delete().eq('id', id)
  if (!error) await logAction('delete_clue', 'clue', id, null, null)
  return { error }
}
export async function markClueFound(clue, teamId, teamName) {
  return updateClue(clue.id, {
    found: true, found_by_team_id: teamId, found_at: new Date().toISOString(),
  }).then(async (r) => {
    if (!r.error) await addTimeline('clue', `Indice #${clue.number} trouve`,
      teamName ? `Par ${teamName}` : null, teamId, true)
    return r
  })
}

// ---- Bonus ---------------------------------------------------------
export async function createBonus(payload) {
  const { data, error } = await supabase.from('bonuses').insert({
    team_id: payload.team_id, points: payload.points ?? 0,
    reason: payload.reason || '', is_public: payload.is_public ?? false,
  }).select().single()
  if (!error) await logAction('create_bonus', 'bonus', data.id, null, data)
  return { data, error }
}
export async function updateBonus(id, patch) {
  const { error } = await supabase.from('bonuses').update(patch).eq('id', id)
  if (!error) await logAction('update_bonus', 'bonus', id, null, patch)
  return { error }
}
export async function deleteBonus(id) {
  const { error } = await supabase.from('bonuses').delete().eq('id', id)
  if (!error) await logAction('delete_bonus', 'bonus', id, null, null)
  return { error }
}

// ---- Mystere -------------------------------------------------------
export async function updateMystery(id, patch, meta = {}) {
  const { data: prev } = await supabase.from('mystery').select('*').eq('id', id).single()
  const { error } = await supabase.from('mystery').update(patch).eq('id', id)
  if (!error) {
    await logAction('update_mystery', 'mystery', id, prev, patch)
    if (meta.timeline) await addTimeline(...meta.timeline)
  }
  return { error }
}

// ---- Enveloppes ----------------------------------------------------
export async function updateEnvelope(id, patch) {
  const { error } = await supabase.from('envelopes').update(patch).eq('id', id)
  if (!error) await logAction('update_envelope', 'envelope', id, null, patch)
  return { error }
}

// ---- Fil de l'aventure (manuel) -----------------------------------
export async function createTimelineEvent(payload) {
  const { data, error } = await supabase.from('timeline_events').insert({
    type: payload.type || 'info', title: payload.title,
    description: payload.description || null, team_id: payload.team_id || null,
    is_public: payload.is_public ?? true,
    event_time: payload.event_time || new Date().toISOString(),
  }).select().single()
  if (!error) await logAction('create_timeline', 'timeline', data.id, null, data)
  return { data, error }
}
export async function deleteTimelineEvent(id) {
  const { error } = await supabase.from('timeline_events').delete().eq('id', id)
  if (!error) await logAction('delete_timeline', 'timeline', id, null, null)
  return { error }
}

// ---- Annuler la derniere action modifiable -------------------------
// Restaure previous_data pour les entites simples (challenge, clue, etc.)
export async function undoLastAction() {
  const { data: last } = await supabase
    .from('admin_actions').select('*')
    .not('previous_data', 'is', null)
    .order('created_at', { ascending: false }).limit(1).maybeSingle()

  if (!last) return { error: { message: 'Aucune action annulable.' } }

  const table = {
    challenge: 'challenges', clue: 'clues', bonus: 'bonuses',
    mystery: 'mystery', envelope: 'envelopes', settings: 'game_settings',
  }[last.entity_type]

  if (!table) return { error: { message: 'Type non annulable.' } }

  const prev = last.previous_data
  if (last.entity_type === 'settings') {
    await supabase.from('game_settings').update(prev).eq('id', 1)
  } else {
    await supabase.from(table).update(prev).eq('id', last.entity_id)
  }
  await logAction('undo', last.entity_type, last.entity_id, null, { undone: last.id })
  return { error: null, restored: last }
}

// =====================================================================
//  SCORING ADMIN  -  calcul du score reel (jamais expose au public)
// =====================================================================

export function computeScores(game) {
  const totals = {}
  for (const t of game.teams) {
    totals[t.id] = { team: t, challenges: 0, bonus: 0, mystery: 0, envelopes: 0, total: 0, wins: 0, detail: [] }
  }
  for (const c of game.challenges) {
    if (c.status === 'completed' && c.winning_team_id && totals[c.winning_team_id]) {
      totals[c.winning_team_id].challenges += c.points || 0
      totals[c.winning_team_id].wins += 1
      totals[c.winning_team_id].detail.push({ label: c.public_name || c.internal_name, pts: c.points || 0 })
    }
  }
  for (const b of game.bonuses) {
    if (totals[b.team_id]) {
      totals[b.team_id].bonus += b.points || 0
      totals[b.team_id].detail.push({ label: `Bonus : ${b.reason || '-'}`, pts: b.points || 0 })
    }
  }
  if (game.mystery?.solved && totals[game.mystery.solved_by_team_id]) {
    const pts = game.mystery.bonus_points || 0
    totals[game.mystery.solved_by_team_id].mystery += pts
    totals[game.mystery.solved_by_team_id].detail.push({ label: 'Mystere resolu', pts })
  }
  for (const e of game.envelopes) {
    if (e.opened && totals[e.owner_team_id]) {
      totals[e.owner_team_id].envelopes += e.points || 0
      if (e.points) totals[e.owner_team_id].detail.push({ label: `Enveloppe #${e.number}`, pts: e.points })
    }
  }
  for (const id in totals) {
    const t = totals[id]
    t.total = t.challenges + t.bonus + t.mystery + t.envelopes
  }
  return totals
}

// Hook admin (donnees + realtime).
export function useAdminGame() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const load = useCallback(async () => {
    try { setData(await fetchAdminGame()) }
    catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [])
  useEffect(() => { load() }, [load])
  useRealtimeRefresh(load)
  return { data, loading, reload: load }
}
