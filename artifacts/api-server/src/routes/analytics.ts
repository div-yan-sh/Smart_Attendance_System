import { Router, type IRouter } from "express";
import { db, usersTable, subjectsTable, attendanceTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";
import {
  GetAttendanceTrendsQueryParams,
  GetLowAttendanceStudentsQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/analytics/dashboard", requireAuth, async (_req, res): Promise<void> => {
  const [{ totalStudents }] = await db
    .select({ totalStudents: sql<number>`count(*)::int` })
    .from(usersTable)
    .where(eq(usersTable.role, "student"));

  const [{ totalFaculty }] = await db
    .select({ totalFaculty: sql<number>`count(*)::int` })
    .from(usersTable)
    .where(eq(usersTable.role, "faculty"));

  const [{ totalSubjects }] = await db
    .select({ totalSubjects: sql<number>`count(*)::int` })
    .from(subjectsTable);

  const [{ totalRecords, presentCount }] = await db
    .select({
      totalRecords: sql<number>`count(*)::int`,
      presentCount: sql<number>`sum(case when ${attendanceTable.status} in ('Present', 'Late') then 1 else 0 end)::int`,
    })
    .from(attendanceTable);

  const today = new Date().toISOString().split("T")[0];
  const [{ todayPresent, todayAbsent }] = await db
    .select({
      todayPresent: sql<number>`sum(case when ${attendanceTable.status} = 'Present' then 1 else 0 end)::int`,
      todayAbsent: sql<number>`sum(case when ${attendanceTable.status} = 'Absent' then 1 else 0 end)::int`,
    })
    .from(attendanceTable)
    .where(eq(attendanceTable.date, today));

  const overallAttendancePercentage = totalRecords > 0
    ? Math.round((presentCount / totalRecords) * 100 * 10) / 10
    : 0;

  res.json({
    totalStudents,
    totalFaculty,
    totalSubjects,
    overallAttendancePercentage,
    todayPresent: todayPresent ?? 0,
    todayAbsent: todayAbsent ?? 0,
    totalAttendanceRecords: totalRecords,
  });
});

router.get("/analytics/attendance-trends", requireAuth, async (req, res): Promise<void> => {
  const params = GetAttendanceTrendsQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const dateFrom = params.data.dateFrom ?? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const dateTo = params.data.dateTo ?? new Date().toISOString().split("T")[0];

  const rows = await db
    .select({
      date: attendanceTable.date,
      present: sql<number>`sum(case when ${attendanceTable.status} = 'Present' then 1 else 0 end)::int`,
      absent: sql<number>`sum(case when ${attendanceTable.status} = 'Absent' then 1 else 0 end)::int`,
      late: sql<number>`sum(case when ${attendanceTable.status} = 'Late' then 1 else 0 end)::int`,
      total: sql<number>`count(*)::int`,
    })
    .from(attendanceTable)
    .where(
      sql`${attendanceTable.date} >= ${dateFrom} and ${attendanceTable.date} <= ${dateTo}${params.data.subjectId ? sql` and ${attendanceTable.subjectId} = ${params.data.subjectId}` : sql``}`
    )
    .groupBy(attendanceTable.date)
    .orderBy(attendanceTable.date);

  res.json(rows);
});

router.get("/analytics/low-attendance", requireAuth, async (req, res): Promise<void> => {
  const params = GetLowAttendanceStudentsQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const threshold = params.data.threshold ?? 75;

  const rows = await db
    .select({
      studentId: attendanceTable.studentId,
      studentName: usersTable.name,
      department: usersTable.department,
      semester: usersTable.semester,
      subjectId: attendanceTable.subjectId,
      subjectName: subjectsTable.subjectName,
      totalClasses: sql<number>`count(*)::int`,
      present: sql<number>`sum(case when ${attendanceTable.status} in ('Present', 'Late') then 1 else 0 end)::int`,
    })
    .from(attendanceTable)
    .leftJoin(usersTable, eq(attendanceTable.studentId, usersTable.id))
    .leftJoin(subjectsTable, eq(attendanceTable.subjectId, subjectsTable.id))
    .groupBy(
      attendanceTable.studentId,
      usersTable.name,
      usersTable.department,
      usersTable.semester,
      attendanceTable.subjectId,
      subjectsTable.subjectName
    );

  const alerts = rows
    .map(r => ({
      studentId: r.studentId,
      studentName: r.studentName ?? "",
      department: r.department ?? "",
      semester: r.semester ?? "",
      subjectId: r.subjectId,
      subjectName: r.subjectName ?? "",
      totalClasses: r.totalClasses,
      present: r.present,
      percentage: r.totalClasses > 0
        ? Math.round((r.present / r.totalClasses) * 100 * 10) / 10
        : 0,
    }))
    .filter(r => r.percentage < threshold);

  if (params.data.subjectId) {
    res.json(alerts.filter(r => r.subjectId === params.data.subjectId));
    return;
  }

  res.json(alerts);
});

router.get("/analytics/subject-stats", requireAuth, async (_req, res): Promise<void> => {
  const rows = await db
    .select({
      subjectId: attendanceTable.subjectId,
      subjectName: subjectsTable.subjectName,
      subjectCode: subjectsTable.subjectCode,
      department: subjectsTable.department,
      semester: subjectsTable.semester,
      totalClasses: sql<number>`count(distinct ${attendanceTable.date})::int`,
      presentCount: sql<number>`sum(case when ${attendanceTable.status} in ('Present', 'Late') then 1 else 0 end)::int`,
      totalCount: sql<number>`count(*)::int`,
    })
    .from(attendanceTable)
    .leftJoin(subjectsTable, eq(attendanceTable.subjectId, subjectsTable.id))
    .groupBy(
      attendanceTable.subjectId,
      subjectsTable.subjectName,
      subjectsTable.subjectCode,
      subjectsTable.department,
      subjectsTable.semester
    );

  res.json(rows.map(r => ({
    subjectId: r.subjectId,
    subjectName: r.subjectName ?? "",
    subjectCode: r.subjectCode ?? "",
    department: r.department ?? "",
    semester: r.semester ?? "",
    totalClasses: r.totalClasses,
    averageAttendance: r.totalCount > 0
      ? Math.round((r.presentCount / r.totalCount) * 100 * 10) / 10
      : 0,
  })));
});

export default router;
