create extension if not exists pgcrypto;

create table if not exists public.hh_posts (
  id uuid primary key default gen_random_uuid(),
  content text not null check (char_length(content) between 1 and 420),
  mood text not null check (mood in ('capek', 'kesel', 'cemas', 'sedih', 'izin', 'random')),
  created_at timestamptz not null default now(),
  reports integer not null default 0
);

create table if not exists public.hh_post_reactions (
  post_id uuid not null references public.hh_posts(id) on delete cascade,
  visitor_id text not null,
  reaction text not null check (reaction in ('hug', 'semangat', 'gakSendiri', 'izin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (post_id, visitor_id)
);

create table if not exists public.hh_post_reports (
  post_id uuid not null references public.hh_posts(id) on delete cascade,
  visitor_id text not null,
  created_at timestamptz not null default now(),
  primary key (post_id, visitor_id)
);

create table if not exists public.hh_journal_entries (
  owner_key text not null,
  entry_date date not null,
  content text not null check (char_length(content) <= 1500),
  updated_at timestamptz not null default now(),
  primary key (owner_key, entry_date)
);

create table if not exists public.hh_rate_limits (
  rate_key text primary key,
  window_start timestamptz not null,
  hits integer not null default 0,
  updated_at timestamptz not null default now()
);

create index if not exists hh_posts_created_at_idx on public.hh_posts(created_at desc);
create index if not exists hh_post_reactions_post_idx on public.hh_post_reactions(post_id);
create index if not exists hh_post_reports_post_idx on public.hh_post_reports(post_id);
create index if not exists hh_journal_entries_owner_idx on public.hh_journal_entries(owner_key, entry_date desc);
create index if not exists hh_rate_limits_updated_idx on public.hh_rate_limits(updated_at);

drop function if exists public.hh_list_posts(text);
drop function if exists public.hh_create_post(text, text);
drop function if exists public.hh_create_post(text, text, text);
drop function if exists public.hh_set_reaction(uuid, text, text);
drop function if exists public.hh_report_post(uuid, text);
drop function if exists public.hh_list_journal_entries(text);
drop function if exists public.hh_upsert_journal_entry(text, date, text, text);
drop function if exists public.hh_seed_default_posts();
drop function if exists public.hh_check_rate_limit(text, integer, integer);

create or replace function public.hh_check_rate_limit(
  p_rate_key text,
  p_max_hits integer,
  p_window_seconds integer
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := now();
  v_window interval;
  v_row public.hh_rate_limits%rowtype;
begin
  if p_rate_key is null or char_length(trim(p_rate_key)) < 6 then
    raise exception 'Rate key tidak valid.';
  end if;

  if p_max_hits <= 0 or p_window_seconds <= 0 then
    raise exception 'Rate limit config tidak valid.';
  end if;

  v_window := make_interval(secs => p_window_seconds);

  delete from public.hh_rate_limits
  where updated_at < v_now - interval '2 days';

  loop
    update public.hh_rate_limits rl
    set
      window_start = case
        when rl.window_start + v_window <= v_now then v_now
        else rl.window_start
      end,
      hits = case
        when rl.window_start + v_window <= v_now then 1
        else rl.hits + 1
      end,
      updated_at = v_now
    where rl.rate_key = p_rate_key
    returning * into v_row;

    if found then
      exit;
    end if;

    begin
      insert into public.hh_rate_limits (rate_key, window_start, hits, updated_at)
      values (p_rate_key, v_now, 1, v_now)
      returning * into v_row;

      exit;
    exception
      when unique_violation then
        -- retry
    end;
  end loop;

  if v_row.hits > p_max_hits then
    raise exception 'Terlalu sering. Coba lagi dalam % detik.', p_window_seconds
      using hint = 'Rate limit aktif untuk mencegah spam.';
  end if;
end;
$$;

create or replace function public.hh_seed_default_posts()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count bigint;
begin
  select count(*) into v_count from public.hh_posts;

  if v_count = 0 then
    insert into public.hh_posts (content, mood, created_at)
    values
      ('Kerjaan numpuk, laptop lemot, hujan deras. Paket kombo hari ini.', 'capek', now() - interval '47 minutes'),
      ('Udah effort banget, tapi masih dibilang kurang. Boleh nangis tipis dulu ga?', 'sedih', now() - interval '122 minutes');
  end if;
end;
$$;

create or replace function public.hh_list_posts(p_visitor_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payload jsonb;
begin
  perform public.hh_seed_default_posts();

  with post_rows as (
    select
      p.id,
      p.content,
      p.mood,
      p.created_at,
      p.reports,
      count(*) filter (where r.reaction = 'hug')::int as hug_count,
      count(*) filter (where r.reaction = 'semangat')::int as semangat_count,
      count(*) filter (where r.reaction = 'gakSendiri')::int as gak_sendiri_count,
      count(*) filter (where r.reaction = 'izin')::int as izin_count,
      max(case when r.visitor_id = p_visitor_id then r.reaction end) as my_reaction,
      exists (
        select 1
        from public.hh_post_reports rp
        where rp.post_id = p.id and rp.visitor_id = p_visitor_id
      ) as my_reported
    from public.hh_posts p
    left join public.hh_post_reactions r on r.post_id = p.id
    group by p.id
  )
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', id::text,
        'text', content,
        'mood', mood,
        'createdAt', (extract(epoch from created_at) * 1000)::bigint,
        'reports', reports,
        'reactions', jsonb_build_object(
          'hug', hug_count,
          'semangat', semangat_count,
          'gakSendiri', gak_sendiri_count,
          'izin', izin_count
        ),
        'myReaction', my_reaction,
        'myReported', my_reported
      )
      order by created_at desc
    ),
    '[]'::jsonb
  ) into v_payload
  from post_rows;

  return v_payload;
end;
$$;

create or replace function public.hh_create_post(
  p_content text,
  p_mood text,
  p_visitor_id text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_post public.hh_posts%rowtype;
  v_cleaned text;
begin
  v_cleaned := trim(coalesce(p_content, ''));

  if p_visitor_id is null or p_visitor_id !~ '^[A-Za-z0-9-]{12,80}$' then
    raise exception 'Visitor ID tidak valid.';
  end if;

  perform public.hh_check_rate_limit('create-post:' || p_visitor_id, 5, 60);

  if char_length(v_cleaned) = 0 then
    raise exception 'Isi curhat tidak boleh kosong.';
  end if;

  if char_length(v_cleaned) > 420 then
    raise exception 'Isi curhat maksimal 420 karakter.';
  end if;

  if p_mood not in ('capek', 'kesel', 'cemas', 'sedih', 'izin', 'random') then
    raise exception 'Mood tidak valid.';
  end if;

  insert into public.hh_posts (content, mood)
  values (v_cleaned, p_mood)
  returning * into v_post;

  return jsonb_build_object(
    'id', v_post.id::text,
    'text', v_post.content,
    'mood', v_post.mood,
    'createdAt', (extract(epoch from v_post.created_at) * 1000)::bigint,
    'reports', v_post.reports,
    'reactions', jsonb_build_object(
      'hug', 0,
      'semangat', 0,
      'gakSendiri', 0,
      'izin', 0
    )
  );
end;
$$;

create or replace function public.hh_set_reaction(
  p_post_id uuid,
  p_visitor_id text,
  p_reaction text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payload jsonb;
begin
  if p_visitor_id is null or p_visitor_id !~ '^[A-Za-z0-9-]{12,80}$' then
    raise exception 'Visitor ID tidak valid.';
  end if;

  perform public.hh_check_rate_limit('reaction:' || p_visitor_id, 80, 60);

  if p_reaction not in ('hug', 'semangat', 'gakSendiri', 'izin') then
    raise exception 'Reaction tidak valid.';
  end if;

  if not exists (select 1 from public.hh_posts where id = p_post_id) then
    raise exception 'Post tidak ditemukan.';
  end if;

  insert into public.hh_post_reactions (post_id, visitor_id, reaction)
  values (p_post_id, p_visitor_id, p_reaction)
  on conflict (post_id, visitor_id)
  do update set
    reaction = excluded.reaction,
    updated_at = now();

  select jsonb_build_object(
    'postId', p_post_id::text,
    'selectedReaction', p_reaction,
    'reactions', jsonb_build_object(
      'hug', count(*) filter (where reaction = 'hug')::int,
      'semangat', count(*) filter (where reaction = 'semangat')::int,
      'gakSendiri', count(*) filter (where reaction = 'gakSendiri')::int,
      'izin', count(*) filter (where reaction = 'izin')::int
    )
  ) into v_payload
  from public.hh_post_reactions
  where post_id = p_post_id;

  return v_payload;
end;
$$;

create or replace function public.hh_report_post(
  p_post_id uuid,
  p_visitor_id text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row_count integer;
  v_reports integer;
begin
  if p_visitor_id is null or p_visitor_id !~ '^[A-Za-z0-9-]{12,80}$' then
    raise exception 'Visitor ID tidak valid.';
  end if;

  perform public.hh_check_rate_limit('report:' || p_visitor_id, 20, 60);

  insert into public.hh_post_reports (post_id, visitor_id)
  values (p_post_id, p_visitor_id)
  on conflict (post_id, visitor_id) do nothing;

  get diagnostics v_row_count = row_count;

  if v_row_count > 0 then
    update public.hh_posts
    set reports = reports + 1
    where id = p_post_id
    returning reports into v_reports;
  else
    select reports into v_reports
    from public.hh_posts
    where id = p_post_id;
  end if;

  if v_reports is null then
    raise exception 'Post tidak ditemukan.';
  end if;

  return jsonb_build_object(
    'postId', p_post_id::text,
    'reported', true,
    'reports', v_reports
  );
end;
$$;

create or replace function public.hh_list_journal_entries(p_owner_key text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payload jsonb;
begin
  if p_owner_key is null or p_owner_key !~ '^[A-Za-z0-9-]{12,80}$' then
    raise exception 'Sync key tidak valid.';
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'date', entry_date::text,
        'text', content,
        'updatedAt', (extract(epoch from updated_at) * 1000)::bigint
      )
      order by entry_date desc
    ),
    '[]'::jsonb
  ) into v_payload
  from public.hh_journal_entries
  where owner_key = p_owner_key;

  return v_payload;
end;
$$;

create or replace function public.hh_upsert_journal_entry(
  p_owner_key text,
  p_entry_date date,
  p_content text,
  p_visitor_id text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cleaned text;
  v_updated_at timestamptz;
begin
  if p_owner_key is null or p_owner_key !~ '^[A-Za-z0-9-]{12,80}$' then
    raise exception 'Sync key tidak valid.';
  end if;

  if p_visitor_id is null or p_visitor_id !~ '^[A-Za-z0-9-]{12,80}$' then
    raise exception 'Visitor ID tidak valid.';
  end if;

  perform public.hh_check_rate_limit('journal:' || p_visitor_id, 20, 60);

  v_cleaned := trim(coalesce(p_content, ''));

  if p_entry_date is null then
    raise exception 'Tanggal jurnal tidak valid.';
  end if;

  if char_length(v_cleaned) = 0 then
    delete from public.hh_journal_entries
    where owner_key = p_owner_key
      and entry_date = p_entry_date;

    return jsonb_build_object(
      'date', p_entry_date::text,
      'text', '',
      'updatedAt', (extract(epoch from now()) * 1000)::bigint
    );
  end if;

  if char_length(v_cleaned) > 1500 then
    raise exception 'Isi jurnal maksimal 1500 karakter.';
  end if;

  insert into public.hh_journal_entries (owner_key, entry_date, content)
  values (p_owner_key, p_entry_date, v_cleaned)
  on conflict (owner_key, entry_date)
  do update set
    content = excluded.content,
    updated_at = now()
  returning updated_at into v_updated_at;

  return jsonb_build_object(
    'date', p_entry_date::text,
    'text', v_cleaned,
    'updatedAt', (extract(epoch from v_updated_at) * 1000)::bigint
  );
end;
$$;

alter table public.hh_posts enable row level security;
alter table public.hh_post_reactions enable row level security;
alter table public.hh_post_reports enable row level security;
alter table public.hh_journal_entries enable row level security;
alter table public.hh_rate_limits enable row level security;

revoke all on table public.hh_posts from public, anon, authenticated;
revoke all on table public.hh_post_reactions from public, anon, authenticated;
revoke all on table public.hh_post_reports from public, anon, authenticated;
revoke all on table public.hh_journal_entries from public, anon, authenticated;
revoke all on table public.hh_rate_limits from public, anon, authenticated;

grant select, insert, update, delete on table public.hh_posts to service_role;
grant select, insert, update, delete on table public.hh_post_reactions to service_role;
grant select, insert, update, delete on table public.hh_post_reports to service_role;
grant select, insert, update, delete on table public.hh_journal_entries to service_role;
grant select, insert, update, delete on table public.hh_rate_limits to service_role;

revoke all on function public.hh_check_rate_limit(text, integer, integer) from public, anon, authenticated;
revoke all on function public.hh_seed_default_posts() from public, anon, authenticated;
revoke all on function public.hh_list_posts(text) from public, anon, authenticated;
revoke all on function public.hh_create_post(text, text, text) from public, anon, authenticated;
revoke all on function public.hh_set_reaction(uuid, text, text) from public, anon, authenticated;
revoke all on function public.hh_report_post(uuid, text) from public, anon, authenticated;
revoke all on function public.hh_list_journal_entries(text) from public, anon, authenticated;
revoke all on function public.hh_upsert_journal_entry(text, date, text, text) from public, anon, authenticated;

grant execute on function public.hh_check_rate_limit(text, integer, integer) to service_role;
grant execute on function public.hh_seed_default_posts() to service_role;
grant execute on function public.hh_list_posts(text) to service_role;
grant execute on function public.hh_create_post(text, text, text) to service_role;
grant execute on function public.hh_set_reaction(uuid, text, text) to service_role;
grant execute on function public.hh_report_post(uuid, text) to service_role;
grant execute on function public.hh_list_journal_entries(text) to service_role;
grant execute on function public.hh_upsert_journal_entry(text, date, text, text) to service_role;

notify pgrst, 'reload schema';
