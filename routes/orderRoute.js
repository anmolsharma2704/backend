import express from "express";
import {
  newOrder,
  getSingleOrder,
  myOrders,
  getAllOrders,
  updateOrder,
  deleteOrder,
  updateOrderStatus,
  getOrderAnalytics,
} from "../controllers/orderController.js";
import { isAuthenticatedUser, authorizeRoles } from "../middleware/auth.js";

const router = express.Router();

router.route("/order/new").post(isAuthenticatedUser, newOrder);

router.route("/order/:id")
  .get(isAuthenticatedUser, getSingleOrder)
  .put(isAuthenticatedUser, updateOrderStatus) // Update order status

router.route("/orders/me").get(isAuthenticatedUser, myOrders);

router.route("/admin/orders")
  .get(isAuthenticatedUser, authorizeRoles("admin", "seller"), getAllOrders)
  .get(isAuthenticatedUser, authorizeRoles("admin"), getOrderAnalytics); // Order analytics

router.route("/admin/order/:id")
  .put(isAuthenticatedUser, authorizeRoles("admin"), updateOrder)
  .delete(isAuthenticatedUser, authorizeRoles("admin"), deleteOrder);

export default router;
