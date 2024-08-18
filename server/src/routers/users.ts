import express from "express";
import { UserController } from "../controllers/userController";
import { validateUser } from "../middleware/usersMiddleware";

const router = express.Router();

// Get all users
router.get("/", UserController.getUsers);

// Update user
router.put("/:id",validateUser, UserController.updateUser);

// Update users (bulk)
router.put("/bulk",validateUser, UserController.updateManyUsers);

router.post("/",validateUser, UserController.addUser);

// Get user by ID
router.get("/:id", UserController.getUser);

// Delete user
router.delete("/:id", UserController.deleteUser);

// Get user by email
router.get("/email/:email", UserController.getUserByEmail);

export default router;
