import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { db, usersTable } from "@workspace/db";
import { eq, and, ilike, or } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";
import {
  ListFacultyQueryParams,
  CreateFacultyBody,
  GetFacultyParams,
  UpdateFacultyParams,
  UpdateFacultyBody,
  DeleteFacultyParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/faculty", requireAuth, async (req, res): Promise<void> => {
  const params = ListFacultyQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const conditions: ReturnType<typeof eq>[] = [eq(usersTable.role, "faculty")];

  if (params.data.search) {
    const search = params.data.search;
    const faculty = await db
      .select({
        id: usersTable.id,
        name: usersTable.name,
        email: usersTable.email,
        createdAt: usersTable.createdAt,
      })
      .from(usersTable)
      .where(
        and(
          eq(usersTable.role, "faculty"),
          or(ilike(usersTable.name, `%${search}%`), ilike(usersTable.email, `%${search}%`))
        )
      );
    res.json(faculty.map(f => ({ ...f, createdAt: f.createdAt.toISOString() })));
    return;
  }

  const faculty = await db
    .select({
      id: usersTable.id,
      name: usersTable.name,
      email: usersTable.email,
      createdAt: usersTable.createdAt,
    })
    .from(usersTable)
    .where(and(...conditions));

  res.json(faculty.map(f => ({ ...f, createdAt: f.createdAt.toISOString() })));
});

router.post("/faculty", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateFacultyBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { name, email, password } = parsed.data;
  const passwordHash = await bcrypt.hash(password, 10);

  const [faculty] = await db
    .insert(usersTable)
    .values({ name, email, passwordHash, role: "faculty" })
    .returning();

  res.status(201).json({
    id: faculty.id,
    name: faculty.name,
    email: faculty.email,
    createdAt: faculty.createdAt.toISOString(),
  });
});

router.get("/faculty/:id", requireAuth, async (req, res): Promise<void> => {
  const params = GetFacultyParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [faculty] = await db
    .select()
    .from(usersTable)
    .where(and(eq(usersTable.id, params.data.id), eq(usersTable.role, "faculty")));

  if (!faculty) {
    res.status(404).json({ error: "Faculty not found" });
    return;
  }

  res.json({
    id: faculty.id,
    name: faculty.name,
    email: faculty.email,
    createdAt: faculty.createdAt.toISOString(),
  });
});

router.patch("/faculty/:id", requireAuth, async (req, res): Promise<void> => {
  const params = UpdateFacultyParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateFacultyBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updates: Record<string, unknown> = {};
  if (parsed.data.name !== undefined) updates.name = parsed.data.name;
  if (parsed.data.email !== undefined) updates.email = parsed.data.email;
  if (parsed.data.password) updates.passwordHash = await bcrypt.hash(parsed.data.password, 10);

  const [faculty] = await db
    .update(usersTable)
    .set(updates)
    .where(and(eq(usersTable.id, params.data.id), eq(usersTable.role, "faculty")))
    .returning();

  if (!faculty) {
    res.status(404).json({ error: "Faculty not found" });
    return;
  }

  res.json({
    id: faculty.id,
    name: faculty.name,
    email: faculty.email,
    createdAt: faculty.createdAt.toISOString(),
  });
});

router.delete("/faculty/:id", requireAuth, async (req, res): Promise<void> => {
  const params = DeleteFacultyParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  await db
    .delete(usersTable)
    .where(and(eq(usersTable.id, params.data.id), eq(usersTable.role, "faculty")));

  res.sendStatus(204);
});

export default router;
