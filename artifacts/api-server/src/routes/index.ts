import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import studentsRouter from "./students";
import facultyRouter from "./faculty";
import subjectsRouter from "./subjects";
import attendanceRouter from "./attendance";
import analyticsRouter from "./analytics";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(studentsRouter);
router.use(facultyRouter);
router.use(subjectsRouter);
router.use(attendanceRouter);
router.use(analyticsRouter);

export default router;
