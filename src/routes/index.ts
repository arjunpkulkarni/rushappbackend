import { Router } from "express";
import challenge from "./challenges";
import submission from "./submissions";
import leaderboard from "./leaderboard";
import users from "./users";
import campus from "./campus";
import auth from "./auth";
import buyins from "./buyins";
import media from "./media";

const router = Router();
router.use("/challenges", challenge);
router.use("/submissions", submission);
router.use("/leaderboard", leaderboard);
router.use("/users", users);
router.use("/campus", campus);
router.use("/auth", auth);
router.use("/buyins", buyins);
router.use("/media", media);

export default router;
