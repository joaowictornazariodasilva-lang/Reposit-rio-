import {
  AirVent,
  BellRing,
  CalendarDays,
  ChartColumn,
  ClipboardList,
  FileSpreadsheet,
  FileText,
  House,
  ListChecks,
  Package,
  Repeat,
  ScanBarcode,
  Settings,
  Target,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

const MAPA: Record<string, LucideIcon> = {
  house: House,
  "clipboard-list": ClipboardList,
  "calendar-days": CalendarDays,
  "file-text": FileText,
  "scan-barcode": ScanBarcode,
  users: Users,
  "air-vent": AirVent,
  repeat: Repeat,
  "bell-ring": BellRing,
  package: Package,
  wallet: Wallet,
  target: Target,
  "chart-column": ChartColumn,
  "list-checks": ListChecks,
  "file-spreadsheet": FileSpreadsheet,
  settings: Settings,
};

export function IconeNav({ nome, className }: { nome: string; className?: string }) {
  const I = MAPA[nome] ?? House;
  return <I className={className} aria-hidden />;
}
