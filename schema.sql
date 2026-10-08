-- Run this ONCE in Supabase: SQL Editor > New query > paste > Run.

create table doctors (
  id uuid primary key default gen_random_uuid(),
  name text not null, role text, dept text, days text, photo text,
  active boolean default true, created_at timestamptz default now());

create table appointments (
  id uuid primary key default gen_random_uuid(),
  ref text, name text, phone text, service text, doctor text,
  date date, time text, note text, status text default 'New',
  created_at timestamptz default now());

create table patients (
  id uuid primary key default gen_random_uuid(),
  pid text unique not null, name text not null, sex text, dob date,
  phone text, id_no text, insurance text, address text,
  kin_name text, kin_phone text, allergies text,
  created_at timestamptz default now());

create table visits (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid references patients(id) on delete cascade,
  date date, doctor text, complaint text,
  temp text, bp text, pulse text, weight text,
  diagnosis text, treatment text, notes text, followup date,
  status text default 'Waiting', created_at timestamptz default now());

alter table doctors enable row level security;
alter table appointments enable row level security;
alter table patients enable row level security;
alter table visits enable row level security;

-- Public website: can read visible doctors and send appointment requests, nothing else.
create policy "public reads active doctors" on doctors for select to anon using (active = true);
create policy "public requests appointments" on appointments for insert to anon with check (true);

-- Signed-in staff: full access.
create policy "staff doctors" on doctors for all to authenticated using (true) with check (true);
create policy "staff appointments" on appointments for all to authenticated using (true) with check (true);
create policy "staff patients" on patients for all to authenticated using (true) with check (true);
create policy "staff visits" on visits for all to authenticated using (true) with check (true);

-- Patient portal: returns ONE patient's visits only when Patient ID and date of birth both match.
create or replace function patient_lookup(p_pid text, p_dob date) returns json
language sql security definer set search_path = public as $$
  select json_build_object(
    'patient', json_build_object('name', p.name, 'pid', p.pid),
    'visits', coalesce((select json_agg(json_build_object(
        'date', v.date, 'doctor', v.doctor, 'diagnosis', v.diagnosis,
        'treatment', v.treatment, 'followup', v.followup) order by v.date desc)
      from visits v where v.patient_id = p.id), '[]'::json))
  from patients p where upper(p.pid) = upper(p_pid) and p.dob = p_dob;
$$;
grant execute on function patient_lookup(text, date) to anon;

-- Doctor photos
insert into storage.buckets (id, name, public) values ('doctors', 'doctors', true) on conflict do nothing;
create policy "staff upload photos" on storage.objects for insert to authenticated with check (bucket_id = 'doctors');
create policy "staff update photos" on storage.objects for update to authenticated using (bucket_id = 'doctors');
create policy "staff delete photos" on storage.objects for delete to authenticated using (bucket_id = 'doctors');
