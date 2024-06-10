import User from "../models/userModel.js";
import ErrorHander from "../utils/errorhander.js";
import catchAsyncErrors from "../middleware/catchAsyncErrors.js";
import sendToken from "../utils/jwtToken.js";
import sendEmail from "../utils/sendEmail.js";
import crypto from 'crypto';


// Register a User
export const registerUser = catchAsyncErrors(async (req, res, next) => {
  const { name, email, password, avatar } = req.body;

  // Convert avatar image to base64 string
  const avatarBase64 = avatar.toString('base64');

  const user = await User.create({
    name,
    email,
    password,
    avatar: avatarBase64,
  });

  sendToken(user, 201, res);
});

// Login User
export const loginUser = catchAsyncErrors(async (req, res, next) => {
  const { email, password } = req.body;

  // Check if email and password are provided
  if (!email || !password) {
    return next(new ErrorHander("Please provide email and password", 400));
  }

  // Check if user exists in database
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    return next(new ErrorHander("Invalid email or password", 401));
  }

  // Check if password is correct
  const isPasswordMatched = await user.comparePassword(password);

  if (!isPasswordMatched) {
    return next(new ErrorHander("Invalid email or password", 401));
  }

  // Send JWT token to client
  sendToken(user, 200, res);
});

// Logout User
export const logout = catchAsyncErrors(async (req, res, next) => {
  // Clear cookie
  res.cookie("token", null, {
    expires: new Date(Date.now()),
    httpOnly: true,
  });

  res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
});

// Forgot Password
export const forgotPassword = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new ErrorHander("User not found", 404));
  }

  // Get ResetPassword Token
  const resetToken = user.getResetPasswordToken();

  await user.save({ validateBeforeSave: false });

  const resetPasswordUrl = `${req.protocol}://${req.get(
    "host"
  )}api/v1/password/reset/${resetToken}`;

  const message = `Your password reset token is :- \n\n ${resetPasswordUrl} \n\nIf you have not requested this email, please ignore it.`;

  try {
    await sendEmail({
      email: user.email,
      subject: `Password Recovery`,
      message,
    });

    res.status(200).json({
      success: true,
      message: `Email sent to ${user.email} successfully`,
    });
  } catch (error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save({ validateBeforeSave: false });

    return next(new ErrorHander("Email could not be sent", 500));
  }
});

// Reset Password
export const resetPassword = catchAsyncErrors(async (req, res, next) => {
  const resetPasswordToken = crypto
    .createHash('sha256')
    .update(req.params.resetToken)
    .digest('hex');

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    return next(new ErrorHander('Reset Password Token is invalid or has expired', 400));
  }

  if (req.body.password !== req.body.confirmPassword) {
    return next(new ErrorHander('Passwords do not match', 400));
  }

  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;

  await user.save();

  sendToken(user, 200, res);
});
// Get User Detail
export const getUserDetails = catchAsyncErrors(async (req, res, next) => {
  // Get user details logic here
  const user = await User.findById(req.user.id);

  res.status(200).json({
    success: true,
    user,
  });
});

// Update User password
export const updatePassword = catchAsyncErrors(async (req, res, next) => {
  // Update user password logic here
  const user = await User.findById(req.user.id).select("+password");

  const isPasswordMatched = await user.comparePassword(req.body.oldPassword);

  if (!isPasswordMatched) {
    return next(new ErrorHander("Old password is incorrect", 400));
  }

  if (req.body.newPassword !== req.body.confirmPassword) {
    return next(new ErrorHander("password does not match", 400));
  }

  user.password = req.body.newPassword;

  await user.save();

  sendToken(user, 200, res);
});

// Update User Profile
export const updateProfile = catchAsyncErrors(async (req, res, next) => {
  const { name, email, avatar } = req.body;

  // Find the user by ID
  const user = await User.findById(req.user.id);

  if (!user) {
    return next(new ErrorHander("User not found", 404));
  }

  // Update the user's name and email
  user.name = name;
  user.email = email;

  // Convert avatar image to base64 string
  const avatarBase64 = avatar.toString('base64');
  user.avatar = avatarBase64;

  // Save the updated user profile
  await user.save();

  res.status(200).json({
    success: true,
    message: "User profile updated successfully",
  });
});


// Get all users (admin)
export const getAllUsers = catchAsyncErrors(async (req, res, next) => {
  // Get all users logic here
  const users = await User.find();

  res.status(200).json({
    success: true,
    users,
  });
});

// Get single user (admin)
export const getSingleUser = catchAsyncErrors(async (req, res, next) => {
  // Get single user logic here
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(
      new ErrorHander(`User does not exist with Id: ${req.params.id}`)
    );
  }

  res.status(200).json({
    success: true,
    user,
  });
});

// Update User Role (admin)
export const updateUserRole = catchAsyncErrors(async (req, res, next) => {
  // Update user role logic here
  const newUserData = {
    name: req.body.name,
    email: req.body.email,
    role: req.body.role,
  };

  await User.findByIdAndUpdate(req.params.id, newUserData, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });

  res.status(200).json({ 
    success: true,
  });
});

// Delete User (admin)
export const deleteUser = catchAsyncErrors(async (req, res, next) => {
  // Find the user by ID
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new ErrorHander(`User with id ${req.params.id} not found`, 404));
  }

  // Delete the user from the database
  await user.remove();

  res.status(200).json({
    success: true,
    message: `User with id ${req.params.id} deleted successfully`,
  });
});

// Controller for getting user by ID
export const getUserById = catchAsyncErrors(async (req, res, next) => {
  // Find the user by their ID
  const user = await User.findById(req.params.id);

  if (!user) {
      return next(new ErrorHandler('User not found', 404));
  }

  // Send response
  res.status(200).json({
      success: true,
      user,
  });
});

// Controller for getting user profile
export const getUserProfile = catchAsyncErrors(async (req, res, next) => {
  // Find the user by their ID
  const user = await User.findById(req.user.id);

  if (!user) {
      return next(new ErrorHandler('User not found', 404));
  }

  // Send response
  res.status(200).json({
      success: true,
      user,
  });
});

// Controller for logging out user
export const logoutUser = (req, res) => {
  // Clear the token cookie
  res.cookie('token', null, {
      expires: new Date(Date.now()),
      httpOnly: true,
  });

  // Send response
  res.status(200).json({
      success: true,
      message: 'Logged out successfully',
  });
};
export const updateUser = catchAsyncErrors(async (req, res, next) => {
  const newUserData = {
      name: req.body.name,
      email: req.body.email,
  };

  // Update user document
  const updatedUser = await User.findByIdAndUpdate(req.user.id, newUserData, {
      new: true,
      runValidators: true,
      useFindAndModify: false
  });

  res.status(200).json({
      success: true,
      updatedUser
  });
});

// Update user profile
export const updateUserProfile = catchAsyncErrors(async (req, res, next) => {
  const newUserData = {
      name: req.body.name,
      email: req.body.email,
  };

  // Find user by ID and update profile
  const user = await User.findById(req.user.id);

  if (!user) {
      return next(new ErrorHandler('User not found', 404));
  }

  // Update user data
  user.name = newUserData.name;
  user.email = newUserData.email;

  await user.save();

  res.status(200).json({
      success: true,
      user
  });
});