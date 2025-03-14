import mongoose, { mongo, Schema } from "mongoose";

const translationSchema = new Schema(
    {
        content: {
            type: String,
            required: [true, 'Content is required'],
            trim: true
        },
        language: {
            type: String,
            required: [true, 'Language is required']
        },
        translatorId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        translatorName: {
            type: String,
            required: true
        },

        verse_key: {
            type: String,
            required: [true, 'Verse_key is required']
        }
    },
    {
        timestamps: true
    }
)

export const Translation = mongoose.model('Translation', translationSchema)