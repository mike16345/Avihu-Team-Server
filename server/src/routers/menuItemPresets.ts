import { Router } from "express";
import { validateMenuItem } from "../middleware/menuItemMiddleware";
import { menuItemController } from "../controllers/menuItemPresetController";

const router = Router();

router.post(`/`, validateMenuItem, menuItemController.addMenuItem)
router.get(`/:foodGroup`, menuItemController.getMenuItems)
router.get(`/`, menuItemController.getAllMenuItems)
router.put(`/:id`, validateMenuItem, menuItemController.editMenuItem)
router.delete(`/:id`, menuItemController.deleteMenuItem)


export default router