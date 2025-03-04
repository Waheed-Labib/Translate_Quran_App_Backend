import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const registerUser = asyncHandler(async (req, res) => {

    // step 1: get user details from frontend
    const { username, email, password } = req.body;
    // console.log("email:", email);

    // step 2: validation
    if (
        [username, email, password].some(field => field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required")
    }

    // email address validation
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {
        throw new ApiError(400, 'Email address not valid')
    }

    // step 3: check if user already exists: username, email
    const existedUser = await User.findOne({ email })

    if (existedUser) {
        throw new ApiError(409, "User with this email already exists")
    }

    const userWithSameUsername = await User.findOne({ username })

    if (userWithSameUsername) {
        throw new ApiError(408, "This username already exists")
    }

    // step 4: create user object - create entry in db
    const user = await User.create({
        username,
        email,
        password
    })

    // step 5: remove password and refresh token field from response
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    // step 6: check for user creation
    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    // step 7: return res
    return res.status(201).json(
        new ApiResponse(200, createdUser, 'User Registered Successfully')
    )
})

export {
    registerUser
}