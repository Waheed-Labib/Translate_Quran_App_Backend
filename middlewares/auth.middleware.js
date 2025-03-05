import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"

export const verifyJWT = asyncHandler(async (req, _, next) => {
    try {

        // step 1: get access token from cookie or header
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")

        if (!token) {
            throw new ApiError(401, "Unauthorized Request")
        }

        // step 2: decode token
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)

        // step 3: get user 
        const user = await User.findById(decodedToken._id).select("-password -refreshToken")

        if (!user) {
            throw new ApiError(401, "Invalid Access Token")
        }

        // step 4: send user in request
        req.user = user

        // step 5: go to next
        next()

    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid Access Token")
    }
})