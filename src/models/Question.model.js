import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
    text: { type: String, required: true }, // Question text
    difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], default: 'Medium' },
    category: { type: String, required: true }, // Category (e.g., 'General', 'Technical', etc.)
    createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('Question', questionSchema);
