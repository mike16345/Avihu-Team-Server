import { Router } from "express";
import { validateMenuItem } from "../middleware/menuItemMiddleware";
import { menuItemController } from "../controllers/menuItemPresetController";

const router = Router();

router.post(`/:foodGroup`, validateMenuItem, menuItemController.addMenuItem)
router.get(`/:foodGroup`,  menuItemController.getMenuItems)


export default router