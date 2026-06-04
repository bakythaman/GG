export type Role = "admin" | "manager" | "designer" | "foreman" | "accountant" | "client";

export type LeadStatus =
  | "Новая заявка"
  | "Связаться"
  | "Консультация"
  | "Замер назначен"
  | "Замер проведён"
  | "КП отправлено"
  | "Договор"
  | "Оплата"
  | "Проект в работе"
  | "Отказ";

export type StageStatus = "не начат" | "в работе" | "на проверке" | "завершён";
export type TaskStatus = "новая" | "в работе" | "на проверке" | "завершена";
export type Priority = "низкий" | "средний" | "высокий";

export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

export type Client = {
  id: string;
  name: string;
  phone: string;
  whatsapp: string;
  email: string;
};

export type Lead = {
  id: string;
  name: string;
  phone: string;
  whatsapp: string;
  city: string;
  objectType: string;
  area: number;
  budget: number;
  source: string;
  comment: string;
  managerId: string;
  status: LeadStatus;
  createdAt: string;
};

export type Project = {
  id: string;
  title: string;
  clientId: string;
  address: string;
  city: string;
  area: number;
  objectType: string;
  service: string;
  startDate: string;
  dueDate: string;
  managerId: string;
  designerId: string;
  foremanId: string;
  status: string;
  progress: number;
  budget: number;
  paid: number;
};

export type ProjectStage = {
  id: string;
  projectId: string;
  title: string;
  status: StageStatus;
  startDate: string;
  deadline: string;
  responsibleId: string;
  description: string;
  progress: number;
  visibleForClient: boolean;
};

export type Task = {
  id: string;
  title: string;
  description: string;
  projectId: string;
  stageId: string;
  responsibleId: string;
  deadline: string;
  priority: Priority;
  status: TaskStatus;
  comments: string[];
};

export type ProjectFile = {
  id: string;
  projectId: string;
  stageId?: string;
  title: string;
  type: string;
  visibleForClient: boolean;
  uploadedAt: string;
};

export type PhotoReport = {
  id: string;
  projectId: string;
  stageId: string;
  imageUrl: string;
  description: string;
  date: string;
  authorId: string;
  visibleForClient: boolean;
};

export type Payment = {
  id: string;
  projectId: string;
  amount: number;
  date: string;
  type: "предоплата" | "этап" | "финальный платёж";
  status: "оплачено" | "ожидается";
};

export type Material = {
  id: string;
  title: string;
  category: string;
  quantity: string;
  price: number;
  supplier: string;
  projectId: string;
  status: "нужно купить" | "заказано" | "доставлено" | "оплачено";
};

export type Approval = {
  id: string;
  projectId: string;
  title: string;
  status: "ожидает" | "одобрено" | "нужны правки" | "вопрос";
  comment?: string;
  updatedAt: string;
};

export type DemoState = {
  users: User[];
  clients: Client[];
  leads: Lead[];
  projects: Project[];
  stages: ProjectStage[];
  tasks: Task[];
  files: ProjectFile[];
  photoReports: PhotoReport[];
  payments: Payment[];
  materials: Material[];
  approvals: Approval[];
};

export const leadStatuses: LeadStatus[] = [
  "Новая заявка",
  "Связаться",
  "Консультация",
  "Замер назначен",
  "Замер проведён",
  "КП отправлено",
  "Договор",
  "Оплата",
  "Проект в работе",
  "Отказ"
];

export const stageNames = [
  "Обмер",
  "Планировка",
  "Концепция",
  "3D-визуализация",
  "Рабочие чертежи",
  "Согласование дизайна",
  "Демонтаж",
  "Электрика",
  "Сантехника",
  "Черновые работы",
  "Чистовые работы",
  "Мебель",
  "Финальная уборка",
  "Сдача объекта"
];

const users: User[] = [
  { id: "u-admin", name: "Гульвира Бакытжанкызы", email: "admin@gulvira.kz", role: "admin" },
  { id: "u-manager", name: "Алия Сапар", email: "manager@gulvira.kz", role: "manager" },
  { id: "u-designer", name: "Диана Ермек", email: "designer@gulvira.kz", role: "designer" },
  { id: "u-foreman", name: "Руслан Омар", email: "foreman@gulvira.kz", role: "foreman" },
  { id: "u-accountant", name: "Мадина Нур", email: "accountant@gulvira.kz", role: "accountant" }
];

const clients: Client[] = [
  {
    id: "c-aidar",
    name: "Айдар Абилов",
    phone: "+7 775 669 10 03",
    whatsapp: "+7 775 669 10 03",
    email: "aidar@example.kz"
  },
  {
    id: "c-saule",
    name: "Сауле Мухамед",
    phone: "+7 701 455 30 41",
    whatsapp: "+7 701 455 30 41",
    email: "saule@example.kz"
  },
  {
    id: "c-dana",
    name: "Дана Орман",
    phone: "+7 707 211 89 12",
    whatsapp: "+7 707 211 89 12",
    email: "dana@example.kz"
  }
];

const projects: Project[] = [
  {
    id: "p-atilla",
    title: "Atilla Barber Lounge",
    clientId: "c-aidar",
    address: "Шымкент, ул. Байдибек би, 34",
    city: "Шымкент",
    area: 134,
    objectType: "коммерческое помещение",
    service: "дизайн + ремонт",
    startDate: "2026-04-08",
    dueDate: "2026-08-20",
    managerId: "u-manager",
    designerId: "u-designer",
    foremanId: "u-foreman",
    status: "ремонт в работе",
    progress: 62,
    budget: 27800000,
    paid: 19400000
  },
  {
    id: "p-avalon",
    title: "ЖК Авалон, квартира 94 м²",
    clientId: "c-saule",
    address: "Алматы, ЖК Авалон, блок B",
    city: "Алматы",
    area: 94,
    objectType: "квартира",
    service: "дизайн-проект",
    startDate: "2026-05-02",
    dueDate: "2026-07-16",
    managerId: "u-manager",
    designerId: "u-designer",
    foremanId: "u-foreman",
    status: "дизайн на согласовании",
    progress: 43,
    budget: 7800000,
    paid: 3900000
  },
  {
    id: "p-kaitpas",
    title: "Дом в мкр Кайтпас",
    clientId: "c-dana",
    address: "Шымкент, мкр Кайтпас",
    city: "Шымкент",
    area: 600,
    objectType: "дом",
    service: "архитектура + ремонт",
    startDate: "2026-03-18",
    dueDate: "2026-12-28",
    managerId: "u-manager",
    designerId: "u-designer",
    foremanId: "u-foreman",
    status: "черновые работы",
    progress: 37,
    budget: 126000000,
    paid: 61000000
  }
];

const stages: ProjectStage[] = [
  {
    id: "s-atilla-1",
    projectId: "p-atilla",
    title: "Демонтаж",
    status: "завершён",
    startDate: "2026-04-10",
    deadline: "2026-04-18",
    responsibleId: "u-foreman",
    description: "Снятие старой отделки, вывоз мусора, подготовка помещения под инженерные работы.",
    progress: 100,
    visibleForClient: true
  },
  {
    id: "s-atilla-2",
    projectId: "p-atilla",
    title: "Электрика",
    status: "на проверке",
    startDate: "2026-04-19",
    deadline: "2026-05-06",
    responsibleId: "u-foreman",
    description: "Черновая электрика, выводы под световые линии, рабочие зоны и барбер-станции.",
    progress: 88,
    visibleForClient: true
  },
  {
    id: "s-atilla-3",
    projectId: "p-atilla",
    title: "Чистовые работы",
    status: "в работе",
    startDate: "2026-05-18",
    deadline: "2026-07-25",
    responsibleId: "u-foreman",
    description: "Покраска, плитка, декоративные покрытия, установка дверей и светильников.",
    progress: 46,
    visibleForClient: true
  },
  {
    id: "s-avalon-1",
    projectId: "p-avalon",
    title: "Планировка",
    status: "завершён",
    startDate: "2026-05-02",
    deadline: "2026-05-10",
    responsibleId: "u-designer",
    description: "Три варианта планировочного решения с расстановкой мебели.",
    progress: 100,
    visibleForClient: true
  },
  {
    id: "s-avalon-2",
    projectId: "p-avalon",
    title: "3D-визуализация",
    status: "в работе",
    startDate: "2026-05-11",
    deadline: "2026-06-14",
    responsibleId: "u-designer",
    description: "Визуализации кухни-гостиной, мастер-спальни и детской.",
    progress: 48,
    visibleForClient: true
  },
  {
    id: "s-kaitpas-1",
    projectId: "p-kaitpas",
    title: "Черновые работы",
    status: "в работе",
    startDate: "2026-04-01",
    deadline: "2026-07-30",
    responsibleId: "u-foreman",
    description: "Штукатурка под маяк, инженерные трассы, подготовка полов.",
    progress: 56,
    visibleForClient: true
  }
];

const tasks: Task[] = [
  {
    id: "t-1",
    title: "Проверить щитовую Atilla",
    description: "Сверить группы автоматов с рабочими чертежами и фотофиксацией.",
    projectId: "p-atilla",
    stageId: "s-atilla-2",
    responsibleId: "u-foreman",
    deadline: "2026-06-06",
    priority: "высокий",
    status: "на проверке",
    comments: ["Фото загружены, ждём финальную проверку дизайнера по подсветке."]
  },
  {
    id: "t-2",
    title: "Согласовать палитру ЖК Авалон",
    description: "Подготовить две версии сочетаний: тёплый минимализм и контрастный графит.",
    projectId: "p-avalon",
    stageId: "s-avalon-2",
    responsibleId: "u-designer",
    deadline: "2026-06-09",
    priority: "средний",
    status: "в работе",
    comments: []
  },
  {
    id: "t-3",
    title: "Заказать керамогранит для Кайтпас",
    description: "Сверить остатки у поставщика, зафиксировать доставку первой партии.",
    projectId: "p-kaitpas",
    stageId: "s-kaitpas-1",
    responsibleId: "u-manager",
    deadline: "2026-06-12",
    priority: "высокий",
    status: "новая",
    comments: ["Нужна привязка к смете после подтверждения цены."]
  }
];

const leads: Lead[] = [
  {
    id: "l-1",
    name: "Нуржан",
    phone: "+7 701 000 45 90",
    whatsapp: "+7 701 000 45 90",
    city: "Шымкент",
    objectType: "квартира",
    area: 82,
    budget: 14500000,
    source: "Instagram",
    comment: "Хочет ремонт комфорт-класса в новостройке.",
    managerId: "u-manager",
    status: "Консультация",
    createdAt: "2026-06-01"
  },
  {
    id: "l-2",
    name: "Асем",
    phone: "+7 707 880 10 10",
    whatsapp: "+7 707 880 10 10",
    city: "Алматы",
    objectType: "дом",
    area: 240,
    budget: 52000000,
    source: "Сайт",
    comment: "Интересует архитектура и дизайн интерьера.",
    managerId: "u-manager",
    status: "Замер назначен",
    createdAt: "2026-06-02"
  },
  {
    id: "l-3",
    name: "Ербол",
    phone: "+7 775 214 44 11",
    whatsapp: "+7 775 214 44 11",
    city: "Шымкент",
    objectType: "коммерческое помещение",
    area: 170,
    budget: 33000000,
    source: "WhatsApp",
    comment: "Кофейня, нужен быстрый запуск.",
    managerId: "u-manager",
    status: "КП отправлено",
    createdAt: "2026-05-29"
  },
  {
    id: "l-4",
    name: "Мадина",
    phone: "+7 702 910 18 55",
    whatsapp: "+7 702 910 18 55",
    city: "Алматы",
    objectType: "квартира",
    area: 64,
    budget: 9000000,
    source: "Рекомендация",
    comment: "Дизайн-проект без реализации.",
    managerId: "u-manager",
    status: "Связаться",
    createdAt: "2026-06-03"
  },
  {
    id: "l-5",
    name: "Бекзат",
    phone: "+7 747 880 70 20",
    whatsapp: "+7 747 880 70 20",
    city: "Туркестан",
    objectType: "дом",
    area: 310,
    budget: 64000000,
    source: "Instagram",
    comment: "Премиум-ремонт с мебелью.",
    managerId: "u-manager",
    status: "Договор",
    createdAt: "2026-05-25"
  }
];

const files: ProjectFile[] = [
  {
    id: "f-1",
    projectId: "p-atilla",
    stageId: "s-atilla-2",
    title: "Договор Atilla",
    type: "Договор",
    visibleForClient: true,
    uploadedAt: "2026-04-08"
  },
  {
    id: "f-2",
    projectId: "p-avalon",
    stageId: "s-avalon-1",
    title: "Планировка v3",
    type: "Планировки",
    visibleForClient: true,
    uploadedAt: "2026-05-10"
  },
  {
    id: "f-3",
    projectId: "p-kaitpas",
    title: "Смета черновых работ",
    type: "Смета",
    visibleForClient: true,
    uploadedAt: "2026-04-02"
  },
  {
    id: "f-4",
    projectId: "p-atilla",
    title: "Внутренний акт проверки",
    type: "Акты",
    visibleForClient: false,
    uploadedAt: "2026-05-28"
  }
];

const photoReports: PhotoReport[] = [
  {
    id: "r-1",
    projectId: "p-atilla",
    stageId: "s-atilla-2",
    imageUrl: "https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=900&q=80",
    description: "Черновая электрика готова к проверке.",
    date: "2026-06-02",
    authorId: "u-foreman",
    visibleForClient: true
  },
  {
    id: "r-2",
    projectId: "p-avalon",
    stageId: "s-avalon-2",
    imageUrl: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=900&q=80",
    description: "Подбор материалов для кухни-гостиной.",
    date: "2026-06-03",
    authorId: "u-designer",
    visibleForClient: true
  },
  {
    id: "r-3",
    projectId: "p-kaitpas",
    stageId: "s-kaitpas-1",
    imageUrl: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=900&q=80",
    description: "Штукатурные работы на первом этаже.",
    date: "2026-06-01",
    authorId: "u-foreman",
    visibleForClient: true
  }
];

const payments: Payment[] = [
  { id: "pay-1", projectId: "p-atilla", amount: 12000000, date: "2026-04-08", type: "предоплата", status: "оплачено" },
  { id: "pay-2", projectId: "p-atilla", amount: 7400000, date: "2026-05-16", type: "этап", status: "оплачено" },
  { id: "pay-3", projectId: "p-avalon", amount: 3900000, date: "2026-05-02", type: "предоплата", status: "оплачено" },
  { id: "pay-4", projectId: "p-kaitpas", amount: 61000000, date: "2026-03-18", type: "предоплата", status: "оплачено" },
  { id: "pay-5", projectId: "p-atilla", amount: 4200000, date: "2026-06-15", type: "этап", status: "ожидается" }
];

const materials: Material[] = [
  {
    id: "m-1",
    title: "Керамогранит Italon",
    category: "плитка",
    quantity: "186 м²",
    price: 2790000,
    supplier: "Kerama Market",
    projectId: "p-atilla",
    status: "доставлено"
  },
  {
    id: "m-2",
    title: "Декоративная штукатурка",
    category: "отделка",
    quantity: "62 кг",
    price: 870000,
    supplier: "Decor Pro",
    projectId: "p-avalon",
    status: "заказано"
  },
  {
    id: "m-3",
    title: "Трековые светильники",
    category: "свет",
    quantity: "48 шт",
    price: 1480000,
    supplier: "Light House",
    projectId: "p-kaitpas",
    status: "нужно купить"
  }
];

const approvals: Approval[] = [
  {
    id: "a-1",
    projectId: "p-avalon",
    title: "Планировка кухни-гостиной",
    status: "ожидает",
    updatedAt: "2026-06-03"
  },
  {
    id: "a-2",
    projectId: "p-atilla",
    title: "Палитра зоны ожидания",
    status: "одобрено",
    updatedAt: "2026-05-30",
    comment: "Подтверждено клиентом."
  },
  {
    id: "a-3",
    projectId: "p-kaitpas",
    title: "Смета черновых работ",
    status: "ожидает",
    updatedAt: "2026-06-01"
  }
];

export const seedState: DemoState = {
  users,
  clients,
  leads,
  projects,
  stages,
  tasks,
  files,
  photoReports,
  payments,
  materials,
  approvals
};

export function createDemoState(): DemoState {
  return JSON.parse(JSON.stringify(seedState)) as DemoState;
}
