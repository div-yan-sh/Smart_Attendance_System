import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useListSubjects, useListStudents, useMarkAttendance, AttendanceEntryStatus } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { Check, X, Clock, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

export default function MarkAttendance() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [location] = useLocation();
  const queryParams = new URLSearchParams(location.split('?')[1] || "");
  const defaultSubjectId = queryParams.get("subjectId");
  
  const [subjectId, setSubjectId] = useState<string>(defaultSubjectId || "");
  const [date, setDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  
  const [entries, setEntries] = useState<Record<number, AttendanceEntryStatus>>({});

  const { data: subjects } = useListSubjects({ facultyId: user?.id }, { query: { enabled: !!user?.id } });
  
  const selectedSubject = subjects?.find(s => s.id.toString() === subjectId);
  
  const { data: students, isLoading: studentsLoading } = useListStudents(
    { department: selectedSubject?.department, semester: selectedSubject?.semester },
    { query: { enabled: !!selectedSubject } }
  );

  const markAttendance = useMarkAttendance();

  const handleMarkAll = (status: AttendanceEntryStatus) => {
    if (!students) return;
    const newEntries: Record<number, AttendanceEntryStatus> = {};
    students.forEach(student => {
      newEntries[student.id] = status;
    });
    setEntries(newEntries);
  };

  const handleStatusChange = (studentId: number, status: AttendanceEntryStatus) => {
    setEntries(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const handleSave = async () => {
    if (!subjectId || !date || Object.keys(entries).length === 0) {
      toast({
        title: "Missing Information",
        description: "Please select a subject and mark attendance for at least one student.",
        variant: "destructive"
      });
      return;
    }

    try {
      const entriesList = Object.entries(entries).map(([studentId, status]) => ({
        studentId: parseInt(studentId),
        status
      }));

      await markAttendance.mutateAsync({
        data: {
          subjectId: parseInt(subjectId),
          date,
          facultyId: user?.id,
          entries: entriesList
        }
      });

      toast({
        title: "Success",
        description: "Attendance records saved successfully.",
      });
      
    } catch (e) {
      toast({
        title: "Error",
        description: "Failed to save attendance records.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Mark Attendance</h1>
        <p className="text-muted-foreground mt-1">Record daily attendance for your classes</p>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle>Session Details</CardTitle>
          <CardDescription>Select the class and date to mark attendance.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Subject</label>
              <Select value={subjectId} onValueChange={setSubjectId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects?.map(subject => (
                    <SelectItem key={subject.id} value={subject.id.toString()}>
                      {subject.subjectName} ({subject.subjectCode})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Date</label>
              <input 
                type="date" 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {subjectId && students && (
        <Card>
          <CardHeader className="pb-4 flex flex-row items-center justify-between border-b">
            <div>
              <CardTitle>Student Roster</CardTitle>
              <CardDescription>
                {students.length} students enrolled in {selectedSubject?.department} Semester {selectedSubject?.semester}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => handleMarkAll(AttendanceEntryStatus.Present)}>
                <Check className="mr-2 h-4 w-4 text-green-600" /> Mark All Present
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleMarkAll(AttendanceEntryStatus.Absent)}>
                <X className="mr-2 h-4 w-4 text-destructive" /> Mark All Absent
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="divide-y">
              {students.map(student => (
                <div key={student.id} className="py-4 flex items-center justify-between">
                  <div>
                    <div className="font-medium">{student.name}</div>
                    <div className="text-sm text-muted-foreground">{student.email}</div>
                  </div>
                  <div className="flex bg-muted/50 p-1 rounded-md">
                    <button 
                      onClick={() => handleStatusChange(student.id, AttendanceEntryStatus.Present)}
                      className={`px-4 py-2 text-sm font-medium rounded-sm flex items-center gap-1 transition-colors ${
                        entries[student.id] === AttendanceEntryStatus.Present 
                          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" 
                          : "hover:bg-muted"
                      }`}
                    >
                      <Check className="h-4 w-4" /> Present
                    </button>
                    <button 
                      onClick={() => handleStatusChange(student.id, AttendanceEntryStatus.Absent)}
                      className={`px-4 py-2 text-sm font-medium rounded-sm flex items-center gap-1 transition-colors ${
                        entries[student.id] === AttendanceEntryStatus.Absent 
                          ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" 
                          : "hover:bg-muted"
                      }`}
                    >
                      <X className="h-4 w-4" /> Absent
                    </button>
                    <button 
                      onClick={() => handleStatusChange(student.id, AttendanceEntryStatus.Late)}
                      className={`px-4 py-2 text-sm font-medium rounded-sm flex items-center gap-1 transition-colors ${
                        entries[student.id] === AttendanceEntryStatus.Late 
                          ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400" 
                          : "hover:bg-muted"
                      }`}
                    >
                      <Clock className="h-4 w-4" /> Late
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 pt-6 border-t flex justify-end">
              <Button onClick={handleSave} disabled={markAttendance.isPending} size="lg" className="w-full sm:w-auto">
                <Save className="mr-2 h-4 w-4" /> 
                {markAttendance.isPending ? "Saving..." : "Save Attendance"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {subjectId && students?.length === 0 && (
        <div className="text-center py-12 text-muted-foreground border rounded-lg bg-card">
          No students found for this subject's department and semester.
        </div>
      )}
    </div>
  );
}
