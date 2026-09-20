-- ============================================================
-- DersTakip — Supabase şema + güvenlik (RLS)
-- Bu dosyayı Supabase → SQL Editor'de çalıştırın.
-- Model: her öğrenci tek bir JSON belgesi olarak saklanır
-- (data sütunu). Satır sahibi (owner_id) öğretmendir.
-- ============================================================

create table if not exists public.students (
  id          uuid primary key,
  owner_id    uuid not null references auth.users (id) on delete cascade,
  parent_code text unique,
  data        jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists students_owner_idx on public.students (owner_id);

alter table public.students enable row level security;

-- Öğretmen (satır sahibi) tüm işlemleri yapabilir.
-- Başka hiçbir kimse — anon dâhil — tabloya doğrudan erişemez.
drop policy if exists "ogrenciler_sahibi_yonetir" on public.students;
create policy "ogrenciler_sahibi_yonetir"
  on public.students
  for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

-- updated_at otomatik güncellensin
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists students_touch_updated_at on public.students;
create trigger students_touch_updated_at
  before update on public.students
  for each row execute function public.touch_updated_at();

-- ------------------------------------------------------------
-- Veli erişimi: yalnızca erişim kodu ile, salt-okunur, tek öğrenci.
-- Tabloya doğrudan erişim YOK; yalnızca bu security definer fonksiyon
-- üzerinden, kod eşleşirse tek bir belge döner.
-- ------------------------------------------------------------
create or replace function public.parent_get_student(p_code text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select s.data
  from public.students s
  where s.parent_code = nullif(btrim(p_code), '')
  limit 1;
$$;

revoke all on function public.parent_get_student(text) from public;
grant execute on function public.parent_get_student(text) to anon, authenticated;

-- ------------------------------------------------------------
-- Öğretmen hesabı kurulumu:
-- 1) Supabase → Authentication → Users → "Add user" ile öğretmen
--    e-posta + şifre oluşturun (davetsiz kaydı kapatmak için:
--    Authentication → Providers → Email → "Allow new users to sign up"
--    seçeneğini kapatın; uygulama içindeki "Hesap Oluştur" yalnızca
--    ilk kurulum için vardır).
-- 2) Uygulamaya bu hesapla giriş yapın.
-- ------------------------------------------------------------
