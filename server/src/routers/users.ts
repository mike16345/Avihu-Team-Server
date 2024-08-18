import express from "express";
import { UserController } from "../controllers/userController";

const router = express.Router();

// Get all users
router.get("/", UserController.getUsers);

// Update user
router.put("/:id", UserController.updateUser);

// Update users (bulk)
router.put("/bulk", UserController.updateManyUsers);

router.post("/", UserController.addUser);

// Get user by ID
router.get("/:id", UserController.getUser);

// Delete user
router.delete("/:id", UserController.deleteUser);

// Get user by email
router.get("/email/:email", UserController.getUserByEmail);

export default router;
