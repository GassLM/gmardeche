import { useAdmin } from './AdminApp.jsx'
import { updateSettings } from '../lib/api.js'
import { Card, Button } from '../lib/ui.jsx'
import { Toggle } from './fields.jsx'

export default function SettingsAdmin() {
  const { game, reload, confirm } = useAdmin()
  const s = game.settings
  const save = async (patch) => { await updateSettings(patch); reload() }

  async function revealFinal() {
    if (!(await confirm('REVELER LE CLASSEMENT FINAL a tout le monde ? Cette action est publique.'))) return
    await save({ reveal_scores: true })
  }
  async function hideFinal() {
    if (!(await confirm('Re-masquer le classement final ?'))) return
    await save({ reveal_scores: false })
  }
  async function panic() {
    if (!(await confirm('MODE URGENCE : masquer resultats, indices, classement et mettre le site en pause ?'))) return
    await save({ show_challenge_winners: false, show_clues: false, reveal_scores: false, site_paused: true })
  }

  return (
    <div className="space-y-6">
      <h2 className="font-display text-2xl uppercase">Parametres</h2>

      {/* Visibilite publique */}
      <section className="space-y-2">
        <h3 className="font-display text-lg uppercase text-cream/80">Visibilite publique</h3>
        <Toggle checked={s.show_challenge_winners} label="Afficher les vainqueurs d'epreuves"
          onChange={(v) => save({ show_challenge_winners: v })} />
        <Toggle checked={s.show_victory_count} label="Afficher le nombre de victoires"
          hint="Laisse OFF pour eviter que les joueurs devinent qui mene." onChange={(v) => save({ show_victory_count: v })} />
        <Toggle checked={s.show_clues} label="Afficher les indices"
          onChange={(v) => save({ show_clues: v })} />
      </section>

      {/* Ceremonie */}
      <section className="space-y-2">
        <h3 className="font-display text-lg uppercase text-cream/80">Ceremonie finale</h3>
        <Toggle checked={s.ceremony_mode} label="Activer le mode ceremonie"
          hint="Bascule l'ecran /ceremonie en mode revelation." onChange={(v) => save({ ceremony_mode: v })} />
        <Card className="p-4">
          <p className="mb-3 text-sm text-cream/60">
            Ouvre <span className="font-mono text-azur">/ceremonie</span> sur la TV. Depuis les
            "Epreuves", utilise "Focus ceremonie" pour afficher une epreuve, puis "Reveler points"
            pour devoiler sa valeur. Termine avec le bouton ci-dessous.
          </p>
          <div className="flex flex-wrap gap-2">
            <a href="/ceremonie" target="_blank" rel="noreferrer">
              <Button variant="ghost" className="px-3 py-2 text-sm">Ouvrir /ceremonie</Button>
            </a>
            <Button variant="ghost" className="px-3 py-2 text-sm"
              onClick={() => save({ ceremony_challenge_id: null })}>Retirer le focus</Button>
          </div>
        </Card>

        {!s.reveal_scores ? (
          <Button variant="danger" className="w-full py-3.5 text-base" onClick={revealFinal}>
            🔴 Reveler le classement final
          </Button>
        ) : (
          <Button variant="ghost" className="w-full py-3" onClick={hideFinal}>
            Re-masquer le classement final
          </Button>
        )}
      </section>

      {/* Mode urgence */}
      <section className="space-y-2">
        <h3 className="font-display text-lg uppercase text-coral">Mode urgence</h3>
        <Card className="space-y-2 p-4 ring-1 ring-coral/30">
          <Toggle checked={s.site_paused} label="Mettre le site public en pause"
            onChange={(v) => save({ site_paused: v })} />
          <Button variant="danger" className="w-full py-3" onClick={panic}>
            ⚠️ Tout masquer + pause
          </Button>
        </Card>
      </section>
    </div>
  )
}
