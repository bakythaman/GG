"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  Calculator,
  CheckCircle2,
  ClipboardList,
  Home,
  Layers3,
  MapPin,
  MessageCircle,
  Phone,
  Ruler,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { Progress } from "@/components/ui/progress";
import { useDemoState } from "@/lib/store";
import { formatCurrency } from "@/lib/utils";

const services = [
  {
    title: "Дизайн интерьера",
    text: "Планировки, визуализации, чертежи, подбор материалов и мебельные решения.",
    icon: Sparkles
  },
  {
    title: "Ремонт под ключ",
    text: "Полный цикл работ: от демонтажа и инженерии до чистовой отделки и уборки.",
    icon: Home
  },
  {
    title: "Архитектурное проектирование",
    text: "Проектирование жилых домов и коммерческих пространств с точной логикой реализации.",
    icon: Building2
  },
  {
    title: "Авторский надзор",
    text: "Дизайнер и руководитель проекта контролируют соответствие результата проекту.",
    icon: ClipboardList
  },
  {
    title: "Комплектация",
    text: "Мебель, материалы, свет, декор, поставщики и контроль сроков доставки.",
    icon: Layers3
  },
  {
    title: "Коммерческие помещения",
    text: "Ремонт салонов, барбершопов, офисов и кафе с учётом запуска бизнеса.",
    icon: Ruler
  }
];

const portfolio = [
  {
    title: "Atilla",
    meta: "134 м² · Шымкент · коммерция",
    time: "14 недель",
    style: "графитовый минимализм",
    image: "project-atilla",
    works: ["дизайн", "электрика", "отделка", "мебель"]
  },
  {
    title: "ЖК Авалон",
    meta: "94 м² · Алматы · квартира",
    time: "8 недель",
    style: "тёплый contemporary",
    image: "project-avalon",
    works: ["планировка", "3D", "чертежи", "смета"]
  },
  {
    title: "ЖК Capital City",
    meta: "118 м² · Шымкент · квартира",
    time: "12 недель",
    style: "мягкий премиум",
    image: "project-capital",
    works: ["ремонт", "комплектация", "надзор"]
  },
  {
    title: "Дом в мкр Кайтпас",
    meta: "600 м² · Шымкент · дом",
    time: "9 месяцев",
    style: "современная классика",
    image: "project-villa",
    works: ["архитектура", "инженерия", "ремонт"]
  }
];

const process = ["Заявка", "Консультация", "Замер", "Дизайн-проект", "Смета", "Ремонт", "Сдача объекта"];

const advantages = [
  "Прозрачная смета",
  "Контроль сроков",
  "Фотоотчёты",
  "Личный кабинет клиента",
  "Команда дизайнеров и прорабов",
  "Полный цикл работ"
];

const faqs = [
  {
    question: "Можно ли заказать только дизайн-проект?",
    answer: "Да. Можно начать с планировки, визуализаций и рабочей документации, а ремонт подключить позже."
  },
  {
    question: "Как считается предварительная стоимость?",
    answer: "Калькулятор учитывает тип объекта, площадь, услугу, класс ремонта, город, мебель и авторский надзор."
  },
  {
    question: "Что видит клиент в личном кабинете?",
    answer: "Прогресс объекта, этапы, фотоотчёты, открытые документы, оплаты и согласования."
  },
  {
    question: "Можно ли вести коммерческий объект?",
    answer: "Да. Для салонов, офисов и кафе учитываются сроки запуска, инженерные зоны и износостойкие материалы."
  }
];

const baseRates = {
  "дизайн-проект": 14000,
  ремонт: 85000,
  "дизайн + ремонт": 98000,
  мебель: 62000
};

const classMultipliers = {
  базовый: 0.82,
  комфорт: 1,
  премиум: 1.34
};

const typeMultipliers = {
  квартира: 1,
  дом: 1.18,
  "коммерческое помещение": 1.12
};

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function LandingPage() {
  const { addLead, supabaseEnabled } = useDemoState();
  const [objectType, setObjectType] = useState<keyof typeof typeMultipliers>("квартира");
  const [area, setArea] = useState(94);
  const [service, setService] = useState<keyof typeof baseRates>("дизайн + ремонт");
  const [repairClass, setRepairClass] = useState<keyof typeof classMultipliers>("комфорт");
  const [city, setCity] = useState("Шымкент");
  const [furniture, setFurniture] = useState(true);
  const [supervision, setSupervision] = useState(true);
  const [leadForm, setLeadForm] = useState({
    name: "",
    phone: "",
    whatsapp: "",
    comment: ""
  });
  const [saved, setSaved] = useState(false);

  const estimate = useMemo(() => {
    const cityMultiplier = city === "Алматы" ? 1.12 : city === "другое" ? 1.08 : 1;
    const extras = (furniture ? 18000 : 0) + (supervision ? 9000 : 0);
    return Math.round(
      area *
        (baseRates[service] + extras) *
        classMultipliers[repairClass] *
        typeMultipliers[objectType] *
        cityMultiplier
    );
  }, [area, city, furniture, objectType, repairClass, service, supervision]);

  async function handleLeadSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await addLead({
      name: leadForm.name || "Новая заявка",
      phone: leadForm.phone,
      whatsapp: leadForm.whatsapp || leadForm.phone,
      city,
      objectType,
      area,
      budget: estimate,
      source: "Лендинг",
      comment:
        leadForm.comment ||
        `${service}, ${repairClass}, мебель: ${furniture ? "да" : "нет"}, надзор: ${
          supervision ? "да" : "нет"
        }`
    });
    setSaved(true);
    setLeadForm({ name: "", phone: "", whatsapp: "", comment: "" });
  }

  return (
    <main className="min-h-screen bg-[#fbfaf7]">
      <section className="hero-interior relative min-h-[92vh] overflow-hidden text-white">
        <nav className="section-shell flex items-center justify-between py-5">
          <button
            className="text-left text-xl font-semibold tracking-normal"
            onClick={() => scrollToId("top")}
            type="button"
          >
            Gulvira Group
          </button>
          <div className="hidden items-center gap-6 text-sm text-white/82 md:flex">
            <button onClick={() => scrollToId("calculator")} type="button">
              Калькулятор
            </button>
            <button onClick={() => scrollToId("portfolio")} type="button">
              Проекты
            </button>
            <Link href="/dashboard">CRM</Link>
            <Link href="/client">Кабинет</Link>
          </div>
          <a className="hidden items-center gap-2 text-sm font-medium md:inline-flex" href="tel:+77756691003">
            <Phone className="h-4 w-4" />
            +7 775 669 10 03
          </a>
        </nav>

        <div id="top" className="section-shell flex min-h-[calc(92vh-88px)] items-center pb-16 pt-12">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="max-w-3xl"
          >
            <Badge tone="gold" className="mb-6">
              Шымкент · Алматы · полный сервис
            </Badge>
            <h1 className="max-w-3xl text-5xl font-semibold leading-[1.03] tracking-normal md:text-7xl">
              Дизайн и ремонт под ключ
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/84 md:text-xl">
              От идеи и дизайн-проекта до ремонта, мебели и сдачи объекта.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Button variant="gold" onClick={() => scrollToId("calculator")}>
                Рассчитать стоимость
                <Calculator className="h-4 w-4" />
              </Button>
              <Button variant="outline" className="border-white/40 bg-white/10 text-white hover:bg-white/20" onClick={() => scrollToId("portfolio")}>
                Посмотреть проекты
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="mt-12 grid max-w-2xl grid-cols-3 gap-4 text-sm text-white/78">
              <div>
                <p className="text-3xl font-semibold text-white">25 000 м²</p>
                <p>площадь реализованных ремонтов</p>
              </div>
              <div>
                <p className="text-3xl font-semibold text-white">150</p>
                <p>мастеров в команде</p>
              </div>
              <div>
                <p className="text-3xl font-semibold text-white">3</p>
                <p>города Казахстана</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section id="calculator" className="bg-white py-20">
        <div className="section-shell grid gap-10 lg:grid-cols-[0.95fr_1.05fr]">
          <div>
            <Badge tone="dark">Калькулятор</Badge>
            <h2 className="mt-4 max-w-xl text-4xl font-semibold text-graphite-900 md:text-5xl">
              Предварительный бюджет за одну минуту
            </h2>
            <p className="mt-5 max-w-lg text-base leading-7 text-graphite-500">
              Заполните параметры объекта. После расчёта заявка попадёт в CRM, где менеджер сможет
              связаться с клиентом и довести сделку до замера.
            </p>
            <div className="mt-8 rounded-lg border border-gold-100 bg-gold-100/40 p-5">
              <p className="text-sm text-graphite-500">Предварительно</p>
              <p className="mt-2 text-4xl font-semibold text-graphite-900">от {formatCurrency(estimate)}</p>
              <Progress value={Math.min(100, Math.round(area / 3))} className="mt-5" />
            </div>
          </div>

          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>Расчёт и заявка</CardTitle>
              <CardDescription>
                {supabaseEnabled
                  ? "Supabase подключён, заявки можно отправлять в базу."
                  : "Демо-режим: заявка сохранится в браузере и появится в CRM."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="grid gap-4" onSubmit={handleLeadSubmit}>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Тип объекта">
                    <Select value={objectType} onChange={(event) => setObjectType(event.target.value as keyof typeof typeMultipliers)}>
                      <option>квартира</option>
                      <option>дом</option>
                      <option>коммерческое помещение</option>
                    </Select>
                  </Field>
                  <Field label="Площадь, м²">
                    <Input min={20} type="number" value={area} onChange={(event) => setArea(Number(event.target.value))} />
                  </Field>
                  <Field label="Услуга">
                    <Select value={service} onChange={(event) => setService(event.target.value as keyof typeof baseRates)}>
                      <option>дизайн-проект</option>
                      <option>ремонт</option>
                      <option>дизайн + ремонт</option>
                      <option>мебель</option>
                    </Select>
                  </Field>
                  <Field label="Класс ремонта">
                    <Select value={repairClass} onChange={(event) => setRepairClass(event.target.value as keyof typeof classMultipliers)}>
                      <option>базовый</option>
                      <option>комфорт</option>
                      <option>премиум</option>
                    </Select>
                  </Field>
                  <Field label="Город">
                    <Select value={city} onChange={(event) => setCity(event.target.value)}>
                      <option>Шымкент</option>
                      <option>Алматы</option>
                      <option>другое</option>
                    </Select>
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="flex items-center gap-2 rounded-md border border-graphite-200 px-3 text-sm">
                      <input checked={furniture} onChange={(event) => setFurniture(event.target.checked)} type="checkbox" />
                      Мебель
                    </label>
                    <label className="flex items-center gap-2 rounded-md border border-graphite-200 px-3 text-sm">
                      <input checked={supervision} onChange={(event) => setSupervision(event.target.checked)} type="checkbox" />
                      Надзор
                    </label>
                  </div>
                </div>

                <div className="grid gap-4 border-t border-graphite-100 pt-4 md:grid-cols-2">
                  <Field label="Имя">
                    <Input required value={leadForm.name} onChange={(event) => setLeadForm({ ...leadForm, name: event.target.value })} />
                  </Field>
                  <Field label="Телефон">
                    <Input required value={leadForm.phone} onChange={(event) => setLeadForm({ ...leadForm, phone: event.target.value })} />
                  </Field>
                  <Field label="WhatsApp">
                    <Input value={leadForm.whatsapp} onChange={(event) => setLeadForm({ ...leadForm, whatsapp: event.target.value })} />
                  </Field>
                  <Field label="Комментарий">
                    <Input value={leadForm.comment} onChange={(event) => setLeadForm({ ...leadForm, comment: event.target.value })} />
                  </Field>
                </div>
                <Button variant="gold" type="submit">
                  Получить точный расчёт
                  <MessageCircle className="h-4 w-4" />
                </Button>
                {saved && <p className="text-sm font-medium text-moss">Заявка сохранена. Откройте CRM, чтобы увидеть её в воронке.</p>}
              </form>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="py-20">
        <div className="section-shell">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <Badge tone="gold">Услуги</Badge>
              <h2 className="mt-4 max-w-2xl text-4xl font-semibold text-graphite-900">
                Дизайн, ремонт, архитектура и комплектация в одной системе
              </h2>
            </div>
            <p className="max-w-md text-sm leading-6 text-graphite-500">
              Команда ведёт объект от первой консультации до финального клининга, а клиент видит ход
              работ в личном кабинете.
            </p>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {services.map((serviceItem) => {
              const Icon = serviceItem.icon;
              return (
                <Card key={serviceItem.title} className="min-h-48">
                  <CardHeader>
                    <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-md bg-graphite-900 text-gold-300">
                      <Icon className="h-5 w-5" />
                    </div>
                    <CardTitle>{serviceItem.title}</CardTitle>
                    <CardDescription>{serviceItem.text}</CardDescription>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <section id="portfolio" className="bg-graphite-900 py-20 text-white">
        <div className="section-shell">
          <Badge tone="gold">Портфолио</Badge>
          <h2 className="mt-4 max-w-3xl text-4xl font-semibold">Завершённые и активные проекты команды</h2>
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {portfolio.map((project) => (
              <article key={project.title} className="overflow-hidden rounded-lg border border-white/10 bg-white/5">
                <div className={`${project.image} h-72 bg-cover bg-center`} />
                <div className="space-y-4 p-5">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="text-2xl font-semibold">{project.title}</h3>
                      <p className="text-sm text-white/64">{project.meta}</p>
                    </div>
                    <Badge tone="gold">{project.time}</Badge>
                  </div>
                  <p className="text-sm text-white/72">{project.style}</p>
                  <div className="flex flex-wrap gap-2">
                    {project.works.map((work) => (
                      <span key={work} className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/80">
                        {work}
                      </span>
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="section-shell">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <Badge tone="dark">Процесс</Badge>
              <h2 className="mt-4 text-4xl font-semibold text-graphite-900">Как проходит работа</h2>
              <p className="mt-4 text-sm leading-6 text-graphite-500">
                Каждый этап фиксируется в CRM: дедлайны, ответственные, фото, файлы и согласования.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {process.map((step, index) => (
                <div key={step} className="flex items-center gap-4 rounded-lg border border-graphite-100 bg-graphite-50 p-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold-500 font-semibold text-graphite-900">
                    {index + 1}
                  </span>
                  <p className="font-medium text-graphite-900">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="section-shell grid gap-10 lg:grid-cols-2">
          <div>
            <Badge tone="gold">Преимущества</Badge>
            <h2 className="mt-4 text-4xl font-semibold text-graphite-900">Премиальный сервис без хаоса в коммуникациях</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {advantages.map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-lg bg-white p-4 shadow-sm">
                <CheckCircle2 className="h-5 w-5 text-moss" />
                <span className="font-medium text-graphite-800">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="section-shell grid gap-6 lg:grid-cols-3">
          {[
            "Ремонт прошёл спокойно: видели фото, этапы и оплаты в одном кабинете.",
            "Команда быстро предложила планировку и честно показала смету по материалам.",
            "Для коммерческого объекта особенно помог контроль сроков и ежедневные отчёты."
          ].map((review, index) => (
            <Card key={review}>
              <CardHeader>
                <div className="flex gap-1 text-gold-500">
                  {Array.from({ length: 5 }).map((_, starIndex) => (
                    <BadgeCheck className="h-4 w-4" key={`${index}-${starIndex}`} />
                  ))}
                </div>
                <CardDescription className="text-base leading-7 text-graphite-700">“{review}”</CardDescription>
                <CardTitle className="text-sm">Клиент Gulvira Group</CardTitle>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      <section className="py-20">
        <div className="section-shell grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <Badge tone="dark">FAQ</Badge>
            <h2 className="mt-4 text-4xl font-semibold text-graphite-900">Частые вопросы</h2>
          </div>
          <div className="space-y-3">
            {faqs.map((faq) => (
              <details key={faq.question} className="rounded-lg border border-graphite-100 bg-white p-5">
                <summary className="cursor-pointer font-semibold text-graphite-900">{faq.question}</summary>
                <p className="mt-3 text-sm leading-6 text-graphite-500">{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-graphite-900 py-16 text-white">
        <div className="section-shell grid gap-8 lg:grid-cols-[1fr_0.8fr] lg:items-center">
          <div>
            <h2 className="text-4xl font-semibold">Обсудим ваш объект?</h2>
            <p className="mt-4 max-w-xl text-white/70">
              Оставьте заявку, и менеджер подготовит точный расчёт после консультации и замера.
            </p>
            <div className="mt-6 flex flex-wrap gap-4 text-sm text-white/75">
              <span className="inline-flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gold-300" />
                Шымкент, мкр Туран, 682/1
              </span>
              <span className="inline-flex items-center gap-2">
                <Phone className="h-4 w-4 text-gold-300" />
                +7 775 669 10 03
              </span>
            </div>
          </div>
          <form className="grid gap-3 rounded-lg bg-white p-5 text-graphite-900" onSubmit={handleLeadSubmit}>
            <Input placeholder="Имя" required value={leadForm.name} onChange={(event) => setLeadForm({ ...leadForm, name: event.target.value })} />
            <Input placeholder="Телефон" required value={leadForm.phone} onChange={(event) => setLeadForm({ ...leadForm, phone: event.target.value })} />
            <Textarea placeholder="Что нужно сделать?" value={leadForm.comment} onChange={(event) => setLeadForm({ ...leadForm, comment: event.target.value })} />
            <Button variant="gold" type="submit">Оставить заявку</Button>
          </form>
        </div>
      </section>
    </main>
  );
}
