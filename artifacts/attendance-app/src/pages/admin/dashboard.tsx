import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGetDashboardStats, useGetAttendanceTrends, useGetSubjectStats, useGetLowAttendanceStudents } from "@workspace/api-client-react";
import { Users, BookOpen, GraduationCap, Percent, AlertTriangle, TrendingUp } from "lucide-react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  gradient: string;
  shadowColor: string;
  iconBg: string;
  trend?: string;
}

function StatCard({ title, value, icon: Icon, gradient, shadowColor, iconBg, trend }: StatCardProps) {
  return (
    <div className="stat-card rounded-2xl overflow-hidden"
      style={{ background: gradient, boxShadow: `0 4px 24px -4px ${shadowColor}` }}>
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${iconBg}`}
            style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.2), 0 2px 8px rgba(0,0,0,0.15)" }}>
            <Icon className="h-5 w-5 text-white" />
          </div>
          {trend && (
            <div className="flex items-center gap-1 text-xs font-medium text-white/80 bg-white/10 px-2 py-1 rounded-full">
              <TrendingUp className="w-3 h-3" />
              {trend}
            </div>
          )}
        </div>
        <div className="text-3xl font-bold text-white tracking-tight">{value}</div>
        <div className="text-sm text-white/70 mt-1 font-medium">{title}</div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats();
  const { data: trends, isLoading: trendsLoading } = useGetAttendanceTrends({ period: "weekly" });
  const { data: subjectStats, isLoading: subjectStatsLoading } = useGetSubjectStats();
  const { data: lowAttendanceAlerts, isLoading: alertsLoading } = useGetLowAttendanceStudents({ threshold: 75 });

  if (statsLoading || trendsLoading || subjectStatsLoading || alertsLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-slate-200 rounded-xl" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-slate-200 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Students",
      value: stats?.totalStudents || 0,
      icon: Users,
      gradient: "linear-gradient(135deg, hsl(217 91% 38%) 0%, hsl(217 91% 28%) 100%)",
      shadowColor: "rgba(37, 99, 235, 0.35)",
      iconBg: "bg-blue-400/30",
      trend: "Enrolled",
    },
    {
      title: "Total Faculty",
      value: stats?.totalFaculty || 0,
      icon: GraduationCap,
      gradient: "linear-gradient(135deg, hsl(262 80% 48%) 0%, hsl(262 80% 35%) 100%)",
      shadowColor: "rgba(124, 58, 237, 0.35)",
      iconBg: "bg-purple-400/30",
      trend: "Active",
    },
    {
      title: "Total Subjects",
      value: stats?.totalSubjects || 0,
      icon: BookOpen,
      gradient: "linear-gradient(135deg, hsl(162 72% 38%) 0%, hsl(162 72% 26%) 100%)",
      shadowColor: "rgba(5, 150, 105, 0.35)",
      iconBg: "bg-emerald-400/30",
      trend: "Running",
    },
    {
      title: "Overall Attendance",
      value: `${(stats?.overallAttendancePercentage ?? 0).toFixed(1)}%`,
      icon: Percent,
      gradient: "linear-gradient(135deg, hsl(38 95% 52%) 0%, hsl(30 90% 42%) 100%)",
      shadowColor: "rgba(217, 119, 6, 0.35)",
      iconBg: "bg-amber-300/30",
      trend: "Average",
    },
  ];

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Overview</h1>
          <p className="text-slate-500 text-sm mt-0.5">System-wide attendance analytics</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <StatCard key={card.title} {...card} />
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 border-0 shadow-md rounded-2xl overflow-hidden">
          <CardHeader className="pb-2 px-6 pt-5">
            <CardTitle className="text-base font-semibold text-slate-800">Attendance Trends</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trends || []} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="presentGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="absentGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="lateGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.06)" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ background: "#1e293b", border: "none", borderRadius: "12px", color: "#f1f5f9", fontSize: 12 }}
                    cursor={{ stroke: "rgba(99,102,241,0.2)", strokeWidth: 2 }}
                  />
                  <Area type="monotone" dataKey="present" stroke="#3b82f6" strokeWidth={2} fill="url(#presentGrad)" name="Present" />
                  <Area type="monotone" dataKey="absent"  stroke="#ef4444" strokeWidth={2} fill="url(#absentGrad)" name="Absent" />
                  <Area type="monotone" dataKey="late"    stroke="#f59e0b" strokeWidth={2} fill="url(#lateGrad)" name="Late" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3 border-0 shadow-md rounded-2xl overflow-hidden">
          <CardHeader className="pb-2 px-6 pt-5">
            <CardTitle className="text-base font-semibold text-slate-800">Subject Statistics</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={subjectStats || []} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity={1} />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.8} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.06)" />
                  <XAxis dataKey="subjectCode" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ background: "#1e293b", border: "none", borderRadius: "12px", color: "#f1f5f9", fontSize: 12 }}
                    cursor={{ fill: "rgba(99,102,241,0.08)" }}
                  />
                  <Bar dataKey="averageAttendance" fill="url(#barGrad)" radius={[8, 8, 0, 0]} name="Avg Attendance %" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-md rounded-2xl overflow-hidden">
        <CardHeader className="px-6 pt-5 pb-3 flex flex-row items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </div>
          <CardTitle className="text-base font-semibold text-slate-800">
            Low Attendance Alerts
            <span className="ml-2 text-xs font-normal text-slate-500">(Below 75%)</span>
          </CardTitle>
          {lowAttendanceAlerts && lowAttendanceAlerts.length > 0 && (
            <span className="ml-auto text-xs font-bold text-white bg-red-500 px-2 py-0.5 rounded-full">
              {lowAttendanceAlerts.length}
            </span>
          )}
        </CardHeader>
        <CardContent className="px-6 pb-5">
          {lowAttendanceAlerts && lowAttendanceAlerts.length > 0 ? (
            <div className="space-y-2">
              {lowAttendanceAlerts.slice(0, 6).map((alert, i) => (
                <div key={i}
                  className="flex items-center gap-4 p-3 rounded-xl bg-red-50 border border-red-100 hover:bg-red-100/60 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-red-200 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-red-600">
                      {alert.studentName?.charAt(0) ?? "?"}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-slate-800 truncate">{alert.studentName}</div>
                    <div className="text-xs text-slate-500 truncate">{alert.subjectName}</div>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <div className="text-sm font-bold text-red-600">{alert.percentage.toFixed(1)}%</div>
                    <div className="text-xs text-slate-400">{alert.present}/{alert.totalClasses} classes</div>
                  </div>
                  <div className="w-16 h-2 bg-red-200 rounded-full overflow-hidden flex-shrink-0">
                    <div className="h-full bg-red-500 rounded-full transition-all"
                      style={{ width: `${Math.min(alert.percentage, 100)}%` }} />
                  </div>
                </div>
              ))}
              {lowAttendanceAlerts.length > 6 && (
                <div className="text-center py-1 text-sm text-slate-400">
                  +{lowAttendanceAlerts.length - 6} more alerts
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-10 text-slate-400">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="w-6 h-6 text-green-500" />
              </div>
              <div className="font-medium text-slate-600">All good!</div>
              <div className="text-sm">No students are below the 75% threshold.</div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
