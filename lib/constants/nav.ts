import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  CheckSquare,
  Calendar,
  Wallet,
  FileArchive,
  BarChart3,
  Settings,
  Briefcase,
  BookUser,
  TrendingUp,
  Home,
  Dumbbell,
  Plane,
  Car,
  Building2,
  HeartPulse,
  Info,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export type NavGroup = {
  /** chiave della sezione (coincide con pages.section per le pagine personalizzate) */
  key: "main" | "work" | "finance" | "life";
  label?: string;
  items: NavItem[];
};

// Preventivi e Fatture non compaiono più nel menu: le pagine e i dati restano
// nel progetto (/preventivi, /fatture) ma non servono nel flusso quotidiano.
export const NAV_GROUPS: NavGroup[] = [
  {
    key: "main",
    items: [
      { href: "/dashboard", label: "Home", icon: LayoutDashboard },
      { href: "/calendario", label: "Calendario", icon: Calendar },
    ],
  },
  {
    key: "work",
    label: "Lavoro",
    items: [
      { href: "/lavoro", label: "Dashboard lavoro", icon: Briefcase },
      { href: "/clienti", label: "Clienti", icon: Users },
      { href: "/progetti", label: "Progetti", icon: FolderKanban },
      { href: "/task", label: "Task", icon: CheckSquare },
      { href: "/rubrica", label: "Rubrica", icon: BookUser },
      { href: "/documenti", label: "Documenti", icon: FileArchive },
    ],
  },
  {
    key: "finance",
    label: "Finanze",
    items: [
      { href: "/finanze", label: "Entrate e uscite", icon: Wallet },
      { href: "/finanze/investimenti", label: "Investimenti", icon: TrendingUp },
      { href: "/report", label: "Report", icon: BarChart3 },
    ],
  },
  {
    key: "life",
    label: "Vita",
    items: [
      { href: "/vita", label: "Dashboard vita", icon: HeartPulse },
      { href: "/vita/affitti", label: "Affitti", icon: Building2 },
      { href: "/vita/allenamenti", label: "Allenamenti", icon: Dumbbell },
      { href: "/vita/viaggi", label: "Viaggi", icon: Plane },
      { href: "/vita/veicoli", label: "Veicoli", icon: Car },
    ],
  },
];

export const SETTINGS_ITEM: NavItem = { href: "/impostazioni", label: "Impostazioni", icon: Settings };

// Icone usate nella Home per i collegamenti rapidi
export const HOME_ICON = Home;
export const CREDITS_ITEM: NavItem = { href: "/crediti", label: "Crediti", icon: Info };
