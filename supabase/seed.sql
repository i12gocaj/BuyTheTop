-- =============================================================================
-- BuyTheTop Synthetic Seed Data
-- =============================================================================
-- Populates the database with 50 fake users, rankings, payments and position
-- history so the leaderboard is non-empty for demos and screenshots.
--
-- Run AFTER schema.sql.
--
-- Demo credentials created:
--   admin@buythetop.demo  /  Admin1234!   (role = admin)
--   demo@buythetop.demo   /  Demo1234!    (role = user, position #3)
--
-- The other 48 users exist only as ranking entries (they can't log in).
-- =============================================================================

begin;

-- -----------------------------------------------------------------------------
-- Clean previous synthetic data (idempotent re-runs)
-- -----------------------------------------------------------------------------
delete from public.position_history
  where user_id in (
    select id from auth.users
    where email like '%@buythetop.demo'
  );

delete from public.payments
  where user_id in (
    select id from auth.users
    where email like '%@buythetop.demo'
  );

delete from public.rankings
  where user_id in (
    select id from auth.users
    where email like '%@buythetop.demo'
  );

delete from public.user_profiles
  where id in (
    select id from auth.users
    where email like '%@buythetop.demo'
  );

delete from auth.identities
  where user_id in (
    select id from auth.users
    where email like '%@buythetop.demo'
  );

delete from auth.users
  where email like '%@buythetop.demo';

-- -----------------------------------------------------------------------------
-- Admin user (real login)
-- -----------------------------------------------------------------------------
insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data,
  is_super_admin, is_sso_user
) values (
  '00000000-0000-4000-a000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'authenticated', 'authenticated',
  'admin@buythetop.demo',
  crypt('Admin1234!', gen_salt('bf')),
  now(), now() - interval '120 days', now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"display_name":"CrownKeeper"}'::jsonb,
  false, false
);

insert into auth.identities (id, user_id, provider_id, identity_data, provider, created_at, updated_at, last_sign_in_at)
values (
  gen_random_uuid(),
  '00000000-0000-4000-a000-000000000001'::uuid,
  '00000000-0000-4000-a000-000000000001',
  '{"sub":"00000000-0000-4000-a000-000000000001","email":"admin@buythetop.demo"}'::jsonb,
  'email', now(), now(), now()
);

-- -----------------------------------------------------------------------------
-- Demo user (real login)
-- -----------------------------------------------------------------------------
insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data,
  is_super_admin, is_sso_user
) values (
  '00000000-0000-4000-a000-000000000002'::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'authenticated', 'authenticated',
  'demo@buythetop.demo',
  crypt('Demo1234!', gen_salt('bf')),
  now(), now() - interval '45 days', now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"display_name":"DemoDuke"}'::jsonb,
  false, false
);

insert into auth.identities (id, user_id, provider_id, identity_data, provider, created_at, updated_at, last_sign_in_at)
values (
  gen_random_uuid(),
  '00000000-0000-4000-a000-000000000002'::uuid,
  '00000000-0000-4000-a000-000000000002',
  '{"sub":"00000000-0000-4000-a000-000000000002","email":"demo@buythetop.demo"}'::jsonb,
  'email', now(), now(), now()
);

-- -----------------------------------------------------------------------------
-- 48 synthetic ranking users (no login, only data)
-- -----------------------------------------------------------------------------
do $$
declare
  display_names text[] := array[
    'MidasKing', 'GoldChaser', 'CrownPrince', 'EliteAlpha', 'PlatinumPhoenix',
    'DiamondHands', 'RoyalFlush', 'AurumLegend', 'TopShelfTom', 'EmperorElias',
    'VelvetVince', 'SilverSiren', 'CashCascade', 'TyphoonTyler', 'NobleNova',
    'BulletproofBea', 'SaffronSultan', 'IronIvan', 'OpaqueOctavia', 'ZenithZara',
    'MercuryMax', 'OrbitOscar', 'PrismParker', 'QuasarQuinn', 'RubyRen',
    'StellarSage', 'TitanTess', 'UmbraUriel', 'VertexVivi', 'WardenWill',
    'XenonXander', 'YellowstoneYael', 'ZephyrZane', 'AmberAxel', 'BasaltBryn',
    'CinderClara', 'DuneDax', 'EmberEden', 'FluxFinn', 'GrottoGale',
    'HelioHarbor', 'IndigoIris', 'JasperJett', 'KineticKai', 'LapisLena',
    'MosaicMila', 'NimbusNoah', 'ObsidianOren'
  ];

  descriptions text[] := array[
    'Climbing to the top, one contribution at a time.',
    'Born to lead, paid to dominate.',
    'No throne is too high.',
    'Champagne mindset, caviar dreams.',
    'Built different. Verified premium.',
    'Watch me write my name in gold.',
    'Crown me or move aside.',
    'I came here to stay at the top.',
    'High stakes, higher tastes.',
    'Excellence is the only currency.',
    'Forever first, never second.',
    'Velvet ropes, velvet souls.',
    'Polished by ambition.',
    'Above the noise.',
    'Stack the throne, skip the small talk.',
    'Discreet wealth, public position.',
    'Connoisseur of the leaderboard.',
    'Quiet luxury, loud rank.',
    'Carved from rare materials.',
    'Patron of the elite.',
    'Vintage spirit, modern empire.',
    'Tailored ambition.',
    'Crown by craft.',
    'Architect of altitude.',
    'Sovereign of the scoreboard.',
    'Hand-stitched for the high.',
    'Where others stop, I climb.',
    'Heir to the heights.',
    'A pedigree of position.',
    'Built on bold moves.',
    'Aged like ambition.',
    'Light filtered through gold.',
    'Symphony of status.',
    'Pen ink and platinum.',
    'Velvet wins.',
    'Silent ascent.',
    'Curated, not crowded.',
    'Lifted by legacy.',
    'A rank reserved.',
    'Atelier of achievement.',
    'Crown above the noise.',
    'Marble and momentum.',
    'Suits, sums, sovereignty.',
    'Champagne first principles.',
    'Discreet, decisive, decked out.',
    'Refined to rise.',
    'Penthouse perspective.',
    'Cut from emperor cloth.'
  ];

  uid uuid;
  i int;
  contrib numeric;
begin
  for i in 1..48 loop
    uid := ('00000000-0000-4000-a000-' || lpad((i + 10)::text, 12, '0'))::uuid;

    insert into auth.users (
      id, instance_id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data,
      is_super_admin, is_sso_user
    ) values (
      uid,
      '00000000-0000-0000-0000-000000000000'::uuid,
      'authenticated', 'authenticated',
      lower(display_names[i]) || '@buythetop.demo',
      crypt('NotARealPassword!', gen_salt('bf')),
      now(),
      now() - (random() * interval '180 days'),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('display_name', display_names[i]),
      false, false
    );

    insert into public.user_profiles (
      id, display_name, description, role,
      position_notifications_enabled, created_at, updated_at
    ) values (
      uid,
      display_names[i],
      descriptions[i],
      'user',
      (random() > 0.3),
      now() - (random() * interval '180 days'),
      now()
    );
  end loop;
end $$;

-- -----------------------------------------------------------------------------
-- Profiles for admin & demo users
-- -----------------------------------------------------------------------------
insert into public.user_profiles (id, display_name, description, role, position_notifications_enabled)
values
  ('00000000-0000-4000-a000-000000000001'::uuid, 'CrownKeeper',
   'Guardian of the realm. Sees all, says little.', 'admin', true),
  ('00000000-0000-4000-a000-000000000002'::uuid, 'DemoDuke',
   'Demo account, try the platform from here.', 'user', true);

-- -----------------------------------------------------------------------------
-- Rankings: assign contributions and compute positions
-- -----------------------------------------------------------------------------
do $$
declare
  uid uuid;
  i int;
  amounts numeric[] := array[
    8520.00, 6740.50, 5210.25, 4180.00, 3950.75,
    3420.00, 2980.50, 2640.25, 2310.00, 2050.50,
    1820.75, 1640.00, 1480.25, 1320.50, 1190.00,
    1075.25, 970.50, 880.75, 805.00, 735.50,
    670.25, 610.00, 555.75, 505.50, 460.00,
    418.25, 380.50, 345.75, 314.00, 285.50,
    260.25, 237.00, 215.75, 196.50, 178.25,
    161.00, 145.50, 131.25, 118.00, 106.75,
    96.50, 87.25, 79.00, 71.75, 65.50,
    59.25, 53.50, 48.00, 43.25, 38.75
  ];
begin
  -- Admin gets a mid-pack ranking (position ~25)
  insert into public.rankings (user_id, total_contribution, current_position, position_acquired_at, created_at, updated_at)
  values (
    '00000000-0000-4000-a000-000000000001'::uuid,
    amounts[24],
    null,
    now() - interval '15 days',
    now() - interval '60 days',
    now()
  );

  -- Demo user sits near the top (position #3)
  insert into public.rankings (user_id, total_contribution, current_position, position_acquired_at, created_at, updated_at)
  values (
    '00000000-0000-4000-a000-000000000002'::uuid,
    amounts[3],
    null,
    now() - interval '5 days',
    now() - interval '40 days',
    now()
  );

  -- The 48 fake users get the remaining amounts (skipping the ones used above)
  for i in 1..48 loop
    uid := ('00000000-0000-4000-a000-' || lpad((i + 10)::text, 12, '0'))::uuid;

    insert into public.rankings (user_id, total_contribution, current_position, position_acquired_at, created_at, updated_at)
    values (
      uid,
      -- Skip indices 3 and 24 which are used by demo/admin
      amounts[case
        when i < 3 then i
        when i < 23 then i + 1
        else i + 2
      end],
      null,
      now() - (random() * interval '90 days'),
      now() - (random() * interval '180 days'),
      now()
    );
  end loop;
end $$;

-- Compute current_position for every row based on total_contribution desc
with ranked as (
  select user_id,
         row_number() over (order by total_contribution desc, position_acquired_at asc) as pos
  from public.rankings
)
update public.rankings r
   set current_position = ranked.pos
  from ranked
 where r.user_id = ranked.user_id;

-- -----------------------------------------------------------------------------
-- Payments (recent activity feed)
-- -----------------------------------------------------------------------------
do $$
declare
  uid uuid;
  i int;
  pay_amount numeric;
  pay_date timestamptz;
begin
  -- 1-3 payments per real user, totals matching ranking contributions
  for i in 1..48 loop
    uid := ('00000000-0000-4000-a000-' || lpad((i + 10)::text, 12, '0'))::uuid;

    -- Most recent payment
    pay_amount := round((random() * 200 + 20)::numeric, 2);
    pay_date := now() - (random() * interval '30 days');
    insert into public.payments (user_id, amount, status, payment_intent_id, description, created_at)
    values (uid, pay_amount, 'completed', 'pi_demo_' || gen_random_uuid(),
            'Ranking contribution of €' || pay_amount, pay_date);

    -- Maybe an older one
    if random() > 0.4 then
      pay_amount := round((random() * 500 + 50)::numeric, 2);
      pay_date := now() - (random() * interval '120 days') - interval '30 days';
      insert into public.payments (user_id, amount, status, payment_intent_id, description, created_at)
      values (uid, pay_amount, 'completed', 'pi_demo_' || gen_random_uuid(),
              'Ranking contribution of €' || pay_amount, pay_date);
    end if;
  end loop;

  -- Demo user: 4 payments (so the history page has content)
  insert into public.payments (user_id, amount, status, payment_intent_id, description, created_at) values
    ('00000000-0000-4000-a000-000000000002'::uuid, 500.00, 'completed', 'pi_demo_first',  'Initial contribution of €500',  now() - interval '38 days'),
    ('00000000-0000-4000-a000-000000000002'::uuid, 1500.00, 'completed', 'pi_demo_second', 'Climb to top 10 of €1.500',     now() - interval '22 days'),
    ('00000000-0000-4000-a000-000000000002'::uuid, 2000.00, 'completed', 'pi_demo_third',  'Push to top 5 of €2.000',       now() - interval '12 days'),
    ('00000000-0000-4000-a000-000000000002'::uuid, 1210.25, 'completed', 'pi_demo_fourth', 'Lock in podium of €1.210,25',  now() - interval '5 days');
end $$;

-- -----------------------------------------------------------------------------
-- Position history
-- -----------------------------------------------------------------------------
insert into public.position_history (user_id, old_position, new_position, contribution_amount, created_at) values
  ('00000000-0000-4000-a000-000000000002'::uuid, null, 32, 500.00,  now() - interval '38 days'),
  ('00000000-0000-4000-a000-000000000002'::uuid, 32,   9,  1500.00, now() - interval '22 days'),
  ('00000000-0000-4000-a000-000000000002'::uuid, 9,    5,  2000.00, now() - interval '12 days'),
  ('00000000-0000-4000-a000-000000000002'::uuid, 5,    3,  1210.25, now() - interval '5 days');

-- A few position changes for other users (drives the activity feed)
do $$
declare
  uid uuid;
  i int;
begin
  for i in 1..15 loop
    uid := ('00000000-0000-4000-a000-' || lpad((i + 10)::text, 12, '0'))::uuid;
    insert into public.position_history (user_id, old_position, new_position, contribution_amount, created_at)
    values (
      uid,
      (random() * 40 + 10)::int,
      (random() * 40 + 5)::int,
      round((random() * 400 + 25)::numeric, 2),
      now() - (random() * interval '20 days')
    );
  end loop;
end $$;

commit;

-- =============================================================================
-- Done. Verify:
--   select count(*) from public.rankings;         -- expect 50
--   select count(*) from public.user_profiles;    -- expect 50
--   select count(*) from public.payments;         -- expect ~80
--   select current_position, total_contribution
--     from public.rankings order by current_position limit 10;
-- =============================================================================
