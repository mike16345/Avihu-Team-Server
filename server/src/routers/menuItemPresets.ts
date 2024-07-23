import { Router } from "express";
import { validateMenuItem } from "../middleware/menuItemMiddleware";
import { menuItemController } from "../controllers/menuItemPresetController";

const router = Router();

router.get(`/`, menuItemController.getAllMenuItems)
router.get(`/:foodGroup`, menuItemController.getMenuItems)
router.get(`/:foodGroup/:id`, menuItemController.getOneMenuItem)
router.post(`/`, validateMenuItem, menuItemController.addMenuItem)
router.put(`/:id`, validateMenuItem, menuItemController.editMenuItem)
router.delete(`/:id`, menuItemController.deleteMenuItem)


export default router