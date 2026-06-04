# Gulvira Group Platform

Современное веб-приложение для Gulvira Group: публичный лендинг, CRM/портал сотрудников и личный кабинет клиента.

## Что внутри

- `Next.js`, `React`, `TypeScript`, `Tailwind CSS`
- shadcn/ui-подход к локальным компонентам интерфейса
- `Framer Motion` для мягких анимаций
- `Supabase`-клиент и готовая SQL-схема с RLS в `supabase/schema.sql`
- Демо-данные для лидов, проектов, клиентов, задач, этапов, фотоотчётов и оплат
- LocalStorage fallback: формы работают без настроенного Supabase, а после подключения переменных окружения можно сохранять данные в Supabase

## Запуск

```bash
npm install
npm run dev
```

Откройте:

- `/` — лендинг
- `/dashboard` — портал сотрудников
- `/client` — кабинет клиента

## Supabase

Создайте проект Supabase и выполните SQL из `supabase/schema.sql`.

Локально добавьте `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Без этих переменных приложение работает как интерактивный демо-прототип и сохраняет действия в браузере.
