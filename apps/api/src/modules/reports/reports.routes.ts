import { Router } from "express";
import * as controller from "./reports.controller";

const router = Router();

router.get("/sales", controller.salesReport);
router.get("/vat", controller.vatReport);
router.get("/outstanding", controller.outstandingReport);



export default router;
