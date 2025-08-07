import { Router } from "express";
import challenge from "./challenges";
import submission from "./submissions";
import leaderboard from "./leaderboard";
import users from "./users";
import campus from "./campus";

const router = Router();
router.use("/challenges", challenge);
router.use("/submissions", submission);
router.use("/leaderboard", leaderboard);
router.use("/users", users);
router.use("/campus", campus);

export default router;
