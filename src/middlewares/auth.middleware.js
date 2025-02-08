import ApiError from "../utils/ApiErrors.js";
import asyncHandler from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { Doctor } from "../models/Doctor.model.js";

export const verifyJWT = asyncHandler(async (req, _, next) => {
    // _ instead of res as no use of response
    try {
        const token = req.cookies?.accessToken || req.header("Authorization"?.replace("Bearer ",""));
        
        if (!token) {
            throw new ApiError(401, "Unauthorized request");
        }
    
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    
        const doctor = await Doctor.findById(decodedToken?._id).select(
            "-password -refreshtoken"
        );
    
        if (!doctor) {
            throw new ApiError(401, "Invalid Access Token")
        }
    
        req.doctor = doctor;
        next();
    } catch (error) {
        throw new ApiError(401, error?.message);
    }

}) 