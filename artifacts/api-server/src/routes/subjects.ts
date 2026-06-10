import { Router, type IRouter } from "express";
import { db, subjectsTable, usersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";
import {
  ListSubjectsQueryParams,
  CreateSubjectBody,
  GetSubjectParams,
  UpdateSubjectParams,
  UpdateSubjectBody,
  DeleteSubjectParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/subjects", requireAuth, async (req, res): Promise<void> => {
  const params = ListSubjectsQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const rows = await db
    .select({
      id: subjectsTable.id,
      subjectName: subjectsTable.subjectName,
      subjectCode: subjectsTable.subjectCode,
      department: subjectsTable.department,
      semester: subjectsTable.semester,
      facultyId: subjectsTable.facultyId,
      facultyName: usersTable.name,
      createdAt: subjectsTable.createdAt,
    })
    .from(subjectsTable)
    .leftJoin(usersTable, eq(subjectsTable.facultyId, usersTable.id));

  let filtered = rows;

  if (params.data.department) {
    filtered = filtered.filter(r => r.department === params.data.department);
  }
  if (params.data.semester) {
    filtered = filtered.filter(r => r.semester === params.data.semester);
  }
  if (params.data.facultyId) {
    filtered = filtered.filter(r => r.facultyId === params.data.facultyId);
  }

  res.json(filtered.map(r => ({
    id: r.id,
    subjectName: r.subjectName,
    subjectCode: r.subjectCode,
    department: r.department,
    semester: r.semester,
    facultyId: r.facultyId ?? null,
    facultyName: r.facultyName ?? null,
    createdAt: r.createdAt.toISOString(),
  })));
});

router.post("/subjects", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateSubjectBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [subject] = await db
    .insert(subjectsTable)
    .values({
      subjectName: parsed.data.subjectName,
      subjectCode: parsed.data.subjectCode,
      department: parsed.data.department,
      semester: parsed.data.semester,
      facultyId: parsed.data.facultyId ?? null,
    })
    .returning();

  let facultyName: string | null = null;
  if (subject.facultyId) {
    const [f] = await db.select().from(usersTable).where(eq(usersTable.id, subject.facultyId));
    facultyName = f?.name ?? null;
  }

  res.status(201).json({
    id: subject.id,
    subjectName: subject.subjectName,
    subjectCode: subject.subjectCode,
    department: subject.department,
    semester: subject.semester,
    facultyId: subject.facultyId ?? null,
    facultyName,
    createdAt: subject.createdAt.toISOString(),
  });
});

router.get("/subjects/:id", requireAuth, async (req, res): Promise<void> => {
  const params = GetSubjectParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [row] = await db
    .select({
      id: subjectsTable.id,
      subjectName: subjectsTable.subjectName,
      subjectCode: subjectsTable.subjectCode,
      department: subjectsTable.department,
      semester: subjectsTable.semester,
      facultyId: subjectsTable.facultyId,
      facultyName: usersTable.name,
      createdAt: subjectsTable.createdAt,
    })
    .from(subjectsTable)
    .leftJoin(usersTable, eq(subjectsTable.facultyId, usersTable.id))
    .where(eq(subjectsTable.id, params.data.id));

  if (!row) {
    res.status(404).json({ error: "Subject not found" });
    return;
  }

  res.json({
    id: row.id,
    subjectName: row.subjectName,
    subjectCode: row.subjectCode,
    department: row.department,
    semester: row.semester,
    facultyId: row.facultyId ?? null,
    facultyName: row.facultyName ?? null,
    createdAt: row.createdAt.toISOString(),
  });
});

router.patch("/subjects/:id", requireAuth, async (req, res): Promise<void> => {
  const params = UpdateSubjectParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateSubjectBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updates: Record<string, unknown> = {};
  if (parsed.data.subjectName !== undefined) updates.subjectName = parsed.data.subjectName;
  if (parsed.data.subjectCode !== undefined) updates.subjectCode = parsed.data.subjectCode;
  if (parsed.data.department !== undefined) updates.department = parsed.data.department;
  if (parsed.data.semester !== undefined) updates.semester = parsed.data.semester;
  if ("facultyId" in parsed.data) updates.facultyId = parsed.data.facultyId ?? null;

  const [subject] = await db
    .update(subjectsTable)
    .set(updates)
    .where(eq(subjectsTable.id, params.data.id))
    .returning();

  if (!subject) {
    res.status(404).json({ error: "Subject not found" });
    return;
  }

  let facultyName: string | null = null;
  if (subject.facultyId) {
    const [f] = await db.select().from(usersTable).where(eq(usersTable.id, subject.facultyId));
    facultyName = f?.name ?? null;
  }

  res.json({
    id: subject.id,
    subjectName: subject.subjectName,
    subjectCode: subject.subjectCode,
    department: subject.department,
    semester: subject.semester,
    facultyId: subject.facultyId ?? null,
    facultyName,
    createdAt: subject.createdAt.toISOString(),
  });
});

router.delete("/subjects/:id", requireAuth, async (req, res): Promise<void> => {
  const params = DeleteSubjectParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  await db.delete(subjectsTable).where(eq(subjectsTable.id, params.data.id));

  res.sendStatus(204);
});

export default router;
