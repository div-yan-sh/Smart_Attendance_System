import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGetStudentAttendanceSummary } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, CheckCircle2, BookOpen, TrendingUp } from "lucide-react";

export default function StudentDashboard() {
  const { user } = useAuth();
  const { data: summaries, isLoading } = useGetStudentAttendanceSummary(user?.id || 0, {
    query: { enabled: !!user?.id }
  });

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-32 bg-slate-200 rounded-2xl" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-48 bg-slate-200 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  const totalClasses  = summaries?.reduce((a, c) => a + c.totalClasses, 0) || 0;
  const totalPresent  = summaries?.reduce((a, c) => a + c.present, 0) || 0;
  const totalLate     = summaries?.reduce((a, c) => a + c.late, 0) || 0;
  const totalAbsent   = summaries?.reduce((a, c) => a + c.absent, 0) || 0;
  const overallPct    = totalClasses > 0 ? ((totalPresent + totalLate) / totalClasses) * 100 : 0;
  const isLow         = overallPct < 75 && totalClasses > 0;

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="rounded-2xl overflow-hidden"
        style={{
          background: isLow
            ? "linear-gradient(135deg, hsl(0 72% 38%) 0%, hsl(0 72% 26%) 100%)"
            : "linear-gradient(135deg, hsl(217 91% 38%) 0%, hsl(250 60% 32%) 100%)",
          boxShadow: isLow
            ? "0 8px 32px -4px rgba(185,28,28,0.35)"
            : "0 8px 32px -4px rgba(37,99,235,0.35)"
        }}>
        <div className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">
                Welcome back, {user?.name?.split(" ")[0]}!
              </h1>
              <p className="text-white/60 text-sm mt-1">
                {user?.department} · Semester {user?.semester}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-4xl font-black text-white">{overallPct.toFixed(1)}%</div>
                <div className="text-white/60 text-xs mt-0.5">Overall Attendance</div>
              </div>
              <div className="w-16 h-16 relative">
                <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                  <circle cx="32" cy="32" r="26" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="6" />
                  <circle cx="32" cy="32" r="26" fill="none" stroke="white" strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={`${(overallPct / 100) * 163.4} 163.4`} />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  {isLow ? <AlertTriangle className="w-5 h-5 text-white" /> : <CheckCircle2 className="w-5 h-5 text-white" />}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-5 pt-5" style={{ borderTop: "1px solid rgba(255,255,255,0.12)" }}>
            {[
              { label: "Present", value: totalPresent, color: "text-green-300" },
              { label: "Late",    value: totalLate,    color: "text-amber-300" },
              { label: "Absent",  value: totalAbsent,  color: "text-red-300" },
            ].map(({ label, value, color }) => (
              <div key={label} className="text-center">
                <div className={`text-2xl font-bold ${color}`}>{value}</div>
                <div className="text-white/50 text-xs mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        </div>

        {isLow && (
          <div className="px-6 py-3 flex items-center gap-2 text-sm"
            style={{ background: "rgba(0,0,0,0.2)" }}>
            <AlertTriangle className="w-4 h-4 text-amber-300 flex-shrink-0" />
            <span className="text-amber-200 font-medium">
              Your attendance is below the 75% requirement. Please contact your faculty advisor.
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <BookOpen className="w-5 h-5 text-slate-500" />
        <h2 className="text-lg font-semibold text-slate-800">Subject-wise Attendance</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {summaries?.map((summary) => {
          const pct = summary.percentage;
          const isSubjectLow = pct < 75;
          return (
            <div key={summary.subjectId}
              className="stat-card bg-white rounded-2xl border-0 shadow-md overflow-hidden">
              <div className="h-1.5 w-full"
                style={{ background: isSubjectLow
                  ? "linear-gradient(90deg, #ef4444, #f87171)"
                  : "linear-gradient(90deg, hsl(217 91% 38%), hsl(250 60% 52%))"
                }} />
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="font-semibold text-slate-800 text-sm leading-tight">{summary.subjectName}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{summary.subjectCode}</div>
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                    isSubjectLow
                      ? "bg-red-100 text-red-600"
                      : "bg-blue-100 text-blue-700"
                  }`}>
                    {pct.toFixed(1)}%
                  </span>
                </div>

                <div className="relative h-2 bg-slate-100 rounded-full overflow-hidden mb-3">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full transition-all duration-700"
                    style={{
                      width: `${Math.min(pct, 100)}%`,
                      background: isSubjectLow
                        ? "linear-gradient(90deg, #ef4444, #f87171)"
                        : "linear-gradient(90deg, hsl(217 91% 38%), hsl(250 60% 52%))"
                    }}
                  />
                  <div className="absolute top-0 bottom-0 border-l-2 border-dashed border-amber-400/60"
                    style={{ left: "75%" }} />
                </div>

                <div className="grid grid-cols-3 text-center pt-3"
                  style={{ borderTop: "1px solid rgba(0,0,0,0.05)" }}>
                  {[
                    { label: "Present", value: summary.present,  color: "text-emerald-600" },
                    { label: "Late",    value: summary.late,     color: "text-amber-500" },
                    { label: "Absent",  value: summary.absent,   color: "text-red-500" },
                  ].map(({ label, value, color }) => (
                    <div key={label}>
                      <div className={`text-lg font-bold ${color}`}>{value}</div>
                      <div className="text-[10px] text-slate-400 uppercase tracking-wide">{label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
        {(!summaries || summaries.length === 0) && (
          <div className="col-span-full">
            <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-2xl shadow-sm border-2 border-dashed border-slate-200">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
                <TrendingUp className="w-8 h-8 text-slate-400" />
              </div>
              <div className="font-semibold text-slate-600">No attendance data yet</div>
              <div className="text-sm text-slate-400 mt-1">Records will appear once your faculty marks attendance.</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
