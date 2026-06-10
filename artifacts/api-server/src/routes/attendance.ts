import { Router, type IRouter } from "express";
import { db, attendanceTable, usersTable, subjectsTable } from "@workspace/db";
import { eq, and, gte, lte } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";
import {
  ListAttendanceQueryParams,
  MarkAttendanceBody,
  UpdateAttendanceParams,
  UpdateAttendanceBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

function buildAttendanceRow(
  row: {
    id: number;
    studentId: number;
    subjectId: number;
    facultyId: number | null;
    date: string;
    status: "Present" | "Absent" | "Late";
    createdAt: Date;
  },
  studentName: string,
  subjectName: string
) {
  return {
    id: row.id,
    studentId: row.studentId,
    studentName,
    subjectId: row.subjectId,
    subjectName,
    facultyId: row.facultyId ?? null,
    date: row.date,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
  };
}

router.get("/attendance", requireAuth, async (req, res): Promise<void> => {
  const params = ListAttendanceQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const rows = await db
    .select({
      id: attendanceTable.id,
      studentId: attendanceTable.studentId,
      studentName: usersTable.name,
      subjectId: attendanceTable.subjectId,
      subjectName: subjectsTable.subjectName,
      facultyId: attendanceTable.facultyId,
      date: attendanceTable.date,
      status: attendanceTable.status,
      createdAt: attendanceTable.createdAt,
    })
    .from(attendanceTable)
    .leftJoin(usersTable, eq(attendanceTable.studentId, usersTable.id))
    .leftJoin(subjectsTable, eq(attendanceTable.subjectId, subjectsTable.id));

  let filtered = rows;
  if (params.data.subjectId) filtered = filtered.filter(r => r.subjectId === params.data.subjectId);
  if (params.data.studentId) filtered = filtered.filter(r => r.studentId === params.data.studentId);
  if (params.data.date) filtered = filtered.filter(r => r.date === params.data.date);
  if (params.data.dateFrom) filtered = filtered.filter(r => r.date >= params.data.dateFrom!);
  if (params.data.dateTo) filtered = filtered.filter(r => r.date <= params.data.dateTo!);

  res.json(filtered.map(r => ({
    id: r.id,
    studentId: r.studentId,
    studentName: r.studentName ?? "",
    subjectId: r.subjectId,
    subjectName: r.subjectName ?? "",
    facultyId: r.facultyId ?? null,
    date: r.date,
    status: r.status,
    createdAt: r.createdAt.toISOString(),
  })));
});

router.post("/attendance", requireAuth, async (req, res): Promise<void> => {
  const parsed = MarkAttendanceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { subjectId, date, facultyId, entries } = parsed.data;
  const results = [];

  for (const entry of entries) {
    // Upsert: delete existing then insert
    await db
      .delete(attendanceTable)
      .where(
        and(
          eq(attendanceTable.studentId, entry.studentId),
          eq(attendanceTable.subjectId, subjectId),
          eq(attendanceTable.date, date)
        )
      );

    const [record] = await db
      .insert(attendanceTable)
      .values({
        studentId: entry.studentId,
        subjectId,
        facultyId: facultyId ?? null,
        date,
        status: entry.status,
      })
      .returning();

    results.push(record);
  }

  const [subject] = await db.select().from(subjectsTable).where(eq(subjectsTable.id, subjectId));
  const studentIds = entries.map(e => e.studentId);
  const students = await db
    .select({ id: usersTable.id, name: usersTable.name })
    .from(usersTable)
    .where(eq(usersTable.role, "student"));

  const studentMap = Object.fromEntries(students.map(s => [s.id, s.name]));

  res.json(results.map(r => ({
    id: r.id,
    studentId: r.studentId,
    studentName: studentMap[r.studentId] ?? "",
    subjectId: r.subjectId,
    subjectName: subject?.subjectName ?? "",
    facultyId: r.facultyId ?? null,
    date: r.date,
    status: r.status,
    createdAt: r.createdAt.toISOString(),
  })));
});

router.patch("/attendance/:id", requireAuth, async (req, res): Promise<void> => {
  const params = UpdateAttendanceParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateAttendanceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [record] = await db
    .update(attendanceTable)
    .set({ status: parsed.data.status })
    .where(eq(attendanceTable.id, params.data.id))
    .returning();

  if (!record) {
    res.status(404).json({ error: "Attendance record not found" });
    return;
  }

  const [student] = await db.select().from(usersTable).where(eq(usersTable.id, record.studentId));
  const [subject] = await db.select().from(subjectsTable).where(eq(subjectsTable.id, record.subjectId));

  res.json({
    id: record.id,
    studentId: record.studentId,
    studentName: student?.name ?? "",
    subjectId: record.subjectId,
    subjectName: subject?.subjectName ?? "",
    facultyId: record.facultyId ?? null,
    date: record.date,
    status: record.status,
    createdAt: record.createdAt.toISOString(),
  });
});

export default router;
