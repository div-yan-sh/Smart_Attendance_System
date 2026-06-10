import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useListSubjects, useGetDashboardStats } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { BookOpen, Users, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function FacultyDashboard() {
  const { user } = useAuth();
  const { data: stats } = useGetDashboardStats();
  const { data: subjects, isLoading } = useListSubjects({ facultyId: user?.id }, {
    query: { enabled: !!user?.id }
  });

  if (isLoading) return <div className="p-8 text-center">Loading dashboard...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Faculty Dashboard</h1>
        <p className="text-muted-foreground mt-1">Welcome back, Prof. {user?.name}</p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Subjects</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{subjects?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Institution Overall %</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.overallAttendancePercentage?.toFixed(1) || 0}%</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between mt-8 mb-4">
        <h2 className="text-xl font-semibold tracking-tight">My Assigned Classes</h2>
        <Button asChild variant="outline" size="sm">
          <Link href="/faculty/mark-attendance">Mark Attendance <ArrowRight className="ml-2 h-4 w-4" /></Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {subjects?.map((subject) => (
          <Card key={subject.id}>
            <CardHeader>
              <CardTitle className="text-lg">{subject.subjectName}</CardTitle>
              <div className="text-sm font-medium text-primary bg-primary/10 w-fit px-2 py-1 rounded">
                {subject.subjectCode}
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground mb-4">
                {subject.department} • Semester {subject.semester}
              </div>
              <div className="flex gap-2 mt-4">
                <Button asChild variant="secondary" className="w-full text-xs">
                  <Link href={`/faculty/mark-attendance?subjectId=${subject.id}`}>Mark Today</Link>
                </Button>
                <Button asChild variant="outline" className="w-full text-xs">
                  <Link href={`/faculty/attendance-records?subjectId=${subject.id}`}>View Records</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {(!subjects || subjects.length === 0) && (
          <div className="col-span-full py-12 text-center border border-dashed rounded-lg">
            <p className="text-muted-foreground mb-4">You have no assigned subjects yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
