-- =====================================================================
--  LA CUVEE DES FDP - Saison 2 / Schema Supabase
-- =====================================================================
--  Modele de securite (le coeur du projet) :
--   1. RLS activee partout. Le role "anon" (public) n'a AUCUN acces
--      direct aux tables de base -> il ne peut donc jamais lire points,
--      noms caches, solution, etc.
--   2. Le public lit uniquement des VUES "v_public_*" qui construisent
--      explicitement une projection SANS secret. Ces vues appartiennent
--      a "postgres" et contournent la RLS des tables de base, mais elles
--      ne selectionnent que des colonnes/lignes autorisees.
--   3. L'admin (role "authenticated" present dans la table admins) a un
--      acces complet aux tables de base via une policy is_admin().
--   4. Le temps reel passe par une table "realtime_public" sans secret :
--      des triggers l'incrementent a chaque changement, le public
--      re-charge alors les vues. Aucun secret ne transite par le realtime.
--
--  A executer dans Supabase > SQL Editor (une seule fois).
-- =====================================================================

create extension if not exists pgcrypto;

-- ------------------------------------------------------------------ --
--  TABLES DE BASE
-- ------------------------------------------------------------------ --

create table if not exists teams (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text unique not null,
  image       text,
  color       text default '#17C3B2',
  sort        int  default 0,
  created_at  timestamptz default now()
);

create table if not exists players (
  id          uuid primary key default gen_random_uuid(),
  first_name  text not null,
  image       text,
  team_id     uuid references teams(id) on delete cascade,
  active      boolean default true,
  sort        int default 0,
  created_at  timestamptz default now()
);

-- status : hidden -> revealed -> live -> completed
create table if not exists challenges (
  id              uuid primary key default gen_random_uuid(),
  internal_name   text not null,            -- SECRET : nom de travail
  public_name     text,                     -- montre seulement des status >= revealed
  description     text,                     -- SECRET tant que hidden
  sort            int default 0,
  points          int default 0,            -- SECRET jusqu'a points_revealed
  status          text default 'hidden' check (status in ('hidden','revealed','live','completed')),
  winning_team_id uuid references teams(id),
  reveal_winner   boolean default true,     -- afficher le vainqueur publiquement ?
  points_revealed boolean default false,    -- reveler la valeur en points (ceremonie)
  revealed_at     timestamptz,
  started_at      timestamptz,
  completed_at    timestamptz,
  created_at      timestamptz default now()
);

create table if not exists clues (
  id               uuid primary key default gen_random_uuid(),
  number           int not null,
  text             text,                    -- SECRET tant que non publie
  level            int default 1 check (level between 1 and 3),
  location         text,                    -- SECRET tant que non publie (peut indiquer la piece)
  found            boolean default false,
  found_by_team_id uuid references teams(id),
  found_at         timestamptz,
  published        boolean default false,   -- le texte est-il publie ?
  created_at       timestamptz default now()
);

create table if not exists bonuses (
  id          uuid primary key default gen_random_uuid(),
  team_id     uuid references teams(id),
  points      int default 0,               -- SECRET (montant jamais public)
  reason      text,                         -- SECRET
  is_public   boolean default false,        -- si true : on montre "bonus recu", sans montant
  created_at  timestamptz default now()
);

-- une seule ligne
create table if not exists mystery (
  id                uuid primary key default gen_random_uuid(),
  solved            boolean default false,
  solved_by_team_id uuid references teams(id),
  solved_at         timestamptz,
  solution          text,                   -- SECRET absolu, jamais expose
  bonus_points      int default 0           -- SECRET
);

create table if not exists envelopes (
  id            uuid primary key default gen_random_uuid(),
  number        int not null,
  owner_team_id uuid references teams(id),
  opened        boolean default false,
  points        int default 0,              -- SECRET jusqu'a la ceremonie
  message       text,                        -- lettre : SECRET tant que non revelee
  revealed      boolean default false,
  created_at    timestamptz default now()
);

create table if not exists timeline_events (
  id          uuid primary key default gen_random_uuid(),
  type        text default 'info',
  title       text not null,
  description text,
  team_id     uuid references teams(id),
  is_public   boolean default true,
  event_time  timestamptz default now(),
  created_at  timestamptz default now()
);

-- une seule ligne (id = 1)
create table if not exists game_settings (
  id                     int primary key default 1,
  event_title            text default 'La Cuvee des FDP',
  event_subtitle         text default 'Saison 2 - Ardeche 2026',
  start_at               timestamptz,
  end_at                 timestamptz,
  reveal_scores          boolean default false,   -- classement final visible ?
  show_challenge_winners boolean default true,    -- montrer les vainqueurs d'epreuves ?
  show_victory_count     boolean default false,   -- montrer le nombre de victoires ?
  show_clues             boolean default true,    -- (mode urgence) montrer les indices ?
  site_paused            boolean default false,   -- (mode urgence) site public en pause ?
  ceremony_mode          boolean default false,   -- mode ceremonie plein ecran actif ?
  ceremony_step          int default 0,           -- etape d'intro de la ceremonie
  ceremony_challenge_id  uuid references challenges(id)
);

create table if not exists admin_actions (
  id            uuid primary key default gen_random_uuid(),
  action        text not null,
  entity_type   text,
  entity_id     uuid,
  previous_data jsonb,
  new_data      jsonb,
  created_at    timestamptz default now()
);

-- Qui est admin. On insere ici l'uuid du compte admin (voir README).
create table if not exists admins (
  user_id uuid primary key
);

-- Signal temps reel public (aucun secret).
create table if not exists realtime_public (
  id         int primary key default 1,
  version    bigint default 0,
  updated_at timestamptz default now()
);
insert into realtime_public (id, version) values (1, 0)
  on conflict (id) do nothing;

-- ------------------------------------------------------------------ --
--  FONCTION is_admin() (security definer : contourne la RLS de admins)
-- ------------------------------------------------------------------ --

create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

grant execute on function public.is_admin() to anon, authenticated;

-- ------------------------------------------------------------------ --
--  TRIGGER temps reel : bump du compteur a chaque changement
-- ------------------------------------------------------------------ --

create or replace function public.bump_realtime()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update realtime_public set version = version + 1, updated_at = now() where id = 1;
  return null;
end;
$$;

do $$
declare t text;
begin
  foreach t in array array[
    'teams','players','challenges','clues','bonuses',
    'mystery','envelopes','timeline_events','game_settings'
  ] loop
    execute format('drop trigger if exists trg_bump_%1$s on %1$s;', t);
    execute format(
      'create trigger trg_bump_%1$s after insert or update or delete on %1$s
       for each statement execute function public.bump_realtime();', t);
  end loop;
end $$;

-- ------------------------------------------------------------------ --
--  RLS : on ferme tout pour anon, on ouvre pour l'admin
-- ------------------------------------------------------------------ --

do $$
declare t text;
begin
  foreach t in array array[
    'teams','players','challenges','clues','bonuses','mystery',
    'envelopes','timeline_events','game_settings','admin_actions'
  ] loop
    execute format('alter table %I enable row level security;', t);
    -- coupe tout acces direct au role public
    execute format('revoke all on table %I from anon;', t);
    -- l'admin (authenticated + present dans admins) a tout
    execute format('drop policy if exists admin_all on %I;', t);
    execute format(
      'create policy admin_all on %I for all to authenticated
       using (public.is_admin()) with check (public.is_admin());', t);
    execute format('grant select, insert, update, delete on table %I to authenticated;', t);
  end loop;
end $$;

-- admins : lisible uniquement par soi-meme (defense en profondeur)
alter table admins enable row level security;
revoke all on table admins from anon;
drop policy if exists admins_self on admins;
create policy admins_self on admins for select to authenticated
  using (user_id = auth.uid());
grant select on table admins to authenticated;

-- realtime_public : lisible par tout le monde (aucun secret)
alter table realtime_public enable row level security;
drop policy if exists realtime_read on realtime_public;
create policy realtime_read on realtime_public for select
  to anon, authenticated using (true);
grant select on table realtime_public to anon, authenticated;

-- publie la table de signal pour le realtime Supabase
do $$
begin
  begin
    alter publication supabase_realtime add table realtime_public;
  exception when duplicate_object then null;
  end;
end $$;

-- ------------------------------------------------------------------ --
--  VUES PUBLIQUES  (projection SANS secret, servies au role anon)
--  Elles appartiennent a postgres -> contournent la RLS des tables,
--  mais ne renvoient que ce qui est autorise.
-- ------------------------------------------------------------------ --

-- Parametres non sensibles
drop view if exists v_public_settings cascade;
create view v_public_settings as
  select id, event_title, event_subtitle, start_at, end_at,
         reveal_scores, show_challenge_winners, show_victory_count,
         show_clues, site_paused, ceremony_mode, ceremony_step,
         ceremony_challenge_id
  from game_settings;

-- Equipes / joueurs : entierement publics
drop view if exists v_public_teams cascade;
create view v_public_teams as
  select id, name, slug, image, color, sort from teams order by sort;

drop view if exists v_public_players cascade;
create view v_public_players as
  select id, first_name, image, team_id, sort
  from players where active = true order by sort;

-- Epreuves : le nom/description n'apparaissent qu'a partir de "revealed",
-- le vainqueur qu'a "completed" (et si autorise), les points jamais
-- avant points_revealed.
drop view if exists v_public_challenges cascade;
create view v_public_challenges as
  select
    c.id,
    c.sort,
    c.status,
    case when c.status = 'hidden' then null else c.public_name  end as public_name,
    case when c.status = 'hidden' then null else c.description   end as description,
    case
      when c.status = 'completed' and c.reveal_winner and s.show_challenge_winners
      then c.winning_team_id else null
    end as winning_team_id,
    case when c.points_revealed then c.points else null end as points,
    c.points_revealed,
    c.revealed_at, c.started_at, c.completed_at
  from challenges c cross join game_settings s
  order by c.sort;

-- Indices : SEULS les indices trouves sont exposes (le total reste cache
-- pour ne pas laisser deviner la proximite de la cle). Texte/lieu
-- uniquement si publie. Masquable en mode urgence via show_clues.
drop view if exists v_public_clues cascade;
create view v_public_clues as
  select
    c.id, c.number, c.level, c.found, c.found_by_team_id, c.found_at,
    case when c.published then c.text     else null end as text,
    case when c.published then c.location else null end as location,
    c.published
  from clues c
  where c.found = true
    and coalesce((select show_clues from game_settings where id = 1), true) = true;

-- Bonus : uniquement ceux marques publics, et SANS le montant ni le motif.
drop view if exists v_public_bonuses cascade;
create view v_public_bonuses as
  select id, team_id, created_at
  from bonuses where is_public = true;

-- Mystere : jamais la solution ni le bonus. Equipe/heure seulement si resolu.
drop view if exists v_public_mystery cascade;
create view v_public_mystery as
  select
    id, solved,
    case when solved then solved_by_team_id else null end as solved_by_team_id,
    case when solved then solved_at         else null end as solved_at
  from mystery;

-- Enveloppes : jamais les points. Message seulement si revele.
drop view if exists v_public_envelopes cascade;
create view v_public_envelopes as
  select
    id, number, owner_team_id, opened,
    case when revealed then message else null end as message,
    revealed
  from envelopes order by number;

-- Fil de l'aventure : evenements publics uniquement.
drop view if exists v_public_timeline cascade;
create view v_public_timeline as
  select id, type, title, description, team_id, event_time
  from timeline_events where is_public = true order by event_time desc;

-- Scores finaux : renvoie 0 ligne tant que reveal_scores = false.
-- Total = epreuves gagnees + bonus + bonus mystere + enveloppes ouvertes.
drop view if exists v_public_final_scores cascade;
create view v_public_final_scores as
  select
    t.id as team_id, t.name, t.color,
    coalesce(ch.pts,0) + coalesce(bo.pts,0)
      + coalesce(my.pts,0) + coalesce(en.pts,0) as total
  from teams t
  left join (
    select winning_team_id tid, sum(points) pts
    from challenges where status = 'completed' group by 1
  ) ch on ch.tid = t.id
  left join (
    select team_id tid, sum(points) pts from bonuses group by 1
  ) bo on bo.tid = t.id
  left join (
    select solved_by_team_id tid, sum(bonus_points) pts
    from mystery where solved group by 1
  ) my on my.tid = t.id
  left join (
    select owner_team_id tid, sum(points) pts
    from envelopes where opened group by 1
  ) en on en.tid = t.id
  where coalesce((select reveal_scores from game_settings where id = 1), false) = true
  order by total desc;

-- Droits de lecture sur les vues pour le public.
grant select on
  v_public_settings, v_public_teams, v_public_players,
  v_public_challenges, v_public_clues, v_public_bonuses,
  v_public_mystery, v_public_envelopes, v_public_timeline,
  v_public_final_scores
to anon, authenticated;

-- =====================================================================
--  FIN DU SCHEMA. Executer ensuite seed.sql pour les donnees initiales.
-- =====================================================================
