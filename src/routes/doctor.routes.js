import { Router } from "express";
import {
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
  updateSchedule,
  goPremium,
  cancelPremium,
  saveTimeSlots,
  getUnverifiedDoctors,
  approveDoctor,
  rejectDoctor
} from "../controllers/doctor.controller.js"; // Import controller functions
import { upload } from "../middlewares/multer.middleware.js";
import {verifyJWT} from "../middlewares/auth.middleware.js";

const router = Router();


// Doctor Registration
router.route("/register").post(
  upload.fields([
      {
          name: "profile_image",
          maxCount: 1,
      },
      {
        name: "degree_certificate",
        maxCount: 1,
    },
  ]),
  registerDoctor
);

// Doctor Login
router.post("/login", loginDoctor);

router.get("/hi", (req, res) => {
  res.send("Hi")
})

// Doctor Logout
router.post("/logout", verifyJWT, logoutDoctor);

// Refresh Access Token
router.post("/refresh-token", refreshAccessToken);

// Change Current Password
router.post("/change-password", changeCurrentPassword);

// Get Current Doctor Profile
router.get("/me", getCurrentDoctorProfile);

// Update Profile Image (file upload)
router.post("/update-profile-image", updateProfileImage);

// Forgot Password (send OTP)
router.post("/forgot-password", forgotPassword);

// Verify OTP for password reset
router.post("/verify-otp", verifyOTP);

// Reset Password
router.post("/reset-password", resetPassword);

router.post("/goPremium", goPremium);
router.post("/cancelPremium", cancelPremium);

// Edit Doctor Profile
router.put("/edit", editDoctor);

router.put("/updateSchedule", updateSchedule);

router.patch("/saveTimeSlots", saveTimeSlots);

router.get("/getUnverifiedDoctors", getUnverifiedDoctors);

router.put("/approveDoctor/:doctorId", approveDoctor)

router.put("/rejectDoctor/:doctorId", rejectDoctor)

export default router;
