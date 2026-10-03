import {
  BarChart3, BookOpen, Boxes, Briefcase, Building2, CalendarDays, CircleDot, ClipboardCheck,
  Clock, FileText, FolderKanban, Handshake, ImageIcon, Inbox, Landmark, LayoutDashboard,
  LifeBuoy, LockKeyhole, Map, Megaphone, Network, Package, Palmtree, Receipt, RotateCcw, ScrollText,
  Settings, ShieldCheck, ShoppingBag, Sun, Tags, Target, Truck, UserRound, Users, Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const RULES: Array<[RegExp, LucideIcon]> = [
  [/brand|logo/i, ImageIcon],
  [/overview|home|dashboard|studio|scorecard/i, LayoutDashboard],
  [/pipeline/i, Handshake],
  [/today|my day/i, Sun],
  [/fulfil/i, Package],
  [/receive/i, Inbox],
  [/dispatch/i, Truck],
  [/return/i, RotateCcw],
  [/forecast|report|analytic/i, BarChart3],
  [/customer|account|people|user|audience|team/i, Users],
  [/quote|invoice|doc/i, FileText],
  [/agreement|contract/i, ScrollText],
  [/order/i, ShoppingBag],
  [/product|catalogue|catalog/i, Package],
  [/pric/i, Tags],
  [/stock|inventor|warehouse/i, Boxes],
  [/calendar|rota|schedule|plan/i, CalendarDays],
  [/inbox/i, Inbox],
  [/time.?off|absence|leave|holiday/i, Palmtree],
  [/timesheet|hour/i, Clock],
  [/payroll|payslip|finance|ledger|journal/i, Wallet],
  [/expense|receipt/i, Receipt],
  [/appraisal|review/i, ClipboardCheck],
  [/setting|workspace/i, Settings],
  [/security/i, LockKeyhole],
  [/audit/i, ScrollText],
  [/campaign|market/i, Megaphone],
  [/budget/i, Target],
  [/map|network/i, Map],
  [/group/i, Network],
  [/bank/i, Landmark],
  [/supplier|logistic/i, Truck],
  [/case|ticket|service/i, LifeBuoy],
  [/project|portfolio|work/i, FolderKanban],
  [/role|permission/i, ShieldCheck],
  [/profile/i, UserRound],
  [/company|admin/i, Building2],
  [/book/i, BookOpen],
  [/task|note/i, Briefcase],
];

export function iconForNav(label: string): LucideIcon {
  return RULES.find(([pattern]) => pattern.test(label))?.[1] ?? CircleDot;
}
