import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { addTranslation, deleteTranslation, editTranslation, getTranslation } from "../controllers/translation.controllers.js";

const router = Router();

router.route('/get-translation').get(getTranslation);
router.route('/add-translation').post(verifyJWT, addTranslation);
router.route('/edit-translation').post(verifyJWT, editTranslation);
router.route('/delete-translation').post(verifyJWT, deleteTranslation);

export default router;