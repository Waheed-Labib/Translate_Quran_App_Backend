import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware";
import { addTranslation, deleteTranslation, editTranslation } from "../controllers/translation.controllers";

const router = Router();

router.route('/add-translation').post(verifyJWT, addTranslation);
router.route('/edit-translation').post(verifyJWT, editTranslation);
router.route('/delete-translation').post(verifyJWT, deleteTranslation);

export default router;