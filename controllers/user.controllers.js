import { emailPattern, passwordPattern, cookieOptions } from "../constants.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import bcrypt from "bcrypt";
import { sendResetEmail } from "../utils/passwordResetEmail.js";
import { sendVerficationEmail } from "../utils/verificationEmail.js";

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
    const { fullName, email, password } = req.body;
    // console.log("email:", email);

    // step 2: validation
    if (
        [fullName, email, password].some(field => field?.trim() === "")
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

    // step 3: check if user already exists: fullName, email
    const existedUser = await User.findOne({ email })

    if (existedUser) {
        throw new ApiError(409, "User with this email already exists")
    }

    const userWithSamefullName = await User.findOne({ fullName })

    if (userWithSamefullName) {
        throw new ApiError(408, "We do not allow duplicate fullnames. Please try a small change or a short extension.")
    }

    // step 4: generate verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const hashedVerificationToken = await bcrypt.hash(verificationToken, 10);

    // step 5: create user object - create entry in db
    const user = await User.create({
        fullName,
        email,
        password,
        verificationToken: hashedVerificationToken
    })

    // step 6: create jwt token and send email
    const encodedToken = jwt.sign({ email, verificationToken }, process.env.EMAIL_VERIFICATION_TOKEN_SECRET);

    sendVerficationEmail(email, encodedToken);

    // step 5: remove password and refresh token field from response
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken -verificationToken -passwordResetToken -passwordResetTokenExpiry"
    );

    // step 6: check for user creation
    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    // step 7: generate access and refresh tokens to make user logged in
    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);

    // step 8: return res
    return res
        .status(201)
        .cookie('accessToken', accessToken, cookieOptions)
        .cookie('refreshToken', refreshToken, cookieOptions)
        .json(
            new ApiResponse(200, createdUser, 'User Registered Successfully. Check Email to verify.')
        )
})

const loginUser = asyncHandler(async (req, res) => {
    // step 1: get email and password from req.body
    const { email, password } = req.body;

    // step 2: throw error if not found
    if (!email || !password) {
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
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken -verificationToken -passwordResetToken -passwordResetTokenExpiry");

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

const refreshAccessToken = asyncHandler(async (req, res) => {

    // step 1: get refresh token from cookies or req.body
    const incomingRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

    if (!incomingRefreshToken) {
        throw new ApiError(400, 'unauthorized request')
    }

    try {

        // step 2: decode refresh token
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);

        // step 3: get user from refresh token
        const user = await User.findById(decodedToken._id);

        if (!user) {
            throw new ApiError(401, "Invalid refresh token")
        }

        // step 4: check if the incoming refresh token matches the refresh token in database

        if (incomingRefreshToken !== user.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used")
        }

        // step 5: generate new access and refresh token
        const { accessToken, refreshToken: newRefreshToken } = await generateAccessAndRefreshToken(user._id);

        // step 6: return response
        return res
            .status(200)
            .cookie('accessToken', accessToken, cookieOptions)
            .cookie('refreshToken', newRefreshToken, cookieOptions)
            .json(
                new ApiResponse(
                    200,
                    {
                        accessToken,
                        refreshToken: newRefreshToken
                    },
                    "Access token refreshed"
                )
            )

    } catch (error) {
        throw new ApiError(400, error?.message || 'Invalid refresh token')
    }
})

const verifyEmail = asyncHandler(async (req, res) => {

    // step 1: get the token from req query
    const { token: encodedVerificationToken } = req.query;

    if (!encodedVerificationToken) {
        throw new ApiError(400, 'Unauthorized request')
    }

    // step 2: decode the token
    const { email, verificationToken } = jwt.verify(encodedVerificationToken, process.env.EMAIL_VERIFICATION_TOKEN_SECRET);

    // step 3: Find user with the email
    const user = await User.findOne({ email });

    if (!user) {
        throw new ApiError(400, "User not found")
    }

    // step 4: verify the token with DB
    const isTokenCorrect = bcrypt.compare(verificationToken, user.verificationToken);

    if (!isTokenCorrect) {
        throw new ApiError(400, "Unauthorized access")
    }

    // step 5: Mark user as verified
    user.isVerified = true;
    user.verificationToken = undefined; // Remove token after verification
    await user.save({ validateBeforeSave: false });

    // step 6: return response
    return res
        .status(200)
        .json(
            new ApiResponse(
                201,
                {},
                "User verification successful"
            )
        )
})

const sendResetPasswordLink = asyncHandler(async (req, res) => {

    // step 1: get email from req.body
    const { email } = req.body;

    if (!email) {
        throw new ApiError(400, "Email address is required")
    }

    // step 2: get user from db
    const user = await User.findOne({ email });

    if (!user) {
        throw new ApiError(400, "User does not exist")
    }

    // step 3: generate password reset token
    const randomToken = crypto.randomBytes(64).toString("hex");

    const userId = user._id;

    const resetToken = jwt.sign(
        { userId, randomToken },
        process.env.PASSWORD_RESET_TOKEN_SECRET,
        { expiresIn: "30m" }
    );

    // step 4: put passwordResetToken and passwordResetTokenExpiry to DB
    user.passwordResetToken = crypto.createHash("sha256").update(randomToken).digest("hex");
    user.passwordResetTokenExpiry = Date.now() + 1800000; //30 min expiration
    user.save({ validateBeforeSave: false })

    // step 5: send resetToken via email
    await sendResetEmail(email, resetToken);

    // step 6: return res
    return res
        .status(200)
        .json(
            new ApiResponse(
                201,
                {},
                "Password reset email sent"
            )
        )
})

const resetPassword = asyncHandler(async (req, res) => {
    // step 1: get token and new password from req.body
    const { resetToken, newPassword } = req.body;

    if (!resetToken || !newPassword) {
        throw new ApiError(400, 'Token and new password is required')
    }

    if (!passwordPattern.test(newPassword)) {
        throw new ApiError(400, "Password should be 8 characters long")
    }

    // step 2: decode the resetToken and get the userId, randomToken

    const decodedToken = jwt.verify(resetToken, process.env.PASSWORD_RESET_TOKEN_SECRET);

    if (!decodedToken) {
        throw new ApiError(400, "Invalid or expired reset token")
    }

    const { userId, randomToken } = decodedToken;

    // step 3: find the user from db

    const user = await User.findById(userId);

    if (!user) {
        throw new ApiError(400, 'User not found')
    }

    // step 4: verify if the stored hashed token matches the provided one and check if it is expired

    const hashedToken = crypto.createHash("sha256").update(randomToken).digest("hex");

    if (user.passwordResetToken !== hashedToken || user.passwordResetTokenExpiry < Date.now()) {
        throw new ApiError(400, "Token is invalid or expired")
    }

    // step 5: set the new password, clear the reset password fields and save user

    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetTokenExpiry = undefined;

    await user.save();

    // step 6: return response
    return res
        .status(200)
        .json(
            new ApiResponse(
                201,
                {},
                "Password reset successful"
            )
        )
})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    sendResetPasswordLink,
    resetPassword,
    verifyEmail
}

























