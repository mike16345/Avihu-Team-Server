import { Router } from "express";
import { validateMenuItem } from "../middleware/menuItemMiddleware";
import { menuItemController } from "../controllers/menuItemPresetController";

const router = Router();

router.post(`/:foodGroup`, validateMenuItem, menuItemController.addMenuItem)


export default router