import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { 
  Building2, 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  GraduationCap, 
  LogOut,
  CalendarCheck,
  History,
  BarChart3,
  Menu
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
  { title: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { title: "Students", href: "/admin/students", icon: Users },
  { title: "Faculty", href: "/admin/faculty", icon: GraduationCap },
  { title: "Subjects", href: "/admin/subjects", icon: BookOpen },
];

const facultyNav = [
  { title: "Dashboard", href: "/faculty/dashboard", icon: LayoutDashboard },
  { title: "Mark Attendance", href: "/faculty/mark-attendance", icon: CalendarCheck },
  { title: "Records", href: "/faculty/attendance-records", icon: History },
  { title: "Analytics", href: "/faculty/analytics", icon: BarChart3 },
];

const studentNav = [
  { title: "Dashboard", href: "/student/dashboard", icon: LayoutDashboard },
  { title: "History", href: "/student/attendance-history", icon: History },
];

export function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();

  const handleLogout = () => {
    logout();
    setLocation("/login");
  };

  let navItems = [];
  if (user?.role === "admin") navItems = adminNav;
  if (user?.role === "faculty") navItems = facultyNav;
  if (user?.role === "student") navItems = studentNav;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <Sidebar>
          <SidebarHeader className="border-b p-4">
            <div className="flex items-center gap-2 font-semibold text-primary">
              <Building2 className="h-6 w-6" />
              <span>Smart Attendance</span>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu className="p-2">
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={location === item.href}
                    tooltip={item.title}
                  >
                    <Link href={item.href} className="flex items-center gap-2">
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter className="border-t p-4">
            <div className="mb-4 text-sm text-muted-foreground truncate">
              <div>{user?.name}</div>
              <div className="text-xs">{user?.email}</div>
            </div>
            <Button variant="outline" className="w-full justify-start gap-2" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </SidebarFooter>
        </Sidebar>

        <div className="flex-1 flex flex-col min-w-0">
          <header className="flex h-14 items-center gap-4 border-b bg-card px-4 lg:px-6">
            <SidebarTrigger />
            <div className="flex-1" />
            <div className="text-sm font-medium">
              Role: <span className="capitalize text-primary">{user?.role}</span>
            </div>
          </header>
          <main className="flex-1 overflow-auto p-4 lg:p-6 bg-muted/20">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
