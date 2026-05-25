"use client";

import { 
  BarChart3, 
  Dog,
  Eye,
  FileText,
  ImageIcon,
  MessageSquare,
  Search,
  Settings, 
  Sparkles, 
  TrendingUp
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { AdminBadge } from "@/components/admin/ui/badge";
import { cn } from "@/lib/cn";
import { buildWhatsAppLink } from "@/lib/whatsapp";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/admin/dashboard", icon: BarChart3 },
  { label: "Blog", href: "/admin/blog", icon: FileText },
  { label: "Filhotes", href: "/admin/puppies", icon: Dog },
  { label: "Mídia", href: "/admin/media", icon: ImageIcon },
  { label: "Comentários", href: "/admin/blog/comments", icon: MessageSquare },
  { label: "Analytics", href: "/admin/analytics", icon: TrendingUp },
  { label: "SEO", href: "/admin/seo", icon: Search },
  { label: "Tracking & Pixels", href: "/admin/tracking", icon: Eye },
  { label: "Experimentos", href: "/admin/experiments", icon: Sparkles },
  { label: "Configurações", href: "/admin/settings", icon: Settings },
];

export default function AdminSidebar() {
  const pathname = usePathname() || "/admin";

  const whatsapp = buildWhatsAppLink({
    message: "Olá! Preciso de suporte no painel administrativo.",
    utmSource: "admin",
    utmMedium: "sidebar",
    utmCampaign: "sidebar_support",
  });

  return (
    <aside className="hidden w-72 flex-shrink-0 border-r border-emerald-100 bg-white/95 shadow-sm lg:flex lg:flex-col">
      <div className="flex flex-col gap-3 border-b border-emerald-100 p-6">
        <span className="text-sm font-semibold text-emerald-700">By Império Dog • Admin</span>
        <AdminBadge>Gamificação ativa</AdminBadge>
        <p className="text-xs text-slate-500">
          Complete cadastros e mantenha a streak para desbloquear badges de atendimento.
        </p>
      </div>

      <nav className="flex-1 space-y-1 p-3" aria-label="Navegação administrativa">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex min-h-[44px] items-center gap-3 rounded-2xl px-4 text-sm font-semibold transition",
                active
                  ? "bg-emerald-50 text-emerald-700"
                  : "text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2",
              )}
              aria-current={active ? "page" : undefined}
            >
              <Icon className="h-4 w-4" aria-hidden />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-emerald-100 p-4 text-xs text-slate-500">
        <p className="mb-2 text-emerald-600">Precisa de suporte imediato?</p>
        <Link
          href={whatsapp}
          className="inline-flex min-h-[44px] w-full items-center justify-center rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
        >
          Falar com suporte
        </Link>
      </div>
    </aside>
  );
}
