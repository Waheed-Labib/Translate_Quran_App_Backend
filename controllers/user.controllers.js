import { emailPattern, passwordPattern, cookieOptions } from "../constants.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const generateAccessAndRefreshToken = async (userId) => {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
}

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
    if (!emailPattern.test(email)) {
        throw new ApiError(400, 'Email address not valid')
    }

    // password validation
    if (!passwordPattern.test(password)) {
        throw new ApiError(400, 'Password must be 8 characters long')
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

const loginUser = asyncHandler(async (req, res) => {
    // step 1: get email and password from req.body
    const { email, password } = req.body;

    // step 2: throw error if not found
    if (!email && !password) {
        throw new ApiError(400, 'Both email and password are required')
    }

    // step 3: find the user from DB with email
    const user = await User.findOne({ email })

    if (!user) {
        throw new ApiError(400, 'User does not exist')
    }

    // step 4: validate password
    const isPasswordValid = await user.isPasswordCorrect(password);

    if (!isPasswordValid) {
        throw new ApiError(401, 'Invalid credentials')
    }

    // step 5: generate access and refresh token
    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);

    // step 6: get logged in user from DB to send it as response. 
    // You should avoid DB call here, if it affects performance
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    // step 7: return response with cookies
    return res
        .status(200)
        .cookie("accessToken", accessToken, cookieOptions)
        .cookie("refreshToken", refreshToken, cookieOptions)
        .json(
            new ApiResponse(
                201,
                {
                    user: loggedInUser,
                    accessToken,
                    refreshToken
                },
                'Login Successful'
            )
        )
})

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user?._id,
        {
            $unset: {
                refreshToken: 1
            }
        },
        {
            new: true
        }
    )

    return res
        .status(200)
        .clearCookie("accessToken", cookieOptions)
        .clearCookie("refreshToken", cookieOptions)
        .json(
            new ApiResponse(
                200,
                {},
                "Log Out Successful"
            )
        )
})

export {
    registerUser,
    loginUser,
    logoutUser
}