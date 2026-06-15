import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  GraduationCap,
  LogOut,
  CalendarCheck,
  History,
  BarChart3,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

const adminNav = [
  { title: "Dashboard",  href: "/admin/dashboard",  icon: LayoutDashboard },
  { title: "Students",   href: "/admin/students",   icon: Users },
  { title: "Faculty",    href: "/admin/faculty",    icon: GraduationCap },
  { title: "Subjects",   href: "/admin/subjects",   icon: BookOpen },
];

const facultyNav = [
  { title: "Dashboard",       href: "/faculty/dashboard",          icon: LayoutDashboard },
  { title: "Mark Attendance", href: "/faculty/mark-attendance",    icon: CalendarCheck },
  { title: "Records",         href: "/faculty/attendance-records", icon: History },
  { title: "Analytics",       href: "/faculty/analytics",          icon: BarChart3 },
];

const studentNav = [
  { title: "Dashboard", href: "/student/dashboard",         icon: LayoutDashboard },
  { title: "History",   href: "/student/attendance-history", icon: History },
];

const roleConfig: Record<string, { label: string; color: string; bg: string }> = {
  admin:   { label: "Administrator", color: "text-amber-300",  bg: "bg-amber-400/15" },
  faculty: { label: "Faculty",       color: "text-emerald-300", bg: "bg-emerald-400/15" },
  student: { label: "Student",       color: "text-sky-300",    bg: "bg-sky-400/15" },
};

function Initials({ name }: { name: string }) {
  const parts = name.trim().split(" ");
  const initials = parts.length >= 2
    ? parts[0][0] + parts[parts.length - 1][0]
    : parts[0].slice(0, 2);
  return <span className="text-sm font-bold text-white uppercase">{initials}</span>;
}

export function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();

  const handleLogout = () => { logout(); setLocation("/login"); };

  let navItems: typeof adminNav = [];
  if (user?.role === "admin")   navItems = adminNav;
  if (user?.role === "faculty") navItems = facultyNav;
  if (user?.role === "student") navItems = studentNav;

  const role = roleConfig[user?.role ?? "student"];

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <Sidebar>
          <SidebarHeader className="px-4 py-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "linear-gradient(135deg, hsl(217 91% 55%) 0%, hsl(217 91% 38%) 100%)", boxShadow: "0 2px 8px rgba(0,60,200,0.4)" }}>
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div>
                <div className="font-bold text-white text-sm leading-tight">Smart Attendance</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Management System</div>
              </div>
            </div>
          </SidebarHeader>

          <SidebarContent className="py-3">
            <div className="px-3 mb-1">
              <p className="text-[10px] font-semibold uppercase tracking-wider px-2 mb-1"
                style={{ color: "rgba(148,163,184,0.7)" }}>Navigation</p>
            </div>
            <SidebarMenu className="px-3 space-y-0.5">
              {navItems.map((item) => {
                const isActive = location === item.href;
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                      className="rounded-xl"
                    >
                      <Link
                        href={item.href}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 ${
                          isActive
                            ? "nav-item-active text-white font-semibold"
                            : "text-slate-400 hover:text-white hover:bg-white/5"
                        }`}
                      >
                        <item.icon className={`h-4 w-4 flex-shrink-0 ${isActive ? "text-blue-300" : ""}`} />
                        <span className="text-sm">{item.title}</span>
                        {isActive && (
                          <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_6px_rgba(96,165,250,0.8)]" />
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarContent>

          <SidebarFooter className="px-4 py-4" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
            <div className="flex items-center gap-3 mb-3 px-1">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "linear-gradient(135deg, hsl(217 91% 38%) 0%, hsl(250 60% 32%) 100%)" }}>
                {user?.name ? <Initials name={user.name} /> : <ShieldCheck className="h-4 w-4 text-white" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-white truncate">{user?.name}</div>
                <div className="text-[11px] text-slate-400 truncate">{user?.email}</div>
              </div>
            </div>
            <div className="mb-3 px-1">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${role.color} ${role.bg}`}>
                <ShieldCheck className="w-3 h-3" />
                {role.label}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-slate-400 hover:text-white hover:bg-white/8 transition-all duration-150 group"
            >
              <LogOut className="h-4 w-4 group-hover:text-red-400 transition-colors" />
              <span>Sign out</span>
            </button>
          </SidebarFooter>
        </Sidebar>

        <div className="flex-1 flex flex-col min-w-0">
          <header className="flex h-14 items-center gap-4 border-b bg-white/80 backdrop-blur-sm px-4 lg:px-6 sticky top-0 z-10"
            style={{ boxShadow: "0 1px 0 rgba(0,0,0,0.06)" }}>
            <SidebarTrigger className="text-slate-500 hover:text-slate-700" />
            <div className="h-5 w-px bg-slate-200" />
            <div className="flex-1 flex items-center gap-2">
              <span className="text-sm text-slate-500">
                {navItems.find(n => n.href === location)?.title ?? "Dashboard"}
              </span>
            </div>
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${role.color}`}
              style={{ background: "rgba(15,23,42,0.06)" }}>
              <ShieldCheck className="w-3 h-3" />
              {role.label}
            </div>
          </header>
          <main className="flex-1 overflow-auto p-5 lg:p-7"
            style={{ background: "linear-gradient(135deg, #f0f4ff 0%, #f8fafc 50%, #f0f6ff 100%)" }}>
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
