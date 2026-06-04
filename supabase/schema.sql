create extension if not exists pgcrypto;

create schema if not exists app;

create type public.user_role as enum (
  'admin',
  'manager',
  'designer',
  'foreman',
  'accountant',
  'client'
);

create type public.lead_status as enum (
  'Новая заявка',
  'Связаться',
  'Консультация',
  'Замер назначен',
  'Замер проведён',
  'КП отправлено',
  'Договор',
  'Оплата',
  'Проект в работе',
  'Отказ'
);

create type public.stage_status as enum ('не начат', 'в работе', 'на проверке', 'завершён');
create type public.task_status as enum ('новая', 'в работе', 'на проверке', 'завершена');
create type public.priority_level as enum ('низкий', 'средний', 'высокий');
create type public.material_status as enum ('нужно купить', 'заказано', 'доставлено', 'оплачено');
create type public.approval_status as enum ('ожидает', 'одобрено', 'нужны правки', 'вопрос');

create table public.users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete set null,
  name text not null,
  email text not null unique,
  role public.user_role not null,
  created_at timestamptz not null default now()
);

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  name text not null,
  phone text not null,
  whatsapp text,
  email text,
  created_at timestamptz not null default now()
);

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  whatsapp text,
  city text not null,
  object_type text not null,
  area numeric not null check (area > 0),
  budget numeric not null default 0,
  source text not null default 'Сайт',
  comment text,
  manager_id uuid references public.users(id) on delete set null,
  status public.lead_status not null default 'Новая заявка',
  created_at timestamptz not null default now()
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  client_id uuid not null references public.clients(id) on delete cascade,
  address text not null,
  city text not null,
  area numeric not null check (area > 0),
  object_type text not null,
  service text not null,
  start_date date not null,
  planned_due_date date not null,
  manager_id uuid references public.users(id) on delete set null,
  designer_id uuid references public.users(id) on delete set null,
  foreman_id uuid references public.users(id) on delete set null,
  status text not null,
  progress integer not null default 0 check (progress between 0 and 100),
  budget numeric not null default 0,
  paid numeric not null default 0,
  created_at timestamptz not null default now()
);

create table public.project_stages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  status public.stage_status not null default 'не начат',
  start_date date,
  deadline date,
  responsible_id uuid references public.users(id) on delete set null,
  description text,
  progress integer not null default 0 check (progress between 0 and 100),
  visible_for_client boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  project_id uuid not null references public.projects(id) on delete cascade,
  stage_id uuid references public.project_stages(id) on delete set null,
  responsible_id uuid references public.users(id) on delete set null,
  deadline date,
  priority public.priority_level not null default 'средний',
  status public.task_status not null default 'новая',
  created_at timestamptz not null default now()
);

create table public.project_files (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  stage_id uuid references public.project_stages(id) on delete set null,
  title text not null,
  file_type text not null,
  storage_path text,
  visible_for_client boolean not null default false,
  uploaded_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.photo_reports (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  stage_id uuid references public.project_stages(id) on delete set null,
  image_path text not null,
  description text,
  report_date date not null default current_date,
  author_id uuid references public.users(id) on delete set null,
  visible_for_client boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.estimates (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  total_amount numeric not null default 0,
  status text not null default 'draft',
  visible_for_client boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  amount numeric not null check (amount >= 0),
  payment_date date not null default current_date,
  payment_type text not null,
  status text not null default 'ожидается',
  created_at timestamptz not null default now()
);

create table public.materials (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null,
  quantity text not null,
  price numeric not null default 0,
  supplier text,
  project_id uuid not null references public.projects(id) on delete cascade,
  status public.material_status not null default 'нужно купить',
  created_at timestamptz not null default now()
);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  stage_id uuid references public.project_stages(id) on delete set null,
  task_id uuid references public.tasks(id) on delete cascade,
  author_id uuid references public.users(id) on delete set null,
  body text not null,
  visible_for_client boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.approvals (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  status public.approval_status not null default 'ожидает',
  comment text,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create or replace function app.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.users where auth_user_id = auth.uid()
$$;

create or replace function app.current_user_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.users where auth_user_id = auth.uid()
$$;

create or replace function app.current_client_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select clients.id
  from public.clients
  join public.users on users.id = clients.user_id
  where users.auth_user_id = auth.uid()
$$;

create or replace function app.can_access_project(project_row public.projects)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    app.current_user_role() = 'admin'
    or (
      app.current_user_role() in ('manager', 'designer', 'foreman', 'accountant')
      and (
        project_row.manager_id = app.current_user_id()
        or project_row.designer_id = app.current_user_id()
        or project_row.foreman_id = app.current_user_id()
        or app.current_user_role() = 'accountant'
      )
    )
    or (
      app.current_user_role() = 'client'
      and project_row.client_id = app.current_client_id()
    )
$$;

alter table public.users enable row level security;
alter table public.clients enable row level security;
alter table public.leads enable row level security;
alter table public.projects enable row level security;
alter table public.project_stages enable row level security;
alter table public.tasks enable row level security;
alter table public.project_files enable row level security;
alter table public.photo_reports enable row level security;
alter table public.estimates enable row level security;
alter table public.payments enable row level security;
alter table public.materials enable row level security;
alter table public.comments enable row level security;
alter table public.approvals enable row level security;

create policy "admin users all" on public.users for all using (app.current_user_role() = 'admin') with check (app.current_user_role() = 'admin');
create policy "own user read" on public.users for select using (auth_user_id = auth.uid());

create policy "staff clients read" on public.clients for select using (app.current_user_role() in ('admin', 'manager', 'designer', 'foreman', 'accountant'));
create policy "client own profile" on public.clients for select using (id = app.current_client_id());
create policy "admin manager clients write" on public.clients for all using (app.current_user_role() in ('admin', 'manager')) with check (app.current_user_role() in ('admin', 'manager'));

create policy "admin manager leads all" on public.leads for all using (app.current_user_role() in ('admin', 'manager')) with check (app.current_user_role() in ('admin', 'manager'));
create policy "public lead insert" on public.leads for insert with check (true);

create policy "projects scoped read" on public.projects for select using (app.can_access_project(projects));
create policy "projects staff write" on public.projects for all using (app.current_user_role() in ('admin', 'manager')) with check (app.current_user_role() in ('admin', 'manager'));

create policy "stages scoped read" on public.project_stages for select using (
  exists (select 1 from public.projects p where p.id = project_id and app.can_access_project(p))
  and (app.current_user_role() <> 'client' or visible_for_client)
);
create policy "stages staff write" on public.project_stages for all using (app.current_user_role() in ('admin', 'manager', 'designer', 'foreman')) with check (app.current_user_role() in ('admin', 'manager', 'designer', 'foreman'));

create policy "tasks staff scoped read" on public.tasks for select using (
  app.current_user_role() in ('admin', 'manager', 'designer', 'foreman')
  and exists (select 1 from public.projects p where p.id = project_id and app.can_access_project(p))
);
create policy "tasks staff write" on public.tasks for all using (app.current_user_role() in ('admin', 'manager', 'designer', 'foreman')) with check (app.current_user_role() in ('admin', 'manager', 'designer', 'foreman'));

create policy "files scoped read" on public.project_files for select using (
  exists (select 1 from public.projects p where p.id = project_id and app.can_access_project(p))
  and (app.current_user_role() <> 'client' or visible_for_client)
);
create policy "files staff write" on public.project_files for all using (app.current_user_role() in ('admin', 'manager', 'designer', 'foreman', 'accountant')) with check (app.current_user_role() in ('admin', 'manager', 'designer', 'foreman', 'accountant'));

create policy "reports scoped read" on public.photo_reports for select using (
  exists (select 1 from public.projects p where p.id = project_id and app.can_access_project(p))
  and (app.current_user_role() <> 'client' or visible_for_client)
);
create policy "reports staff write" on public.photo_reports for all using (app.current_user_role() in ('admin', 'manager', 'designer', 'foreman')) with check (app.current_user_role() in ('admin', 'manager', 'designer', 'foreman'));

create policy "estimates scoped read" on public.estimates for select using (
  exists (select 1 from public.projects p where p.id = project_id and app.can_access_project(p))
  and (app.current_user_role() <> 'client' or visible_for_client)
);
create policy "estimates staff write" on public.estimates for all using (app.current_user_role() in ('admin', 'manager', 'accountant')) with check (app.current_user_role() in ('admin', 'manager', 'accountant'));

create policy "payments scoped read" on public.payments for select using (
  exists (select 1 from public.projects p where p.id = project_id and app.can_access_project(p))
);
create policy "payments finance write" on public.payments for all using (app.current_user_role() in ('admin', 'accountant')) with check (app.current_user_role() in ('admin', 'accountant'));

create policy "materials scoped read" on public.materials for select using (
  app.current_user_role() <> 'client'
  and exists (select 1 from public.projects p where p.id = project_id and app.can_access_project(p))
);
create policy "materials staff write" on public.materials for all using (app.current_user_role() in ('admin', 'manager', 'foreman', 'accountant')) with check (app.current_user_role() in ('admin', 'manager', 'foreman', 'accountant'));

create policy "comments scoped read" on public.comments for select using (
  exists (select 1 from public.projects p where p.id = project_id and app.can_access_project(p))
  and (app.current_user_role() <> 'client' or visible_for_client)
);
create policy "comments scoped insert" on public.comments for insert with check (
  exists (select 1 from public.projects p where p.id = project_id and app.can_access_project(p))
);

create policy "approvals scoped read" on public.approvals for select using (
  exists (select 1 from public.projects p where p.id = project_id and app.can_access_project(p))
);
create policy "approvals staff client update" on public.approvals for update using (
  exists (select 1 from public.projects p where p.id = project_id and app.can_access_project(p))
) with check (
  exists (select 1 from public.projects p where p.id = project_id and app.can_access_project(p))
);
create policy "approvals staff insert" on public.approvals for insert with check (app.current_user_role() in ('admin', 'manager', 'designer'));

insert into public.users (id, name, email, role) values
  ('00000000-0000-0000-0000-000000000001', 'Гульвира Бакытжанкызы', 'admin@gulvira.kz', 'admin'),
  ('00000000-0000-0000-0000-000000000002', 'Алия Сапар', 'manager@gulvira.kz', 'manager'),
  ('00000000-0000-0000-0000-000000000003', 'Диана Ермек', 'designer@gulvira.kz', 'designer'),
  ('00000000-0000-0000-0000-000000000004', 'Руслан Омар', 'foreman@gulvira.kz', 'foreman'),
  ('00000000-0000-0000-0000-000000000005', 'Мадина Нур', 'accountant@gulvira.kz', 'accountant'),
  ('00000000-0000-0000-0000-000000000006', 'Айдар Абилов', 'aidar@example.kz', 'client'),
  ('00000000-0000-0000-0000-000000000007', 'Сауле Мухамед', 'saule@example.kz', 'client'),
  ('00000000-0000-0000-0000-000000000008', 'Дана Орман', 'dana@example.kz', 'client')
on conflict (id) do nothing;

insert into public.clients (id, user_id, name, phone, whatsapp, email) values
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000006', 'Айдар Абилов', '+7 775 669 10 03', '+7 775 669 10 03', 'aidar@example.kz'),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000007', 'Сауле Мухамед', '+7 701 455 30 41', '+7 701 455 30 41', 'saule@example.kz'),
  ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000008', 'Дана Орман', '+7 707 211 89 12', '+7 707 211 89 12', 'dana@example.kz')
on conflict (id) do nothing;

insert into public.leads (name, phone, whatsapp, city, object_type, area, budget, source, comment, manager_id, status) values
  ('Нуржан', '+7 701 000 45 90', '+7 701 000 45 90', 'Шымкент', 'квартира', 82, 14500000, 'Instagram', 'Ремонт комфорт-класса в новостройке.', '00000000-0000-0000-0000-000000000002', 'Консультация'),
  ('Асем', '+7 707 880 10 10', '+7 707 880 10 10', 'Алматы', 'дом', 240, 52000000, 'Сайт', 'Архитектура и дизайн интерьера.', '00000000-0000-0000-0000-000000000002', 'Замер назначен'),
  ('Ербол', '+7 775 214 44 11', '+7 775 214 44 11', 'Шымкент', 'коммерческое помещение', 170, 33000000, 'WhatsApp', 'Кофейня, нужен быстрый запуск.', '00000000-0000-0000-0000-000000000002', 'КП отправлено'),
  ('Мадина', '+7 702 910 18 55', '+7 702 910 18 55', 'Алматы', 'квартира', 64, 9000000, 'Рекомендация', 'Дизайн-проект без реализации.', '00000000-0000-0000-0000-000000000002', 'Связаться'),
  ('Бекзат', '+7 747 880 70 20', '+7 747 880 70 20', 'Туркестан', 'дом', 310, 64000000, 'Instagram', 'Премиум-ремонт с мебелью.', '00000000-0000-0000-0000-000000000002', 'Договор');

insert into public.projects (id, title, client_id, address, city, area, object_type, service, start_date, planned_due_date, manager_id, designer_id, foreman_id, status, progress, budget, paid) values
  ('20000000-0000-0000-0000-000000000001', 'Atilla Barber Lounge', '10000000-0000-0000-0000-000000000001', 'Шымкент, ул. Байдибек би, 34', 'Шымкент', 134, 'коммерческое помещение', 'дизайн + ремонт', '2026-04-08', '2026-08-20', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000004', 'ремонт в работе', 62, 27800000, 19400000),
  ('20000000-0000-0000-0000-000000000002', 'ЖК Авалон, квартира 94 м²', '10000000-0000-0000-0000-000000000002', 'Алматы, ЖК Авалон, блок B', 'Алматы', 94, 'квартира', 'дизайн-проект', '2026-05-02', '2026-07-16', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000004', 'дизайн на согласовании', 43, 7800000, 3900000),
  ('20000000-0000-0000-0000-000000000003', 'Дом в мкр Кайтпас', '10000000-0000-0000-0000-000000000003', 'Шымкент, мкр Кайтпас', 'Шымкент', 600, 'дом', 'архитектура + ремонт', '2026-03-18', '2026-12-28', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000004', 'черновые работы', 37, 126000000, 61000000)
on conflict (id) do nothing;

insert into public.project_stages (id, project_id, title, status, start_date, deadline, responsible_id, description, progress, visible_for_client) values
  ('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Демонтаж', 'завершён', '2026-04-10', '2026-04-18', '00000000-0000-0000-0000-000000000004', 'Снятие старой отделки, вывоз мусора.', 100, true),
  ('30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', 'Электрика', 'на проверке', '2026-04-19', '2026-05-06', '00000000-0000-0000-0000-000000000004', 'Черновая электрика и выводы под световые линии.', 88, true),
  ('30000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000002', '3D-визуализация', 'в работе', '2026-05-11', '2026-06-14', '00000000-0000-0000-0000-000000000003', 'Визуализации кухни-гостиной и спален.', 48, true),
  ('30000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000003', 'Черновые работы', 'в работе', '2026-04-01', '2026-07-30', '00000000-0000-0000-0000-000000000004', 'Штукатурка, инженерные трассы, подготовка полов.', 56, true)
on conflict (id) do nothing;

insert into public.tasks (title, description, project_id, stage_id, responsible_id, deadline, priority, status) values
  ('Проверить щитовую Atilla', 'Сверить группы автоматов с рабочими чертежами.', '20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000004', '2026-06-06', 'высокий', 'на проверке'),
  ('Согласовать палитру ЖК Авалон', 'Подготовить две версии сочетаний.', '20000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000003', '2026-06-09', 'средний', 'в работе'),
  ('Заказать керамогранит для Кайтпас', 'Сверить остатки у поставщика.', '20000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000002', '2026-06-12', 'высокий', 'новая');

insert into public.project_files (project_id, stage_id, title, file_type, storage_path, visible_for_client, uploaded_by) values
  ('20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002', 'Договор Atilla', 'Договор', 'projects/atilla/contract.pdf', true, '00000000-0000-0000-0000-000000000002'),
  ('20000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000003', 'Планировка v3', 'Планировки', 'projects/avalon/layout-v3.pdf', true, '00000000-0000-0000-0000-000000000003'),
  ('20000000-0000-0000-0000-000000000003', null, 'Смета черновых работ', 'Смета', 'projects/kaitpas/estimate.pdf', true, '00000000-0000-0000-0000-000000000005');

insert into public.photo_reports (project_id, stage_id, image_path, description, report_date, author_id, visible_for_client) values
  ('20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002', 'reports/atilla/electric.jpg', 'Черновая электрика готова к проверке.', '2026-06-02', '00000000-0000-0000-0000-000000000004', true),
  ('20000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000003', 'reports/avalon/materials.jpg', 'Подбор материалов для кухни-гостиной.', '2026-06-03', '00000000-0000-0000-0000-000000000003', true),
  ('20000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000004', 'reports/kaitpas/rough.jpg', 'Штукатурные работы на первом этаже.', '2026-06-01', '00000000-0000-0000-0000-000000000004', true);

insert into public.payments (project_id, amount, payment_date, payment_type, status) values
  ('20000000-0000-0000-0000-000000000001', 12000000, '2026-04-08', 'предоплата', 'оплачено'),
  ('20000000-0000-0000-0000-000000000001', 7400000, '2026-05-16', 'этап', 'оплачено'),
  ('20000000-0000-0000-0000-000000000002', 3900000, '2026-05-02', 'предоплата', 'оплачено'),
  ('20000000-0000-0000-0000-000000000003', 61000000, '2026-03-18', 'предоплата', 'оплачено');

insert into public.materials (title, category, quantity, price, supplier, project_id, status) values
  ('Керамогранит Italon', 'плитка', '186 м²', 2790000, 'Kerama Market', '20000000-0000-0000-0000-000000000001', 'доставлено'),
  ('Декоративная штукатурка', 'отделка', '62 кг', 870000, 'Decor Pro', '20000000-0000-0000-0000-000000000002', 'заказано'),
  ('Трековые светильники', 'свет', '48 шт', 1480000, 'Light House', '20000000-0000-0000-0000-000000000003', 'нужно купить');

insert into public.approvals (project_id, title, status, comment) values
  ('20000000-0000-0000-0000-000000000002', 'Планировка кухни-гостиной', 'ожидает', null),
  ('20000000-0000-0000-0000-000000000001', 'Палитра зоны ожидания', 'одобрено', 'Подтверждено клиентом.'),
  ('20000000-0000-0000-0000-000000000003', 'Смета черновых работ', 'ожидает', null);
