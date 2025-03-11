import { ApiError } from "../utils/ApiError";

const addTranslation = () => {
    const { translatorId, verse_key, language, content } = req.body;
    const user = req.user;

    if (user._id !== translatorId) {
        throw new ApiError(400, "Unauthorized access")
    }
}

const editTranslation = () => {
    const { translatorId, translationId, verse_key, language, content } = req.body;
    const user = req.user;

    if (user._id !== translatorId) {
        throw new ApiError(400, "Unauthorized access")
    }
}

const deleteTranslation = () => {
    const { translatorId, translationId } = req.body;
    const user = req.user;

    if (user._id !== translatorId) {
        throw new ApiError(400, "Unauthorized access")
    }
}

export {
    addTranslation,
    editTranslation,
    deleteTranslation
}