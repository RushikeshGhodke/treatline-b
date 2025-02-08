import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiErrors.js";
import { Assessment } from "../models/Assessment.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";


export const getAssessment = asyncHandler(async (req, res) => {
    try {
        const { userId } = req.body; // Extract userId from request body
        // console.log(userId)
        if (!userId) {
            return res.status(400).json({ error: "User ID is required" });
        }

        const assessments = await Assessment.find({ userId }); // Fetch assessments for the user

        // console.log(assessments);

        res.status(200).json(new ApiResponse(200, assessments, "Assessment Fetched."));
    } catch (error) {
        res.status(500).json(new ApiError("Failed to fetch assessments"));
    }
});

export const getSingleAssessment = asyncHandler(async (req, res) => {
    const { id } = req.params;
    console.log(id)
    try {
        const assessment = await Assessment.findById(id);

        if (!assessment) {
            return res.status(404).json(new ApiError(404, "Assessment not found"));
        }

        res.status(200).json(new ApiResponse(200, assessment, "Assessment fetched successfully"));
    } catch (error) {
        console.error(error);
        res.status(500).json(new ApiError(500, "Server error while fetching the assessment"));
    }
});
