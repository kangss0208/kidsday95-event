-- CARAT 9559 이벤트 앱 Supabase 스키마
-- Supabase SQL Editor에 통째로 붙여넣고 Run

-- ── Tables ────────────────────────────────────────────────

create table if not exists classes (
  name text primary key,
  teacher text not null,
  meeting_location text not null,
  display_order int not null default 0
);

create table if not exists children (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  password text not null,
  class_name text not null default '',
  teacher_name text not null default '',
  is_absent boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists children_name_password_idx on children (name, password);
alter table children add column if not exists is_absent boolean not null default false;

create table if not exists missions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  class_names text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists mission_completions (
  mission_id uuid not null references missions(id) on delete cascade,
  child_id uuid not null references children(id) on delete cascade,
  completed_at timestamptz not null default now(),
  primary key (mission_id, child_id)
);

create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  author_id text not null,
  author_name text not null,
  image_url text,
  created_at timestamptz not null default now()
);
-- 기존 테이블에 image_url 없으면 추가
alter table posts add column if not exists image_url text;

create table if not exists comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts(id) on delete cascade,
  content text not null,
  author_id text not null,
  author_name text not null,
  author_role text not null check (author_role in ('child', 'teacher')),
  created_at timestamptz not null default now()
);

create table if not exists prep_items (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('items', 'cautions')),
  text text not null,
  display_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists app_settings (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

-- ── Seed defaults ─────────────────────────────────────────

insert into classes (name, teacher, meeting_location, display_order) values
  ('홍랑해', '김뮤우 원장님', '1층 로비 - 홍랑해 깃발 앞', 1),
  ('논랑해', '강금쪽 선생님', '1층 로비 - 논랑해 깃발 앞', 2),
  ('하니해', '김쫑하 선생님', '2층 복도 - 하니해 깃발 앞', 3)
on conflict (name) do nothing;

insert into prep_items (kind, text, display_order) values
  ('items',    '이름표와 명찰', 1),
  ('items',    '편한 운동화', 2),
  ('items',    '물통과 간식', 3),
  ('cautions', '선생님이 안내하는 장소에서 벗어나지 않아요', 1),
  ('cautions', '친구들과 사이좋게 지내요', 2),
  ('cautions', '미끄러운 곳에서는 뛰지 않아요', 3)
on conflict do nothing;

insert into app_settings (key, value) values ('event_date', '2026-05-05T10:00:00')
on conflict (key) do nothing;

-- ── Row Level Security ────────────────────────────────────
-- 행사 앱이라 anon 키로 모든 CRUD 허용 (비밀번호는 앱 레벨에서 처리).
-- 추후 강화하려면 아래 정책을 select/insert 별로 분리하면 됨.

alter table classes             enable row level security;
alter table children            enable row level security;
alter table missions            enable row level security;
alter table mission_completions enable row level security;
alter table posts               enable row level security;
alter table comments            enable row level security;
alter table prep_items          enable row level security;
alter table app_settings        enable row level security;

drop policy if exists open_all on classes;
create policy open_all on classes for all using (true) with check (true);
drop policy if exists open_all on children;
create policy open_all on children for all using (true) with check (true);
drop policy if exists open_all on missions;
create policy open_all on missions for all using (true) with check (true);
drop policy if exists open_all on mission_completions;
create policy open_all on mission_completions for all using (true) with check (true);
drop policy if exists open_all on posts;
create policy open_all on posts for all using (true) with check (true);
drop policy if exists open_all on comments;
create policy open_all on comments for all using (true) with check (true);
drop policy if exists open_all on prep_items;
create policy open_all on prep_items for all using (true) with check (true);
drop policy if exists open_all on app_settings;
create policy open_all on app_settings for all using (true) with check (true);

-- ── Storage: posts 버킷 + RLS 정책 ──────────────────────
-- 게시판 이미지 업로드용 public 버킷
insert into storage.buckets (id, name, public)
values ('posts', 'posts', true)
on conflict (id) do nothing;

-- anon/authenticated 가 posts 버킷에 업로드/조회/삭제 가능
drop policy if exists posts_read on storage.objects;
create policy posts_read on storage.objects
  for select using (bucket_id = 'posts');
drop policy if exists posts_insert on storage.objects;
create policy posts_insert on storage.objects
  for insert with check (bucket_id = 'posts');
drop policy if exists posts_update on storage.objects;
create policy posts_update on storage.objects
  for update using (bucket_id = 'posts') with check (bucket_id = 'posts');
drop policy if exists posts_delete on storage.objects;
create policy posts_delete on storage.objects
  for delete using (bucket_id = 'posts');

-- ── Realtime ──────────────────────────────────────────────
-- 선생님이 미션 체크하면 어린이 화면도 즉시 갱신되도록
-- supabase_realtime publication에 주요 테이블 추가
alter publication supabase_realtime add table missions;
alter publication supabase_realtime add table mission_completions;
alter publication supabase_realtime add table children;
alter publication supabase_realtime add table posts;
alter publication supabase_realtime add table comments;
