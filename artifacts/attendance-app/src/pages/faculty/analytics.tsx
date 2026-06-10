import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useListSubjects, useGetAttendanceTrends, useGetLowAttendanceStudents } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function FacultyAnalytics() {
  const { user } = useAuth();
  const { data: subjects } = useListSubjects({ facultyId: user?.id }, { query: { enabled: !!user?.id } });
  
  const [subjectId, setSubjectId] = useState<string>("all");
  const parsedSubjectId = subjectId !== "all" ? parseInt(subjectId) : undefined;

  const { data: trends, isLoading: trendsLoading } = useGetAttendanceTrends({ 
    period: "weekly", 
    subjectId: parsedSubjectId 
  });
  
  const { data: alerts, isLoading: alertsLoading } = useGetLowAttendanceStudents({ 
    threshold: 75, 
    subjectId: parsedSubjectId 
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground mt-1">Deep dive into class attendance patterns</p>
        </div>

        <div className="w-full sm:w-64">
          <Select value={subjectId} onValueChange={setSubjectId}>
            <SelectTrigger>
              <SelectValue placeholder="All Subjects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All My Subjects</SelectItem>
              {subjects?.map(subject => (
                <SelectItem key={subject.id} value={subject.id.toString()}>
                  {subject.subjectName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="col-span-4">
        <CardHeader>
          <CardTitle>Attendance Trends</CardTitle>
        </CardHeader>
        <CardContent className="pl-2">
          {trendsLoading ? (
            <div className="h-[350px] flex items-center justify-center text-muted-foreground">Loading chart data...</div>
          ) : trends && trends.length > 0 ? (
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trends}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Area type="monotone" dataKey="present" stackId="1" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} />
                  <Area type="monotone" dataKey="absent" stackId="2" stroke="hsl(var(--destructive))" fill="hsl(var(--destructive))" fillOpacity={0.2} />
                  <Area type="monotone" dataKey="late" stackId="3" stroke="hsl(var(--chart-4))" fill="hsl(var(--chart-4))" fillOpacity={0.2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
             <div className="h-[350px] flex items-center justify-center text-muted-foreground">No trend data available for the selected subject.</div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Students Requiring Attention (Below 75%)</CardTitle>
        </CardHeader>
        <CardContent>
          {alertsLoading ? (
            <div className="py-8 text-center text-muted-foreground">Loading alerts...</div>
          ) : alerts && alerts.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {alerts.map((alert, i) => (
                <Alert key={`${alert.studentId}-${alert.subjectId}-${i}`} variant="destructive" className="bg-destructive/5">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle className="flex justify-between">
                    <span>{alert.studentName}</span>
                    <span className="font-bold">{alert.percentage.toFixed(1)}%</span>
                  </AlertTitle>
                  <AlertDescription>
                    <div className="text-sm mt-1 mb-2 font-medium">{alert.subjectName}</div>
                    <div className="flex gap-4 text-sm text-muted-foreground">
                      <span>Attended: {alert.present}</span>
                      <span>Total Classes: {alert.totalClasses}</span>
                    </div>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground border border-dashed rounded-lg bg-card/50">
              No students are currently below the 75% attendance threshold. Great job!
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
