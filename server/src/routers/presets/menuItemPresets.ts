import { Router } from "express";
import { menuItemController } from "../../controllers/menuItemPresetController";
import { validateMenuItem } from "../../middleware/menuItemMiddleware";

const router = Router();

router.get(`/`, menuItemController.getAllMenuItems);

router.get(`/:foodGroup`, menuItemController.getMenuItems);

router.get(`/:foodGroup/:id`, menuItemController.getOneMenuItem);

router.post(`/`, validateMenuItem, menuItemController.addMenuItem);

router.put(`/:id`, validateMenuItem, menuItemController.editMenuItem);

router.delete(`/:id`, menuItemController.deleteMenuItem);

export default router;
