import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { db, usersTable } from "@workspace/db";
import { eq, and, ilike, or } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";
import {
  ListStudentsQueryParams,
  CreateStudentBody,
  GetStudentParams,
  UpdateStudentParams,
  UpdateStudentBody,
  DeleteStudentParams,
  GetStudentAttendanceSummaryParams,
} from "@workspace/api-zod";
import { attendanceTable, subjectsTable } from "@workspace/db";
import { sql } from "drizzle-orm";

const router: IRouter = Router();

router.get("/students", requireAuth, async (req, res): Promise<void> => {
  const params = ListStudentsQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  let query = db
    .select({
      id: usersTable.id,
      name: usersTable.name,
      email: usersTable.email,
      department: usersTable.department,
      semester: usersTable.semester,
      createdAt: usersTable.createdAt,
    })
    .from(usersTable)
    .where(eq(usersTable.role, "student"))
    .$dynamic();

  const conditions = [eq(usersTable.role, "student")];

  if (params.data.department) {
    conditions.push(eq(usersTable.department, params.data.department));
  }
  if (params.data.semester) {
    conditions.push(eq(usersTable.semester, params.data.semester));
  }
  if (params.data.search) {
    conditions.push(
      or(
        ilike(usersTable.name, `%${params.data.search}%`),
        ilike(usersTable.email, `%${params.data.search}%`)
      )!
    );
  }

  const students = await db
    .select({
      id: usersTable.id,
      name: usersTable.name,
      email: usersTable.email,
      department: usersTable.department,
      semester: usersTable.semester,
      createdAt: usersTable.createdAt,
    })
    .from(usersTable)
    .where(and(...conditions));

  res.json(students.map(s => ({
    ...s,
    department: s.department ?? "",
    semester: s.semester ?? "",
    createdAt: s.createdAt.toISOString(),
  })));
});

router.post("/students", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateStudentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { name, email, password, department, semester } = parsed.data;
  const passwordHash = await bcrypt.hash(password, 10);

  const [student] = await db
    .insert(usersTable)
    .values({ name, email, passwordHash, role: "student", department, semester })
    .returning();

  res.status(201).json({
    id: student.id,
    name: student.name,
    email: student.email,
    department: student.department ?? "",
    semester: student.semester ?? "",
    createdAt: student.createdAt.toISOString(),
  });
});

router.get("/students/:id", requireAuth, async (req, res): Promise<void> => {
  const params = GetStudentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [student] = await db
    .select()
    .from(usersTable)
    .where(and(eq(usersTable.id, params.data.id), eq(usersTable.role, "student")));

  if (!student) {
    res.status(404).json({ error: "Student not found" });
    return;
  }

  res.json({
    id: student.id,
    name: student.name,
    email: student.email,
    department: student.department ?? "",
    semester: student.semester ?? "",
    createdAt: student.createdAt.toISOString(),
  });
});

router.patch("/students/:id", requireAuth, async (req, res): Promise<void> => {
  const params = UpdateStudentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateStudentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updates: Record<string, unknown> = {};
  if (parsed.data.name !== undefined) updates.name = parsed.data.name;
  if (parsed.data.email !== undefined) updates.email = parsed.data.email;
  if (parsed.data.department !== undefined) updates.department = parsed.data.department;
  if (parsed.data.semester !== undefined) updates.semester = parsed.data.semester;
  if (parsed.data.password) updates.passwordHash = await bcrypt.hash(parsed.data.password, 10);

  const [student] = await db
    .update(usersTable)
    .set(updates)
    .where(and(eq(usersTable.id, params.data.id), eq(usersTable.role, "student")))
    .returning();

  if (!student) {
    res.status(404).json({ error: "Student not found" });
    return;
  }

  res.json({
    id: student.id,
    name: student.name,
    email: student.email,
    department: student.department ?? "",
    semester: student.semester ?? "",
    createdAt: student.createdAt.toISOString(),
  });
});

router.delete("/students/:id", requireAuth, async (req, res): Promise<void> => {
  const params = DeleteStudentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  await db
    .delete(usersTable)
    .where(and(eq(usersTable.id, params.data.id), eq(usersTable.role, "student")));

  res.sendStatus(204);
});

router.get("/students/:id/attendance-summary", requireAuth, async (req, res): Promise<void> => {
  const params = GetStudentAttendanceSummaryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const rows = await db
    .select({
      subjectId: attendanceTable.subjectId,
      subjectName: subjectsTable.subjectName,
      subjectCode: subjectsTable.subjectCode,
      totalClasses: sql<number>`count(*)::int`,
      present: sql<number>`sum(case when ${attendanceTable.status} = 'Present' then 1 else 0 end)::int`,
      absent: sql<number>`sum(case when ${attendanceTable.status} = 'Absent' then 1 else 0 end)::int`,
      late: sql<number>`sum(case when ${attendanceTable.status} = 'Late' then 1 else 0 end)::int`,
    })
    .from(attendanceTable)
    .leftJoin(subjectsTable, eq(attendanceTable.subjectId, subjectsTable.id))
    .where(eq(attendanceTable.studentId, params.data.id))
    .groupBy(attendanceTable.subjectId, subjectsTable.subjectName, subjectsTable.subjectCode);

  res.json(rows.map(r => ({
    subjectId: r.subjectId,
    subjectName: r.subjectName ?? "",
    subjectCode: r.subjectCode ?? "",
    totalClasses: r.totalClasses,
    present: r.present,
    absent: r.absent,
    late: r.late,
    percentage: r.totalClasses > 0
      ? Math.round(((r.present + r.late) / r.totalClasses) * 100 * 10) / 10
      : 0,
  })));
});

export default router;
