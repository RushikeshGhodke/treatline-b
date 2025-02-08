import { Router } from "express";
import {
    changeCurrentPassword,
    getCurrentUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    registerUser,
    updateAvatarImage,
    forgotPassword,
    verifyOTP,
    resetPassword, editUser,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1,
        },
    ]),
    registerUser
);

router.route("ver")

router.route("/login").post(loginUser);

//secured routes
router.route("/logout").post(verifyJWT, logoutUser);

router.route("/edit").put(editUser);

router.route("/refresh-token").post(refreshAccessToken);

router.route("/change-password").post(verifyJWT, changeCurrentPassword);

router.route("/current-user").get(verifyJWT, getCurrentUser);

// router.route("/update-account-details").patch(verifyJWT, updateAccountDetails);

router
    .route("/update-avatar")
    .patch(verifyJWT, upload.single("avatar"), updateAvatarImage);

// router.route("/c/:username").get(verifyJWT, getCurrentUserProfile);

// router.route("/history").get(verifyJWT, getHistory);

router.route('/forgot-password').post(forgotPassword);

router.route('/verify-otp').post(verifyOTP);

router.route('/reset-password').post(resetPassword);



export default router;
