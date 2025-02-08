import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { Schema } from "mongoose";

// Define the Doctor schema
const doctorSchema = new Schema(
  {
    name: {
      type: String,
      required: true
    },
    specialist: {
      type: String,
      required: true
    },
    language: [{
      type: String,
    }],
    time_slot: {
      type: [Number],
      default: () => Array(8).fill(0) // Fill with 0 (or any other placeholder value)
    },
    available: {
      type: [Number],
      default: () => Array(8).fill(0) // Fill with 0 (or any other placeholder value)
    },
    booked_slot: {
      type: [Number],
      default: () => Array(8).fill(0) // Fill with 0 (or any other placeholder value)
    },
    phone: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    medical_license: {
      type: String,
      required: true,
      unique: true
    },
    degree_certificate: {
      type: String,
    },
    medical_registration_id: {
      type: String,
      required: true,
      unique: true
    },
    password: {
      type: String,
      required: true,
    },
    degree: {
      type: String,
      required: true
    },
    institute: {
      type: String,
      required: true
    },
    year_of_completion: {
      type: Number,
      required: true
    },
    years_of_experience: {
      type: Number,
      required: true
    },
    profile_image: {
      type: String,
      default: ''
    },
    is_active: {
      type: Boolean,
      default: false
    },
    is_sponsored: {
      type: Boolean,
      default: false
    },
    created_at: {
      type: Date,
      default: Date.now
    },
    updated_at: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

// Pre-save middleware to hash the password before saving the doctor document
doctorSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Method to check if the given password matches the stored hashed password
doctorSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

// Method to generate an access token for the doctor
doctorSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      name: this.name,
      email: this.email,
      role: "doctor",
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    }
  );
};

// Method to generate a refresh token for the doctor
doctorSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    }
  );
};

// Create and export the Doctor model
export const Doctor = mongoose.model("Doctor", doctorSchema);
