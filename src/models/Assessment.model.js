import mongoose from 'mongoose';

const AssessmentSchema = new mongoose.Schema({
    userId: {
        type: String, // User's unique ID
        required: true,
    },
    question: {
        type: String,
        required: true,
    },
    grammarRating: {
        type: Number, // Grammar rating as an integer
        required: true,
    },
    speakingRate: {
        type: Number, // Speaking rate as an integer
        required: true,
    },
    word_clarity: {
        type: Number, // Word clarity percentage
        required: true,
    },
    phonetic_accuracy: {
        type: Number, // Phonetic accuracy percentage
        required: true,
    },
    filler_word_usage: {
        type: Number, // Number of filler words used
        required: true,
    },
    feedback: {
        type: [String], // Array of feedback strings
        required: true,
    },
    originalText: {
        type: String,
        required: true,
    },
    correctedText: {
        type: String,
        required: true,
    },
    pause_pattern: {
        type: [Number], // Array of pause pattern durations
        required: true,
    },
    videoLink: {
        type: String, // Link to the recorded video
        required: true,
    },
    language: {
        type: String, // Language code (e.g., "en-IN")
        required: true,
    },
});

export const Assessment = mongoose.model("Assessment", AssessmentSchema);