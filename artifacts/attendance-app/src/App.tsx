import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth";
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { DashboardLayout } from "@/components/layout/dashboard-layout";

import AdminDashboard from "@/pages/admin/dashboard";
import AdminStudents from "@/pages/admin/students";
import AdminFaculty from "@/pages/admin/faculty";
import AdminSubjects from "@/pages/admin/subjects";

import FacultyDashboard from "@/pages/faculty/dashboard";
import MarkAttendance from "@/pages/faculty/mark-attendance";
import AttendanceRecords from "@/pages/faculty/attendance-records";
import FacultyAnalytics from "@/pages/faculty/analytics";

import StudentDashboard from "@/pages/student/dashboard";
import StudentHistory from "@/pages/student/attendance-history";
import { useEffect } from "react";

const queryClient = new QueryClient();

function RootRedirect() {
  const { isAuthenticated, user } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/login");
    } else if (user) {
      setLocation(`/${user.role}/dashboard`);
    }
  }, [isAuthenticated, user, setLocation]);

  return null;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={RootRedirect} />
      <Route path="/login" component={Login} />
      
      <Route path="/admin/:path*">
        <ProtectedRoute allowedRoles={["admin"]}>
          <DashboardLayout>
            <Switch>
              <Route path="/admin/dashboard" component={AdminDashboard} />
              <Route path="/admin/students" component={AdminStudents} />
              <Route path="/admin/faculty" component={AdminFaculty} />
              <Route path="/admin/subjects" component={AdminSubjects} />
            </Switch>
          </DashboardLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/faculty/:path*">
        <ProtectedRoute allowedRoles={["faculty"]}>
          <DashboardLayout>
            <Switch>
              <Route path="/faculty/dashboard" component={FacultyDashboard} />
              <Route path="/faculty/mark-attendance" component={MarkAttendance} />
              <Route path="/faculty/attendance-records" component={AttendanceRecords} />
              <Route path="/faculty/analytics" component={FacultyAnalytics} />
            </Switch>
          </DashboardLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/student/:path*">
        <ProtectedRoute allowedRoles={["student"]}>
          <DashboardLayout>
            <Switch>
              <Route path="/student/dashboard" component={StudentDashboard} />
              <Route path="/student/attendance-history" component={StudentHistory} />
            </Switch>
          </DashboardLayout>
        </ProtectedRoute>
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
