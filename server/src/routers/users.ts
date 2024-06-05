import express from "express";
import { userController } from "../controllers/userController";

const router = express.Router();

// Get all users
router.get("/", userController.getUsers);

// Update user
router.put("/:id", userController.updateUser);

// Update users (bulk)
router.put("/bulk", userController.updateManyUsers);

// Get user by ID
router.get("/:id", userController.getUser);

// Delete user
router.delete("/:id", userController.deleteUser);

// Get user by email
router.get("/email/:email", userController.getUserByEmail);

export default router;
