import { Router } from "express";
import { loginUser, logoutUser, refreshAccessToken, registerUser, resetPassword, sendResetPasswordLink } from "../controllers/user.controllers.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route('/register').post(registerUser);
router.route('/login').post(loginUser);

// secured routes
router.route('/logout').post(verifyJWT, logoutUser)
router.route('/refresh-access-token').post(refreshAccessToken)
router.route('/reset-password-link').post(sendResetPasswordLink)
router.route('/reset-password').post(resetPassword)

export default router;