require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const axios = require('axios');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const NodeCache = require('node-cache');
const searchCache = new NodeCache({ stdTTL: 3600 });

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'bookjourney_secret_2025';

app.use(cors());
app.use(express.json());

// Database Connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ MongoDB Connected'))
    .catch(err => console.error('❌ DB Connection Error:', err));

// Models
const User = mongoose.model('User', new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true }
}));

const Book = mongoose.model('Book', new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    title: String,
    author: String,
    coverUrl: String,
    status: { type: String, default: 'To Read' },
    rating: { type: Number, default: 0 },
    comment: { type: String, default: '' }
}));

// Auth Middleware
const authenticateToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: "Forbidden" });
        req.user = user;
        next();
    });
};

// Auth Routes
app.post('/api/auth/register', async (req, res) => {
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        const user = new User({ username: req.body.username, password: hashedPassword });
        await user.save();
        res.status(201).json({ message: "Registered" });
    } catch (err) { res.status(400).json({ error: "User already exists" }); }
});

app.post('/api/auth/login', async (req, res) => {
    const user = await User.findOne({ username: req.body.username });
    if (user && await bcrypt.compare(req.body.password, user.password)) {
        const token = jwt.sign({ userId: user._id, username: user.username }, JWT_SECRET);
        res.json({ token, username: user.username });
    } else { res.status(401).json({ error: "Invalid credentials" }); }
});

// Book Routes
app.get('/api/search', async (req, res) => {
    const query = req.query.query;
    if (!query) return res.status(400).json({ error: "Query required" });

    // 1. Check Cache First
    // If we have searched for this recently, return the stored result instantly.
    if (searchCache.has(query)) {
        console.log(`⚡ Serving '${query}' from Cache`); // Log for debugging
        return res.json(searchCache.get(query));
    }

    // 2. If not in cache, ask Google
    try {
        const apiKey = process.env.GOOGLE_API_KEY;
        const url = `https://www.googleapis.com/books/v1/volumes?q=${query}&key=${apiKey}`;
        
        const response = await axios.get(url);
        const books = response.data.items || [];

        // 3. Save result to Cache
        searchCache.set(query, books);
        console.log(`🌐 Fetched '${query}' from Google API`);
        
        res.json(books);
    } catch (err) {
        // Handle Google Rate Limits gracefully
        if (err.response && err.response.status === 429) {
            console.error("⚠️ Google API Rate Limit Hit");
            return res.status(429).json({ error: "Too many requests. Please try again later." });
        }
        res.status(500).json({ error: "Search failed" });
    }
});

app.post('/api/books/add', authenticateToken, async (req, res) => {
    const book = new Book({ ...req.body, userId: req.user.userId });
    await book.save();
    res.status(201).json(book);
});

app.get('/api/books/rankings', authenticateToken, async (req, res) => {
    const books = await Book.find({ userId: req.user.userId }).sort({ rating: -1 });
    res.json(books);
});

// UPDATE: Crucial for saving changes
app.patch('/api/books/:id', authenticateToken, async (req, res) => {
    try {
        const { status, rating, comment } = req.body;
        const updatedBook = await Book.findOneAndUpdate(
            { _id: req.params.id, userId: req.user.userId },
            { status, rating, comment },
            { new: true }
        );
        if (!updatedBook) return res.status(404).json({ error: "Book not found" });
        res.json(updatedBook);
    } catch (err) {
        res.status(500).json({ error: "Database update failed" });
    }
});

app.delete('/api/books/:id', authenticateToken, async (req, res) => {
    await Book.findOneAndDelete({ _id: req.params.id, userId: req.user.userId });
    res.json({ message: "Deleted" });
});

app.listen(PORT, () => console.log(`🚀 Server on port ${PORT}`));