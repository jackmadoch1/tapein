create table if not exists profiles (
  user_id text primary key,
  display_name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists visits (
  id serial primary key,
  user_id text not null,
  note text,
  photo_data text,
  status text not null default 'pending' check (status in ('pending', 'approved')),
  week_start date not null,
  created_at timestamptz not null default now()
);

create index if not exists visits_week_idx on visits (week_start, created_at desc);
create index if not exists visits_user_week_idx on visits (user_id, week_start);

create table if not exists attestations (
  id serial primary key,
  visit_id integer not null references visits (id) on delete cascade,
  voter_id text not null,
  vote text not null check (vote in ('yes', 'no')),
  created_at timestamptz not null default now(),
  unique (visit_id, voter_id)
);

create index if not exists attestations_visit_idx on attestations (visit_id);
