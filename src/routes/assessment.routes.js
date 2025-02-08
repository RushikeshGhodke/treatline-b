import { Router } from "express";
import { getAssessment, getSingleAssessment } from "../controllers/assessment.controller.js";

const router = Router();

router.route("/getAssessments").post(getAssessment)
router.route("/assessment/:id").get(getSingleAssessment);

export default router;