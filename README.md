# La Cuvee des FDP - Saison 2

Application de suivi en temps reel du jeu "Les Marseillais VS Le Reste du Monde".
Site public en lecture seule + espace admin prive. Tout est gratuit :
**Netlify** (front) + **Supabase** (Postgres, Auth, Realtime).

La regle d'or du projet : **aucun secret n'arrive au navigateur public**. Ce
n'est pas fait avec un `if (isAdmin)` cote client, mais impose par la base de
donnees (RLS + vues publiques). Meme avec la cle publique et l'inspecteur reseau
ouvert, la base refuse de renvoyer les points, les noms caches, la solution, etc.

---

## Stack

- Front : Vite + React + Tailwind CSS (build statique, deploye sur Netlify)
- Back : Supabase (PostgreSQL + Auth + Realtime)
- Securite : Row Level Security + vues `v_public_*` + droits par role

---

## Etape 1 - Creer le projet Supabase

1. Va sur https://supabase.com, cree un projet (plan gratuit).
2. Dans **SQL Editor**, ouvre `supabase/schema.sql`, colle tout, execute.
3. Toujours dans **SQL Editor**, ouvre `supabase/seed.sql`, colle, execute.
   (Cela cree les 2 equipes, les 12 joueurs, les 5 epreuves cachees, le mystere,
   les enveloppes et les parametres.)

## Etape 2 - Creer TON compte admin

1. Supabase > **Authentication** > **Users** > **Add user** > entre ton email et
   un mot de passe. Coche "Auto confirm user".
2. Supabase > **Authentication** > **Providers** > desactive **"Enable signups"**
   (important : empeche quiconque de creer un compte et de devenir admin).
3. Recupere l'`id` (uuid) de ton user (colonne id dans la liste des users), puis
   dans **SQL Editor** :
   ```sql
   insert into admins (user_id) values ('colle-ton-uuid-ici');
   ```

## Etape 3 - Configurer le front en local

1. Copie `.env.example` en `.env`.
2. Remplis avec **Project Settings > API** :
   ```
   VITE_SUPABASE_URL=https://xxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOi...   (la cle "anon public")
   ```
3. Installe et lance :
   ```bash
   npm install
   npm run dev
   ```
   - Site public : http://localhost:5173/
   - Admin : http://localhost:5173/admin
   - Ceremonie : http://localhost:5173/ceremonie

## Etape 4 - Deployer sur Netlify

Deux options.

**A. Via GitHub (recommande, deploiement auto a chaque push)**
1. Pousse le dossier sur un repo GitHub.
2. Netlify > **Add new site** > **Import from Git** > choisis le repo.
3. Build command `npm run build`, publish directory `dist` (deja dans `netlify.toml`).
4. **Site configuration > Environment variables** : ajoute `VITE_SUPABASE_URL` et
   `VITE_SUPABASE_ANON_KEY`.
5. Deploie.

**B. Sans Git (drag and drop)**
1. `npm run build` (genere le dossier `dist`).
2. Glisse le dossier `dist` sur https://app.netlify.com/drop.
   (Dans ce cas les variables doivent etre presentes au moment du build local,
   donc garde ton `.env` rempli avant de builder.)

Le fichier `netlify.toml` gere deja la redirection SPA (toutes les routes vers
`index.html`), indispensable pour que `/admin`, `/mystere`, `/ceremonie` marchent.

---

## Comment jouer avec (cote admin)

- **Epreuves** : chaque epreuve suit le cycle `cachee -> revelee -> LIVE -> terminee`.
  Bouton "Reveler" (avec confirmation), "Passer en LIVE", puis choix du vainqueur.
  Les points restent prives : ils n'apparaissent que si tu actives "Reveler points"
  (a la ceremonie).
- **Ceremonie** : ouvre `/ceremonie` sur la TV. Active "mode ceremonie" dans
  Parametres. Sur une epreuve, clique "Focus ceremonie" pour l'afficher en grand,
  puis "Reveler points". Termine avec **Reveler le classement final**.
- **Mode urgence** (Parametres) : tout masquer + mettre le site en pause en un clic.
- **Annuler** : le Dashboard permet d'annuler la derniere action modifiable.

---

## Ce qui reste secret (verifie)

Le public (role `anon`) lit uniquement les vues `v_public_*`. Ne sont JAMAIS
envoyes au navigateur public :

- le nom/description d'une epreuve `hidden`,
- la valeur en points d'une epreuve (tant que `points_revealed` = false),
- les scores (tant que `reveal_scores` = false),
- le montant et le motif des bonus,
- les indices non trouves (et le nombre total d'indices),
- le texte d'un indice non publie,
- la solution du Mystere (jamais, sous aucune condition),
- le contenu d'une lettre non revelee,
- un resultat non publie.

Voir `supabase/schema.sql` (section "VUES PUBLIQUES") pour le detail.

---

## Structure

```
supabase/schema.sql   schema + RLS + vues publiques + realtime
supabase/seed.sql     donnees initiales
src/lib/               client supabase, API (publique/admin), scoring, UI
src/public/            site public (accueil, equipes, epreuves, mystere, aventure, classement, ceremonie)
src/admin/             espace admin (dashboard + 8 sections)
```
