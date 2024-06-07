import express from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  forgotPassword,
  resetPassword,
  getUserProfile,
  updateUserProfile,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  updateUserRole,
} from "../controllers/userController.js";

import { isAuthenticatedUser, authorizeRoles } from "../middleware/auth.js";


const router = express.Router();

// User Authentication Routes
router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/logout", isAuthenticatedUser, logoutUser);
router.post("/password/forgot", forgotPassword);
router.put("/password/reset/:resetToken", resetPassword);

// User Profile Routes
router.route("/profile")
  .get(isAuthenticatedUser, getUserProfile)
  .put(isAuthenticatedUser, updateUserProfile);

// Admin Routes
router.use(isAuthenticatedUser);
router.use(authorizeRoles("admin"));

// User Management Routes
router.route("/")
  .get(getAllUsers);

router.route("/:id")
  .get(getUserById)
  .put(updateUser)
  .delete(deleteUser);

// Update User Role Route
router.route("/:id/role")
  .put(updateUserRole);

export default router;
