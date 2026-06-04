# Gulvira Group Platform

Современное веб-приложение для Gulvira Group: публичный лендинг, рабочая CRM по проектам, портал сотрудников и личный кабинет клиента.

## Что внутри

- `Next.js`, `React`, `TypeScript`, `Tailwind CSS`
- shadcn/ui-подход к локальным компонентам интерфейса
- `Framer Motion` для мягких анимаций
- `Supabase`-клиент и готовая SQL-схема с RLS в `supabase/schema.sql`
- Демо-данные для проектов, клиентов, задач, этапов, сотрудников, чатов, документов, материалов, фотоотчётов и оплат
- Без вкладки лидов в CRM: заявки можно оставить на лендинге, а обработку лидов команда ведёт в Bitrix24
- LocalStorage fallback: формы работают без настроенного Supabase, а после подключения переменных окружения можно сохранять данные в Supabase

## Запуск

```bash
npm install
npm run dev
```

Откройте:

- `/` — лендинг
- `/dashboard` — рабочая CRM компании
- `/client` — кабинет клиента

## Supabase

Создайте проект Supabase и выполните SQL из `supabase/schema.sql`.

Локально добавьте `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Без этих переменных приложение работает как интерактивный демо-прототип и сохраняет действия в браузере.
