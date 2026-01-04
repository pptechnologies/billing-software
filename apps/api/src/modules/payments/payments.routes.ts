import { Router } from "express";
import * as controller from "./payments.controller";


const router = Router();

router.get("/", controller.listPayments);


export default router;
