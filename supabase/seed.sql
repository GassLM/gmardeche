-- =====================================================================
--  SEED - "La Cuvee des FDP - Saison 2" (donnees reelles)
--  A executer APRES schema.sql dans Supabase > SQL Editor.
--  Idempotent : relancable sans creer de doublons.
-- =====================================================================

-- --- Equipes ---------------------------------------------------------
insert into teams (name, slug, color, sort) values
  ('Les Marseillais',   'marseillais',    '#2E86FF', 1),
  ('Le Reste du Monde', 'reste-du-monde', '#FF5A5F', 2)
on conflict (slug) do update set name = excluded.name, color = excluded.color;

-- --- Joueurs : Les Marseillais --------------------------------------

insert into players (first_name, team_id, sort)
select v.first_name, t.id, v.sort
from (values ('Maxime',1),('Blanche',2),('Henri',3),('Ambre',4),('Alix',5),('Valentin',6)) as v(first_name, sort)
cross join (select id from teams where slug = 'marseillais') t
where not exists (
  select 1 from players p where p.first_name = v.first_name and p.team_id = t.id
);

-- --- Joueurs : Le Reste du Monde ------------------------------------

insert into players (first_name, team_id, sort)
select v.first_name, t.id, v.sort
from (values ('Eliott',1),('Greg',2),('Gaël',3),('Lisa',4),('Louise',5),('Chloé',6)) as v(first_name, sort)
cross join (select id from teams where slug = 'reste-du-monde') t
where not exists (
  select 1 from players p where p.first_name = v.first_name and p.team_id = t.id
);

-- --- Epreuves (toutes CACHEES par defaut, points prives) -------------
insert into challenges (internal_name, public_name, description, sort, points, status)
select v.internal_name, v.public_name, v.description, v.sort, v.points, 'hidden'
from (values
  ('Quiz','Quiz de culture générale','Buzzer par équipe, 30 questions du plus simple au plus dur. Mauvaise réponse : la main passe à l''équipe adverse.',1,10),
  ('Five','Five','Deux manches, deux équipes par camp. 2 manches gagnées = victoire directe, sinon manche décisive entre les perdants.',2,5),
  ('Objet','Cherche l''objet','Une photo d''un objet de la maison ou du jardin est révélée : il faut le retrouver et le rapporter aux GM en premier.',3,10),
  ('Piscine','Relais bières piscine','Relais dans la piscine, cuillère + pierre en bouche, deux bières à boire par joueur avant de passer le relais.',4,5),
  ('PasRire','1 contre 1 - Essaye de ne pas rire','Duel 1v1, de l''eau en bouche. Celui qui rit est éliminé et remplacé par le joueur suivant, jusqu''au dernier.',5,15)
) as v(internal_name, public_name, description, sort, points)
where not exists (select 1 from challenges c where c.internal_name = v.internal_name);

-- --- Mystere de la Maison (solution STRICTEMENT privee) -------------
insert into mystery (solved, solution, bonus_points)
select false,
  'La cle est cachee dans un pot / sachet de sel, dans le placard de la cuisine, a cote des epices, sur l''etagere du haut.',
  20
where not exists (select 1 from mystery);

-- --- Enveloppes ------------------------------------------------------
insert into envelopes (number, points, message)
select 1, 20, null
where not exists (select 1 from envelopes where number = 1);

insert into envelopes (number, points, message)
select 2, 0, 'Lettre adressee a tous les joueurs, a lire a voix haute a la toute fin de la ceremonie. (Contenu a completer dans l''admin.)'
where not exists (select 1 from envelopes where number = 2);

-- --- Parametres du jeu ----------------------------------------------
insert into game_settings (
  id, event_title, event_subtitle, start_at, end_at,
  reveal_scores, show_challenge_winners, show_victory_count,
  show_clues, site_paused, ceremony_mode, ceremony_step
) values (
  1, 'La Cuvee des FDP', 'Saison 2 - Ardeche 2026',
  '2026-08-15 19:00:00+02', '2026-08-18 19:00:00+02',
  false, true, false, true, false, false, 0
)
on conflict (id) do update set
  event_title    = excluded.event_title,
  event_subtitle = excluded.event_subtitle,
  start_at       = excluded.start_at,
  end_at         = excluded.end_at;

-- --- Bonus (liste fixe, 2 pts chacun, a attribuer dans l'admin) ------
-- team_id null = pas encore attribue (ne compte pas dans le score).
insert into bonuses (reason, points, team_id, is_public)
select v.reason, 2, null, false
from (values
  ('Jeu 1 : réponse la plus drôle'),
  ('Jeu 1 : réponse la plus horrible'),
  ('Jeu 2 : le plus beau tir'),
  ('Jeu 2 : domination, aucune bière ouverte'),
  ('Jeu 2 : gamelle'),
  ('Jeu 3 : l''objet le plus drôle'),
  ('Jeu 3 : moins de 10 secondes'),
  ('Jeu 4 : blague extrêmement drôle'),
  ('Jeu 4 : le plus beau jet d''eau'),
  ('Jeu 5 : le plus rapide'),
  ('Jeu 5 : cul sec le plus rapide')
) as v(reason)
where not exists (select 1 from bonuses b where b.reason = v.reason);

-- --- Indices du mystere (tous caches : found=false, published=false) -
-- Rien ne fuite cote public tant que tu ne publies pas / marques trouve.
insert into clues (number, text, level, location)
select v.number, v.text, v.level, v.location
from (values
  (1,'Va voir le vase du salon... c''était pas aussi simple boloss',1,'Salon (fausse piste)'),
  (2,'Je vis rarement seul sur une table',1,'Cuisine'),
  (3,'Disons que si tu trouves du poivre à la place, tu chauffes un peu',2,'Épices'),
  (4,'La clé prend actuellement un bain de sodium',3,'Sel'),
  (5,'Je suis trouvable en supermarché',2,'Condiment'),
  (6,'Le trésor est caché dans un endroit utilisé quotidiennement par des gens quotidiens',1,null),
  (7,'Tu me touches tous les jours et tu ne me dis pas merci',1,null),
  (8,'Cherche-là où personne ne regarderait par envie',1,null),
  (9,'Même les fantômes évitent ce coin',1,null),
  (10,'Je ne suis pas dans l''entrée',1,null),
  (11,'Je ne suis pas visible directement',1,null),
  (12,'Prends un peu de hauteur',1,null),
  (13,'Le trésor aime dominer la pièce',1,null),
  (14,'La clé n''est pas à portée de main... enfin pas immédiatement',1,null),
  (15,'D''ici j''ai du mal à bronzer',2,null),
  (16,'On me mange, mais pas que',2,null),
  (17,'N''aie pas peur d''y mettre ta main',2,null),
  (18,'Maman, il pleut blanc',2,null),
  (19,'Cherche plus haut que ton niveau actuel',2,null),
  (20,'Je suis bien conservé dans un...',2,null),
  (21,'Lopez déteste ça',2,null),
  (22,'Ce que vous cherchez n''est pas dans le jardin',2,null),
  (23,'Ce que vous cherchez n''est pas à l''extérieur',2,null),
  (24,'Le patou surveille ce lieu',2,null),
  (25,'Si tu éternues dedans, tu es foutu',3,null),
  (26,'Je suis un cristal',3,null),
  (27,'Si tu regardes en bas, tu cuisines. Si tu regardes en haut, tu trouves',3,null),
  (28,'Il essaye de surveiller la cuisine depuis les airs quand c''est possible',3,null),
  (29,'Le trésor repose parmi des millions de petits cristaux',3,null),
  (30,'Le trésor est caché dans un sachet plus utile que le h de Hawaï',3,null),
  (31,'Tu te souviens de la première question du premier mini jeu ?',3,null),
  (32,'Ouvre la porte qui m''enferme',3,null),
  (33,'Il y a une porte près de moi, au cas où je devrais sortir',3,null)
) as v(number, text, level, location)
where not exists (select 1 from clues c where c.number = v.number);

-- =====================================================================
--  FIN DU SEED.
--  Rappel : cree ton compte admin dans Supabase > Authentication,
--  puis insere son uuid dans admins :
--     insert into admins (user_id) values ('<ton-uuid>');
-- =====================================================================
