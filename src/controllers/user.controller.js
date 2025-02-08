import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiErrors.js";
import { User } from "../models/User.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import nodemailer from "nodemailer"
import bcrypt from "bcryptjs";

// Set up a nodemailer transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
  

const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId);
        
        const accessToken = user.generateAccessToken();        
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(500, "Something went wrong while creating tokens.", error);
    }
};

const registerUser = asyncHandler(async (req, res) => {
    const { username, email, fullname, password, college, course, yearOfStudy, role, country, state } = req.body;

    if ([fullname, username, email, password, college].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "All fields are required");
    }

    const existedUser = await User.findOne({
        $or: [{ username }, { email }],
    });

    if (existedUser) {
        throw new ApiError(409, "User already exists");
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar Image is Required.");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    if (!avatar) {
        throw new ApiError(400, "Error while uploading avatar");
    }

    const user = await User.create({
        fullname,
        avatar: avatar.url,
        email,
        password,
        username: username.toLowerCase(),
        college,
        course,
        yearOfStudy,
        role,
        country,
        state,
    });

    const isCreated = await User.findById(user._id).select("-password -refreshToken");

    if (!isCreated) {
        throw new ApiError(500, "Something went wrong on Server");
    }

    return res.status(201).json(new ApiResponse(200, isCreated, "User registered successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
    const { username, email, password } = req.body;

    console.log(password);

    if (!(username || email)) {
        throw new ApiError(400, "Username or Email is required.");
    }

    const user = await User.findOne({
        $or: [{ email }, { username }],
    });

    if (!user) {
        throw new ApiError(404, "User does not exist");
    }

    const isPasswordValid = await user.isPasswordCorrect(password);

    if (!isPasswordValid) {
        throw new ApiError(404, "Wrong Password");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    const options = {
        httpOnly: true,
        secure: true,
    };

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(new ApiResponse(200, { user: loggedInUser, accessToken, refreshToken }));
});

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1,
            },
        },
        {
            new: true,
        }
    );

    const options = {
        httpOnly: true,
        secure: true,
    };

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User logged out"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
        throw new ApiError(401, "Refresh token not found");
    }

    try {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);

        const user = await User.findById(decodedToken?._id);

        if (!user) {
            throw new ApiError(401, "Unauthorized RefreshToken");
        }

        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired.");
        }

        const options = {
            httpOnly: true,
            secure: true,
        };

        const { accessToken, newRefreshToken } = await generateAccessAndRefreshToken(user?._id);

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(new ApiResponse(200, { accessToken, refreshToken: newRefreshToken }, "Access Token Refreshed"));
    } catch (error) {
        throw new ApiError(401, error?.message);
    }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;

    console.log(oldPassword, newPassword);
    const user = await User.findById(req.user?.id);
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

    console.log(isPasswordCorrect);
    

    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid old Password");
    }

    user.password = newPassword;
    await user.save({ validateBeforeSave: false });

    return res.status(200).json(new ApiResponse(200, {user}, "Password changed successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
    return res.status(200).json(new ApiResponse(200, req.user, "Current user fetched"));
});

const updateAvatarImage = asyncHandler(async (req, res) => {
    const avatarFileLocalPath = req.file?.path;

    if (!avatarFileLocalPath) {
        throw new ApiError(400, "Avatar file is missing");
    }

    const avatar = await uploadOnCloudinary(avatarFileLocalPath);

    if (!avatar.url) {
        throw new ApiError(400, "Error while uploading avatar");
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: avatar.url,
            },
        },
        { new: true }
    ).select("-password");

    return res.status(200).json(new ApiResponse(200, user, "Avatar image updated successfully"));
});

const getCurrentUserProfile = asyncHandler(async (req, res) => {
    const { username } = req.params;

    if (!username?.trim()) {
        throw new ApiError(400, "Username missing");
    }

    const channel = await User.aggregate([
        {
            $match: {
                username: username?.toLowerCase(),
            },
        },
        {
            $project: {
                fullname: 1,
                username: 1,
                avatar: 1,
                college: 1,
                course: 1,
                yearOfStudy: 1,
                role: 1,
                country: 1,
                state: 1,
            },
        },
    ]);

    if (!channel?.length) {
        throw new ApiError(400, "Channel does not exist");
    }

    return res.status(200).json(new ApiResponse(200, channel[0], "User profile fetched"));
});

const forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;
    const user = await User.findOne({ email });
  
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }
  
    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000); // Random 6-digit OTP
  
    // Save OTP to user's record temporarily with expiration (e.g., 10 minutes)
    user.resetPasswordOtp = otp;
    user.resetPasswordOtpExpiration = Date.now() + 10 * 60 * 1000; // 10 minutes expiration
    await user.save();
  
    // Send OTP via email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Password Reset OTP',
      text: `Your OTP for password reset is: ${otp}`,
    };
  
    try {
      await transporter.sendMail(mailOptions);
      res.status(200).json({ message: 'OTP sent to your email' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to send OTP' });
    }
});

// Verify OTP
const verifyOTP = asyncHandler(async (req, res) => {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });
  
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }
  
    // Check OTP and expiration
    if (user.resetPasswordOtp !== parseInt(otp)) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }
  
    if (Date.now() > user.resetPasswordOtpExpiration) {
      return res.status(400).json({ message: 'OTP expired' });
    }
  
    res.status(200).json({ message: 'OTP verified successfully' });
});

// Reset Password
const resetPassword = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });

    if (!user) {
        return res.status(400).json({ message: 'User not found' });
    }

    // Update the password (hashing will be handled by pre-save middleware)
    user.password = password;

    // Clear OTP and expiration fields
    user.resetPasswordOtp = undefined;
    user.resetPasswordOtpExpiration = undefined;

    // Save the updated user
    await user.save();

    res.status(200).json({ message: 'Password reset successfully' });
});

const editUser = asyncHandler(async (req, res) => {
    const { fullname, username, email, college, course, yearOfStudy, role, country, state } = req.body;

    if ([fullname, username, email].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "Fullname, username, and email are required.");
    }

    const existingUser = await User.findOne({
        $or: [
            { username: username.toLowerCase(), _id: { $ne: req.user._id } },
            { email, _id: { $ne: req.user._id } },
        ],
    });

    if (existingUser) {
        throw new ApiError(409, "Username or email already in use by another user.");
    }

    const updatedFields = {
        fullname,
        username: username.toLowerCase(),
        email,
        college,
        course,
        yearOfStudy,
        role,
        country,
        state,
    };

    const updatedUser = await User.findByIdAndUpdate(req.user._id, updatedFields, {
        new: true,
        runValidators: true,
    }).select("-password -refreshToken");

    if (!updatedUser) {
        throw new ApiError(500, "Failed to update user.");
    }

    return res.status(200).json(new ApiResponse(200, updatedUser, "User updated successfully"));
});

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    editUser,
    updateAvatarImage,
    getCurrentUserProfile,
    forgotPassword,
    verifyOTP,
    resetPassword
};
