import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiErrors.js";
import { Doctor } from "../models/Doctor.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";

// Set up a nodemailer transporter for email sending (e.g., OTPs)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Generate access and refresh tokens
const generateAccessAndRefreshToken = async (doctorId) => {
  try {
    const doctor = await Doctor.findById(doctorId);

    const accessToken = doctor.generateAccessToken();
    const refreshToken = doctor.generateRefreshToken();

    console.log(accessToken, refreshToken)

    doctor.refreshToken = refreshToken;
    await doctor.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "Something went wrong while creating tokens.", error);
  }
};

// Doctor registration
const registerDoctor = asyncHandler(async (req, res) => {
  const { name, specialist, email, password, phone, years_of_experience, medical_license, degree, institute, year_of_completion, medical_registration_id } = req.body;

  if ([name, specialist, email, password, phone].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "All fields are required");
  }

  const existingDoctor = await Doctor.findOne({ $or: [{ email }, { phone }] });

  if (existingDoctor) {
    throw new ApiError(409, "Doctor already exists");
  }

  const profileImageLocalPath = req.files?.profile_image[0]?.path;
  if (!profileImageLocalPath) {
    throw new ApiError(400, "Profile Image is required.");
  }

  const profileImage = await uploadOnCloudinary(profileImageLocalPath);
  if (!profileImage) {
    throw new ApiError(400, "Error while uploading profile image");
  }

  const degree_certificateLocalPath = req.files?.degree_certificate[0]?.path;
  if (!degree_certificateLocalPath) {
    throw new ApiError(400, "degree certificate Image is required.");
  }

  // const degree_certificate = await uploadOnCloudinary(degree_certificateLocalPath);
  // console.log(degree_certificate)
  // if (!degree_certificate) {
  //   throw new ApiError(400, "Error while uploading degree_certificate image");
  // }

  const doctor = await Doctor.create({
    name,
    specialist,
    email,
    password,
    phone,
    years_of_experience,
    medical_license,
    degree, institute, year_of_completion,
    profile_image: profileImage.url,
    medical_registration_id
  });

  const createdDoctor = await Doctor.findById(doctor._id).select("-password -refreshToken");

  if (!createdDoctor) {
    throw new ApiError(500, "Something went wrong on Server");
  }

  return res.status(201).json(new ApiResponse(200, createdDoctor, "Doctor registered successfully"));
});

// Doctor login
const loginDoctor = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email) {
    throw new ApiError(400, "Email is required.");
  }

  const doctor = await Doctor.findOne({ email });

  if (!doctor) {
    throw new ApiError(404, "Doctor does not exist");
  }

  const isPasswordValid = await doctor.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(404, "Wrong Password");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(doctor._id);

  const loggedInDoctor = await Doctor.findById(doctor._id).select("-password -refreshToken");

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(new ApiResponse(200, { doctor: loggedInDoctor, accessToken, refreshToken }));
});

// Doctor logout
const logoutDoctor = asyncHandler(async (req, res) => {

  console.log(req.doctor)

  await Doctor.findByIdAndUpdate(
    req.doctor._id,
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
    .json(new ApiResponse(200, {}, "Doctor logged out"));
});

// Refresh access token for doctor
const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Refresh token not found");
  }

  try {
    const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);

    const doctor = await Doctor.findById(decodedToken?._id);

    if (!doctor) {
      throw new ApiError(401, "Unauthorized RefreshToken");
    }

    if (incomingRefreshToken !== doctor?.refreshToken) {
      throw new ApiError(401, "Refresh token is expired.");
    }

    const options = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken, newRefreshToken } = await generateAccessAndRefreshToken(doctor?._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(new ApiResponse(200, { accessToken, refreshToken: newRefreshToken }, "Access Token Refreshed"));
  } catch (error) {
    throw new ApiError(401, error?.message);
  }
});

// Change current password for doctor
const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const doctor = await Doctor.findById(req.user?.id);
  const isPasswordCorrect = await doctor.isPasswordCorrect(oldPassword);

  if (!isPasswordCorrect) {
    throw new ApiError(400, "Invalid old Password");
  }

  doctor.password = newPassword;
  await doctor.save({ validateBeforeSave: false });

  return res.status(200).json(new ApiResponse(200, { doctor }, "Password changed successfully"));
});

// Get current doctor profile
const getCurrentDoctorProfile = asyncHandler(async (req, res) => {
  return res.status(200).json(new ApiResponse(200, req.user, "Current doctor fetched"));
});

// Update profile image for doctor
const updateProfileImage = asyncHandler(async (req, res) => {
  const profileImageFileLocalPath = req.file?.path;

  if (!profileImageFileLocalPath) {
    throw new ApiError(400, "Profile image is missing");
  }

  const profileImage = await uploadOnCloudinary(profileImageFileLocalPath);

  if (!profileImage.url) {
    throw new ApiError(400, "Error while uploading profile image");
  }

  const doctor = await Doctor.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        profile_image: profileImage.url,
      },
    },
    { new: true }
  ).select("-password");

  return res.status(200).json(new ApiResponse(200, doctor, "Profile image updated successfully"));
});

// Forgot password for doctor
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const doctor = await Doctor.findOne({ email });

  if (!doctor) {
    return res.status(400).json({ message: 'Doctor not found' });
  }

  const otp = Math.floor(100000 + Math.random() * 900000); // 6-digit OTP
  doctor.resetPasswordOtp = otp;
  doctor.resetPasswordOtpExpiration = Date.now() + 10 * 60 * 1000; // 10 minutes expiration
  await doctor.save();

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

// Verify OTP for doctor
const verifyOTP = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;
  const doctor = await Doctor.findOne({ email });

  if (!doctor) {
    return res.status(400).json({ message: 'Doctor not found' });
  }

  if (doctor.resetPasswordOtp !== parseInt(otp)) {
    return res.status(400).json({ message: 'Invalid OTP' });
  }

  if (Date.now() > doctor.resetPasswordOtpExpiration) {
    return res.status(400).json({ message: 'OTP expired' });
  }

  res.status(200).json({ message: 'OTP verified successfully' });
});

// Reset password for doctor
const resetPassword = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const doctor = await Doctor.findOne({ email });

  if (!doctor) {
    return res.status(400).json({ message: 'Doctor not found' });
  }

  doctor.password = password;
  doctor.resetPasswordOtp = undefined;
  doctor.resetPasswordOtpExpiration = undefined;
  await doctor.save();

  res.status(200).json({ message: 'Password reset successfully' });
});

// Edit doctor details
const editDoctor = asyncHandler(async (req, res) => {
  const { name, specialist, email, phone, years_of_experience, medical_license, degree_certificate } = req.body;

  if ([name, specialist, email].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "Name, specialist, and email are required.");
  }

  const existingDoctor = await Doctor.findOne({
    $or: [{ email, _id: { $ne: req.user._id } }, { phone, _id: { $ne: req.user._id } }],
  });

  if (existingDoctor) {
    throw new ApiError(409, "Email or phone already in use by another doctor.");
  }

  const updatedDoctor = await Doctor.findByIdAndUpdate(req.user._id, {
    name,
    specialist,
    email,
    phone,
    years_of_experience,
    medical_license,
    degree_certificate,
  }, { new: true });

  return res.status(200).json(new ApiResponse(200, updatedDoctor, "Doctor details updated successfully"));
});

// Update Doctor schedule
const updateSchedule = asyncHandler(async (req, res) => {
  const { timeIndexes } = req?.body; 

  console.log(timeIndexes);

  if (!Array.isArray(timeIndexes) || timeIndexes.length === 0) {
    throw new Error('Time indexes must be provided as an array');
  }


  timeIndexes.forEach((timeIndex) => {
    if (timeIndex < 0 || timeIndex >= 8) {
      throw new Error(`Something went wrong`);
    }
  });

  const doctor = await Doctor.findById('67a73d0f5c41f47e7877ea34').select("-password");

  timeIndexes.forEach((timeIndex) => {
    doctor.time_slot[timeIndex] = 6;   // Set the new value (example: 6)
    doctor.available[timeIndex] = 1;   // Set the new value (example: 1)
  });

  await doctor.save();

  res.status(200).json({ message: "Doctor schedule updated successfully" });
});


export {
  registerDoctor,
  loginDoctor,
  logoutDoctor,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentDoctorProfile,
  updateProfileImage,
  forgotPassword,
  verifyOTP,
  resetPassword,
  editDoctor,
  updateSchedule
};


