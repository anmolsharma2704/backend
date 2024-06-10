import Product from "../models/productModel.js";
import ErrorHander from "../utils/errorhander.js";
import catchAsyncErrors from "../middleware/catchAsyncErrors.js";
import ApiFeatures from "../utils/apifeatures.js";

// Create Product -- Admin
export const createProduct = catchAsyncErrors(async (req, res, next) => {
  let images = [];

  if (typeof req.body.images === "string") {
    images.push(req.body.images);
  } else {
    images = req.body.images;
  }

  // Convert base64 images to buffer
  const imagesBuffers = images.map(image => Buffer.from(image, 'base64'));

  req.body.images = imagesBuffers;
  req.body.user = req.user.id;

  const product = await Product.create(req.body);

  res.status(201).json({
    success: true,
    product,
  });
});
// Get All Product
export const getAllProducts = catchAsyncErrors(async (req, res, next) => {
  const resultPerPage = 8;
  const productsCount = await Product.countDocuments();

  // Initialize apiFeature with search and filter
  const apiFeature = new ApiFeatures(Product.find(), req.query)
    .search()
    .filter();

  // Execute the search and filter query to get initial products
  let products = await apiFeature.query;

  // Get filtered products count before pagination
  let filteredProductsCount = products.length;

  // Apply pagination on the initial filtered results
  apiFeature.pagination(resultPerPage);

  // Execute the paginated query to get the final products
  products = await apiFeature.query.clone();

  res.status(200).json({
    success: true,
    products,
    productsCount,
    resultPerPage,
    filteredProductsCount,
  });
});

// Get All Product (Admin)
export const getAdminProducts = catchAsyncErrors(async (req, res, next) => {
  const products = await Product.find();

  res.status(200).json({
    success: true,
    products,
  });
});

// Get Product Details
export const getProductDetails = catchAsyncErrors(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(new ErrorHander("Product not found", 404));
  }

  res.status(200).json({
    success: true,
    product,
  });
});

// Update Product -- Admin
export const updateProduct = catchAsyncErrors(async (req, res, next) => {
  let product = await Product.findById(req.params.id);

  if (!product) {
    return next(new ErrorHander("Product not found", 404));
  }

  // Images Start Here
  let images = [];

  if (typeof req.body.images === "string") {
    images.push(req.body.images);
  } else {
    images = req.body.images;
  }

  // Convert base64 images to buffer
  const imagesBuffers = images.map(image => Buffer.from(image, 'base64'));

  if (images !== undefined) {
    // Clear existing images
    product.images = [];
    // Add new images
    product.images.push(...imagesBuffers);
  }

  product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });

  res.status(200).json({
    success: true,
    product,
  });
});

// Delete Product
export const deleteProduct = catchAsyncErrors(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(new ErrorHander("Product not found", 404));
  }

  await product.remove();

  res.status(200).json({
    success: true,
    message: "Product Delete Successfully",
  });
});

// Create New Review or Update the review
export const createProductReview = catchAsyncErrors(async (req, res, next) => {
  const { rating, comment, productId } = req.body;

  const review = {
    user: req.user._id,
    name: req.user.name,
    rating: Number(rating),
    comment,
  };

  const product = await Product.findById(productId);

  if (!product) {
    return next(new ErrorHander("Product not found", 404));
  }

  const isReviewed = product.reviews.find(
    (rev) => rev.user.toString() === req.user._id.toString()
  );

  // Check if the user is an admin or the review belongs to the current user
  if (!req.user.isAdmin && (!isReviewed || isReviewed.user.toString() !== req.user._id.toString())) {
    return next(new ErrorHander("You are not authorized to update this review", 401));
  }

  if (isReviewed) {
    // Update existing review
    product.reviews.forEach((rev) => {
      if (rev.user.toString() === req.user._id.toString()) {
        rev.rating = rating;
        rev.comment = comment;
      }
    });
  } else {
    // Add new review
    product.reviews.push(review);
    product.numOfReviews = product.reviews.length;
  }

  let avg = 0;

  product.reviews.forEach((rev) => {
    avg += rev.rating;
  });

  product.ratings = avg / product.reviews.length;

  await product.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true,
  });
});

// Get All Reviews of a product
export const getProductReviews = catchAsyncErrors(async (req, res, next) => {
  const product = await Product.findById(req.query.id);

  if (!product) {
    return next(new ErrorHander("Product not found", 404));
  }

  res.status(200).json({
    success: true,
    reviews: product.reviews,
  });
});

// Delete Review
export const deleteReview = catchAsyncErrors(async (req, res, next) => {
  const product = await Product.findById(req.query.productId);

  if (!product) {
    return next(new ErrorHander("Product not found", 404));
  }

  const reviews = product.reviews.filter(
    (rev) => rev._id.toString() !== req.query.id.toString()
  );

  let avg = 0;

  reviews.forEach((rev) => {
    avg += rev.rating;
  });

  let ratings = 0;

  if (reviews.length === 0) {
    ratings = 0;
  } else {
    ratings = avg / reviews.length;
  }

  const numOfReviews = reviews.length;

  await Product.findByIdAndUpdate(
    req.query.productId,
    {
      reviews,
      ratings,
      numOfReviews,
    },
    {
      new: true,
      runValidators: true,
      useFindAndModify: false,
    }
  );

  res.status(200).json({
    success: true,
  });
});
export const createRentalOrder = catchAsyncErrors(async (req, res, next) => {
  // Get product ID from request body
  const { productId } = req.body;

  // Find the product in the database
  const product = await Product.findById(productId);

  // Check if product exists
  if (!product) {
      return next(new ErrorHandler('Product not found', 404));
  }

  // Check if product is available for rent
  if (!product.isAvailableForRent) {
      return next(new ErrorHandler('Product is not available for rent', 400));
  }

  // Create the rental order
  const order = await Order.create({
      product: productId,
      user: req.user._id, // Assuming user ID is stored in req.user
      price: product.rentalPrice,
      status: 'pending', // Initial status of the order
  });

  // Send response
  res.status(201).json({
      success: true,
      order,
  });
});

export // Controller for creating a rental product
const createRentalProduct = catchAsyncErrors(async (req, res, next) => {
    // Extract required data from request body
    const { name, description, rentalPrice, image } = req.body;

    // Create new product
    const product = await Product.create({
        name,
        description,
        rentalPrice,
        image,
        isAvailableForRent: true, // Set product availability for rent to true
    });

    // Send response
    res.status(201).json({
        success: true,
        product,
    });
});

export const getRentalOrders = catchAsyncErrors(async (req, res, next) => {
  // Fetch all rental orders from the database
  const rentalOrders = await RentalOrder.find();

  // Send response
  res.status(200).json({
      success: true,
      count: rentalOrders.length,
      rentalOrders,
  });
});


// Controller for fetching rental products
export const getRentalProducts = catchAsyncErrors(async (req, res, next) => {
  // Fetch all rental products where isRentable is true from the database
  const rentalProducts = await Product.find({  isRentable: true });
  // Send response
  res.status(200).json({
      success: true,
      count: rentalProducts.length,
      rentalProducts,
  });
});


// Controller for updating product review
export const updateProductReview = catchAsyncErrors(async (req, res, next) => {
  // Find the product by its ID
  const product = await Product.findById(req.params.id);

  if (!product) {
      return next(new ErrorHandler('Product not found', 404));
  }

  // Update the review
  const { rating, comment } = req.body.review;

  // Check if the user already reviewed the product
  const isReviewed = product.reviews.find(
      review => review.user.toString() === req.user._id.toString()
  );

  if (isReviewed) {
      // Update existing review
      product.reviews.forEach(review => {
          if (review.user.toString() === req.user._id.toString()) {
              review.rating = rating;
              review.comment = comment;
          }
      });
  } else {
      // Add new review
      product.reviews.push({
          user: req.user._id,
          name: req.user.name,
          rating: Number(rating),
          comment,
      });
      product.numOfReviews = product.reviews.length;
  }

  // Calculate product average rating
  product.ratings = product.reviews.reduce((acc, review) => review.rating + acc, 0) / product.reviews.length;

  // Save the updated product
  await product.save({ validateBeforeSave: false });

  // Send response
  res.status(200).json({
      success: true,
  });
});

// Controller for updating rental status
export const updateRentalStatus = catchAsyncErrors(async (req, res, next) => {
  // Find the product by its ID
  let product = await Product.findById(req.params.id);

  if (!product) {
      return next(new ErrorHandler('Product not found', 404));
  }

  // Update rental status
  product.rentalStatus = req.body.rentalStatus;

  // Save the updated product
  product = await product.save();

  // Send response
  res.status(200).json({
      success: true,
      product,
  });
});
