import express from "express";
import {
  getAllProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductDetails,
  createProductReview,
  updateProductReview,
  deleteReview,
  getProductReviews,
  getAdminProducts,
  createRentalProduct,
  updateRentalStatus,
  getRentalProducts,
  createRentalOrder,
  getRentalOrders,
} from "../controllers/productController.js";
import { isAuthenticatedUser, authorizeRoles } from "../middleware/auth.js";

const router = express.Router();

// Product routes
router.route("/products").get(getAllProducts);

router
  .route("/admin/products")
  .get(isAuthenticatedUser, authorizeRoles("admin"), getAdminProducts);

router
  .route("/admin/product/new")
  .post(isAuthenticatedUser, authorizeRoles("admin", "seller"), createProduct);

router
  .route("/admin/product/:id")
  .put(isAuthenticatedUser, authorizeRoles("admin", "seller"), updateProduct)
  .delete(isAuthenticatedUser, authorizeRoles("admin", "seller"), deleteProduct);

router.route("/product/:id")
  .get(getProductDetails)
 

router
  .route("/product/:id/review")
  .post(isAuthenticatedUser, authorizeRoles("customer"), createProductReview)
  .put(isAuthenticatedUser, authorizeRoles("admin", "customer"), updateProductReview);

router
  .route("/product/:id/reviews")
  .get(getProductReviews)
  .delete(isAuthenticatedUser,authorizeRoles("admin", "customer"), deleteReview);

// Rental routes
router
  .route("/admin/rental/new")
  .post(isAuthenticatedUser, authorizeRoles("admin", "seller"), createRentalProduct);

router
  .route("/admin/rental/:id")
  .put(isAuthenticatedUser, authorizeRoles("admin", "seller"), updateRentalStatus);

router.route("/rentals").get(getRentalProducts);

router
  .route("/rental/order/new")
  .post(isAuthenticatedUser, authorizeRoles("customer"), createRentalOrder);

router
  .route("/rental/orders")
  .get(isAuthenticatedUser, authorizeRoles("admin", "seller"), getRentalOrders);

export default router;
