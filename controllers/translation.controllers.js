import { Translation } from "../models/translation.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getTranslation = asyncHandler(async (req, res) => {
    const { verse_key } = req.query;

    const translations = await Translation.find({
        verse_key: verse_key
    })

    return res
        .status(200)
        .json(
            new ApiResponse(
                201,
                translations,
                "Get translation successful"
            )
        )
})

const addTranslation = asyncHandler(async (req, res) => {

    const { translatorId, translatorName, verse_key, content } = req.body;
    const user = req.user;

    if (user._id.toString() !== translatorId) {
        throw new ApiError(403, "Unauthorized access")
    }

    const idMatchesName = user.fullName === translatorName;

    if (!idMatchesName) {
        throw new ApiError(400, "Unauthorized Access.")
    }

    const alreadyExists = await Translation.findOne({
        translatorId: translatorId,
        verse_key
    })

    if (alreadyExists) {
        throw new ApiError(401, "Translation already exists.")
    }

    const translation = await Translation.create({
        translatorId,
        translatorName,
        verse_key,
        content
    })

    return res
        .status(200)
        .json(
            new ApiResponse(
                201,
                translation,
                'Translation added successfully'
            )
        )
})

const editTranslation = asyncHandler(async (req, res) => {
    const { translatorId, translatorName, translationId, verse_key, content } = req.body;
    const user = req.user;

    if (user._id.toString() !== translatorId) {
        throw new ApiError(403, "Unauthorized access")
    }

    const translation = await Translation.findById(translationId);

    if (!translation || translatorId !== translation.translatorId.toString() || translatorName !== translation.translatorName.toString() || verse_key !== translation.verse_key) {
        throw new ApiError(400, "Translation not found")
    }

    translation.content = content;

    await translation.save();

    return res
        .status(200)
        .json(
            new ApiResponse(
                201,
                translation,
                "Edit translation successful"
            )
        )
})

const deleteTranslation = asyncHandler(async (req, res) => {
    const { translatorId, translationId } = req.body;
    const user = req.user;

    if (user._id.toString() !== translatorId) {
        throw new ApiError(403, "Unauthorized access")
    }

    await Translation.findByIdAndDelete(translationId)

    return res
        .status(200)
        .json(
            new ApiResponse(
                201,
                {},
                'Translation deleted successfully'
            )
        )
})

export {
    getTranslation,
    addTranslation,
    editTranslation,
    deleteTranslation
}