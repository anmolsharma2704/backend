import mongoose from "mongoose";

const { Schema, model } = mongoose;

const productSchema = new Schema({
  name: {
    type: String,
    required: [true, "Please Enter product Name"],
    trim: true,
  },
  description: {
    type: String,
    required: [true, "Please Enter product Description"],
    trim: true,
  },
  isForSale: {
    type: Boolean,
    default: true,
  },
  price: {
    type: Number,
    required: function() { return this.isForSale; },
    max: [99999999, "Price cannot exceed 8 digits"],
  },
  isRentable: {
    type: Boolean,
    default: false,
  },
  rentalPrice: {
    type: Number,
    required: function() { return this.isRentable; },
    max: [99999999, "Rental price cannot exceed 8 digits"],
  },
  rentalPeriod: {
    type: String,
    required: function() { return this.isRentable; },
    enum: ["daily", "weekly", "monthly"],
    default: "daily",
  },
  ratings: {
    type: Number,
    default: 0,
  },
  images: [
    {
      type: String,
      required: true,
    },
  ],
  category: {
    type: String,
    required: [true, "Please Enter Product Category"],
    trim: true,
  },
  stock: {
    type: Number,
    required: function() { return this.isForSale; },
    max: [9999, "Stock cannot exceed 4 digits"],
    default: 1,
  },
  numOfReviews: {
    type: Number,
    default: 0,
  },
  reviews: [
    {
      user: {
        type: Schema.ObjectId,
        ref: "User",
        required: true,
      },
      name: {
        type: String,
        required: true,
      },
      rating: {
        type: Number,
        required: true,
      },
      comment: {
        type: String,
        required: true,
      },
    },
  ],
  user: {
    type: Schema.ObjectId,
    ref: "User",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  
  
});

export default model("Product", productSchema);
