const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    content: {
        type: String,
        required: true
    },
    tag: [{
        type: String,
        enum: ['Home work', 'Office work', 'Class work', 'Life work', 'Test',
            'Learning', 'Goals', 'Important', 'Idea', 'Reminder', 'Other'],
    }],
    color: {
        type: String,
        default: '#000000'
    },
    bgColor: {
        type: String,
        default: '#FFFFFF' // Background color, default white
    },
    images: [{
        url: { type: String },
        public_id: { type: String, required: true }
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    favorite: {
        type: Boolean,
        default: false
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Reference the User model
        required: true
    },
});

// Ensure updatedAt is updated whenever the note is modified
noteSchema.pre('save', function (next) {
    if (this.isModified()) {
        this.updatedAt = Date.now();
    }
    next();
});

module.exports = mongoose.model('Note', noteSchema);
