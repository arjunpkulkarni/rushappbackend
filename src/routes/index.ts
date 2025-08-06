import { Router } from "express";
import auth from "../middleware/requireAuth";
import challenge from "./challenges";
import submission from "./submissions";
import leaderboard from "./leaderboard";

const router = Router();
router.use("/auth", auth);
router.use("/challenges", challenge);
router.use("/submissions", submission);
router.use("/leaderboard", leaderboard);

export default router;
