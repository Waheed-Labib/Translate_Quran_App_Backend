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
        translator: {
            type: Schema.Types.ObjectId,
            ref: "User"
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