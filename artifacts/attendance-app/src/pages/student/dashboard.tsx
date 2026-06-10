import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGetStudentAttendanceSummary } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function StudentDashboard() {
  const { user } = useAuth();
  const { data: summaries, isLoading } = useGetStudentAttendanceSummary(user?.id || 0, {
    query: { enabled: !!user?.id }
  });

  if (isLoading) return <div className="p-8 text-center">Loading dashboard...</div>;

  const totalClasses = summaries?.reduce((acc, curr) => acc + curr.totalClasses, 0) || 0;
  const totalPresent = summaries?.reduce((acc, curr) => acc + curr.present, 0) || 0;
  const overallPercentage = totalClasses > 0 ? (totalPresent / totalClasses) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome, {user?.name}</h1>
          <p className="text-muted-foreground">{user?.department} • Semester {user?.semester}</p>
        </div>
        
        <Card className="w-full md:w-64">
          <CardContent className="p-4">
            <div className="text-sm font-medium text-muted-foreground mb-1">Overall Attendance</div>
            <div className="flex items-end gap-2">
              <div className="text-3xl font-bold">{overallPercentage.toFixed(1)}%</div>
            </div>
            <Progress value={overallPercentage} className="mt-2 h-2" />
          </CardContent>
        </Card>
      </div>

      {overallPercentage < 75 && totalClasses > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Low Attendance Warning</AlertTitle>
          <AlertDescription>
            Your overall attendance is below the 75% requirement. Please contact your faculty advisor.
          </AlertDescription>
        </Alert>
      )}

      <h2 className="text-xl font-semibold tracking-tight mt-8">Subject-wise Attendance</h2>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {summaries?.map((summary) => (
          <Card key={summary.subjectId} className="flex flex-col">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{summary.subjectName}</CardTitle>
              <div className="text-sm text-muted-foreground">{summary.subjectCode}</div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-end">
              <div className="flex justify-between items-end mb-2">
                <div className="text-2xl font-bold">{summary.percentage.toFixed(1)}%</div>
                <div className="text-sm text-muted-foreground">
                  {summary.present} / {summary.totalClasses} classes
                </div>
              </div>
              
              <Progress 
                value={summary.percentage} 
                className={`h-2 mb-4 ${summary.percentage < 75 ? 'bg-destructive/20' : ''}`}
                // In a real app we'd use a prop to change the indicator color based on value, 
                // but for now we'll just rely on the default primary color
              />
              
              <div className="grid grid-cols-3 text-sm text-center border-t pt-2">
                <div>
                  <div className="font-medium text-green-600">{summary.present}</div>
                  <div className="text-muted-foreground text-xs">Present</div>
                </div>
                <div>
                  <div className="font-medium text-destructive">{summary.absent}</div>
                  <div className="text-muted-foreground text-xs">Absent</div>
                </div>
                <div>
                  <div className="font-medium text-amber-500">{summary.late}</div>
                  <div className="text-muted-foreground text-xs">Late</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {(!summaries || summaries.length === 0) && (
          <div className="col-span-full py-8 text-center text-muted-foreground border rounded-lg bg-card/50">
            No attendance data available yet.
          </div>
        )}
      </div>
    </div>
  );
}
