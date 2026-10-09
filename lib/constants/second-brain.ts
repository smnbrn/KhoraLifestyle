// Etichette italiane per i nuovi moduli (obiettivi, rubrica, vita, investimenti).

export const GOAL_CATEGORY = {
  general: "Generale",
  work: "Lavoro",
  life: "Vita",
  finance: "Finanze",
} as const;

// "source" = da dove arriva il valore attuale. Tutto tranne "manual" si
// calcola da solo dai dati dell'app, così l'indicatore non va aggiornato a mano.
export const GOAL_SOURCE = {
  manual: "Manuale (aggiorno io il valore)",
  income_year: "Guadagni dell'anno (entrate)",
  invested_year: "Soldi investiti nell'anno",
  gym_days: "Giorni di allenamento",
  travel_days: "Giorni di viaggio",
  clients_acquired: "Clienti acquisiti",
} as const;

export const GOAL_SOURCE_META: Record<
  keyof typeof GOAL_SOURCE,
  { title: string; format: "currency" | "number"; suffix?: string; category: keyof typeof GOAL_CATEGORY }
> = {
  manual: { title: "", format: "number", category: "general" },
  income_year: { title: "Guadagni", format: "currency", category: "finance" },
  invested_year: { title: "Investimenti", format: "currency", category: "finance" },
  gym_days: { title: "Workout", format: "number", suffix: "giorni", category: "life" },
  travel_days: { title: "Giorni di viaggio", format: "number", suffix: "giorni", category: "life" },
  clients_acquired: { title: "Clienti acquisiti", format: "number", category: "work" },
};

export const CONTACT_KIND = {
  client: "Cliente",
  collaborator: "Collaboratore",
  supplier: "Fornitore",
  other: "Altro",
} as const;

export const INVESTMENT_KIND = {
  etf: "ETF",
  stocks: "Azioni",
  bonds: "Obbligazioni",
  crypto: "Crypto",
  real_estate: "Immobili",
  cash: "Liquidità",
  other: "Altro",
} as const;

export const MOVEMENT_KIND = { deposit: "Versamento", withdrawal: "Prelievo" } as const;

export const RENT_FREQUENCY = { monthly: "al mese", quarterly: "al trimestre", yearly: "all'anno" } as const;
export const RENT_FREQUENCY_MONTHS = { monthly: 1, quarterly: 3, yearly: 12 } as const;

export const VEHICLE_KIND = { car: "Auto", motorbike: "Moto", other: "Altro" } as const;

export const DEADLINE_KIND = {
  imu: "IMU",
  rent: "Affitto",
  insurance: "Assicurazione",
  bollo: "Bollo",
  service: "Tagliando",
  inspection: "Revisione",
  other: "Altro",
} as const;

export const RECURRENCE = { none: "Una tantum", monthly: "Ogni mese", quarterly: "Ogni trimestre", yearly: "Ogni anno" } as const;
export const RECURRENCE_MONTHS = { none: 0, monthly: 1, quarterly: 3, yearly: 12 } as const;

export const TRIP_STATUS = { idea: "Idea", planned: "Pianificato", booked: "Prenotato", done: "Fatto" } as const;
export const TRIP_ITEM_KIND = {
  transport: "Trasporto",
  stay: "Alloggio",
  activity: "Attività",
  todo: "Da fare",
  other: "Altro",
} as const;

export const PAGE_SECTION = GOAL_CATEGORY;

export type GoalCategory = keyof typeof GOAL_CATEGORY;
export type GoalSource = keyof typeof GOAL_SOURCE;
export type ContactKind = keyof typeof CONTACT_KIND;
export type InvestmentKind = keyof typeof INVESTMENT_KIND;
export type DeadlineKind = keyof typeof DEADLINE_KIND;
export type Recurrence = keyof typeof RECURRENCE;
export type TripStatus = keyof typeof TRIP_STATUS;
export type PageSection = keyof typeof PAGE_SECTION;
