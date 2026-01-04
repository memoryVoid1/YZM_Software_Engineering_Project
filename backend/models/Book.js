const mongoose = require('mongoose');

const BookSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    author: { type: String },
    coverUrl: { type: String },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    status: { type: String, enum: ['Read', 'Reading', 'To Read'], default: 'To Read' }
});

module.exports = mongoose.model('Book', BookSchema);