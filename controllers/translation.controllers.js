import { Translation } from "../models/translation.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getTranslation = asyncHandler(async (req, res) => {
    const { translatorId, verse_key } = req.query;

    const translation = await Translation.findOne({
        translator: translatorId,
        verse_key
    })

    if (!translation) {
        throw new ApiError(400, "Translation not found")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                201,
                translation,
                "Get translation successful"
            )
        )
})

const addTranslation = asyncHandler(async (req, res) => {

    const { translatorId, verse_key, language, content } = req.body;
    const user = req.user;

    if (user._id.toString() !== translatorId) {
        throw new ApiError(403, "Unauthorized access")
    }

    const alreadyExists = await Translation.findOne({
        translator: translatorId,
        verse_key
    })

    if (alreadyExists) {
        throw new ApiError(401, "Translation already exists.")
    }

    const translation = await Translation.create({
        translator: translatorId,
        verse_key,
        language,
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
    const { translatorId, translationId, verse_key, language, content } = req.body;
    const user = req.user;

    if (user._id.toString() !== translatorId) {
        throw new ApiError(403, "Unauthorized access")
    }

    const translation = await Translation.findById(translationId);

    if (!translation || translatorId !== translation.translator.toString() || verse_key !== translation.verse_key) {
        throw new ApiError(400, "Translation not found")
    }

    translation.language = language;
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