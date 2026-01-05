if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const axios = require('axios');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const NodeCache = require('node-cache');

// 1. INITIALIZE APP
const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'bookjourney_secret_key';




// List all domains that are allowed to talk to your backend
const allowedOrigins = [
  'http://localhost:5173',                       // Your local frontend
  'https://bookheaven-yzm.vercel.app'
  'https://yzm-software-engineering-project-git-main-memoryvoid1s-projects.vercel.app'       // <--- REPLACE WITH YOUR ACTUAL VERCEL URL
];

app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      // If the domain is not in the list above, block it
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true
}));
app.use(express.json());

// 🟢 NEW: Serve 'uploads' folder publicly so the frontend can display images
if (!fs.existsSync('./uploads')) {
    fs.mkdirSync('./uploads');
}
app.use('/uploads', express.static('uploads'));

// 3. DATABASE CONNECTION
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch(err => console.error('❌ DB Error:', err));

// 4. DATA MODELS

// User Model (Updated with avatarUrl)
const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    avatarUrl: { type: String, default: '' } // 🟢 New Field
});
const User = mongoose.model('User', UserSchema);

// Book Model
const BookSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    googleBookId: String,
    title: { type: String, required: true },
    author: { type: String },
    coverUrl: { type: String },
    status: { type: String, enum: ['To Read', 'Reading', 'Read'], default: 'To Read' },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    comment: { type: String, default: '' }
});
const Book = mongoose.model('Book', BookSchema);

// 5. MULTER CONFIGURATION (For File Uploads)
const storage = multer.memoryStorage();

// 3. CONFIGURE UPLOAD WITH LIMITS
// MongoDB documents have a size limit, so let's restrict images to 5MB
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});


// 6. AUTH MIDDLEWARE
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: "Access denied" });

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) return res.status(403).json({ error: "Invalid token" });
        req.user = decoded; // { userId: '...', username: '...' }
        next();
    });
};

// ================= ROUTES =================

// --- AUTHENTICATION ---

// Register
app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ username, password: hashedPassword });
        await newUser.save();
        res.status(201).json({ message: "Registered successfully" });
    } catch (err) {
        res.status(400).json({ error: "Username already exists" });
    }
});

// Login (Updated to return avatarUrl)
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });
        
        if (user && await bcrypt.compare(password, user.password)) {
            const token = jwt.sign(
                { userId: user._id, username: user.username }, 
                JWT_SECRET, 
                { expiresIn: '24h' }
            );
            
            // 🟢 Send avatarUrl back so frontend can cache it immediately
            res.json({ 
                token, 
                username: user.username,
                avatarUrl: user.avatarUrl 
            });
        } else {
            res.status(401).json({ error: "Invalid credentials" });
        }
    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
});


// 🟢 NEW ROUTE: Upload Avatar (Base64 to Database)
app.post('/api/auth/avatar', authenticateToken, upload.single('avatar'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: "No file uploaded" });

        // 1. Convert Buffer to Base64 String
        // This creates a string like: "data:image/jpeg;base64,/9j/4AAQSk..."
        const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;

        // 2. Save the HUGE string directly to MongoDB
        // We reuse the 'avatarUrl' field, but now it holds data, not a link.
        await User.findByIdAndUpdate(req.user.userId, { avatarUrl: base64Image });

        // 3. Send back the data string so frontend can display it immediately
        res.json({ message: "Avatar updated", avatarUrl: base64Image });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Upload failed" });
    }
});

// --- SEARCH (Google Books Proxy) ---
const searchCache = new NodeCache({ stdTTL: 3600 }); // Cache for 1 hour

app.get('/api/search', async (req, res) => {
    const query = req.query.query;
    if (!query) return res.status(400).json({ error: "Query required" });

    // Check Cache
    if (searchCache.has(query)) {
        return res.json(searchCache.get(query));
    }

    try {
        // Use API Key if available in .env, otherwise public access
        const apiKeyParam = process.env.GOOGLE_API_KEY ? `&key=${process.env.GOOGLE_API_KEY}` : '';
        const url = `https://www.googleapis.com/books/v1/volumes?q=${query}${apiKeyParam}`;
        
        const response = await axios.get(url);
        const books = response.data.items || [];
        
        searchCache.set(query, books);
        res.json(books);
    } catch (err) {
        res.status(500).json({ error: "Search failed" });
    }
});

// --- COLLECTION MANAGEMENT ---

// Get My Books
app.get('/api/books', authenticateToken, async (req, res) => {
    try {
        const books = await Book.find({ userId: req.user.userId });
        res.json(books);
    } catch (err) {
        res.status(500).json({ error: "Fetch failed" });
    }
});

// Add Book
app.post('/api/books/add', authenticateToken, async (req, res) => {
    try {
        const newBook = new Book({
            ...req.body,
            userId: req.user.userId // Link to logged-in user
        });
        await newBook.save();
        res.status(201).json(newBook);
    } catch (err) {
        res.status(500).json({ error: "Add failed" });
    }
});

// Update Book (Rating, Status, Comments)
app.patch('/api/books/:id', authenticateToken, async (req, res) => {
    try {
        const updatedBook = await Book.findOneAndUpdate(
            { _id: req.params.id, userId: req.user.userId },
            req.body,
            { new: true }
        );
        res.json(updatedBook);
    } catch (err) {
        res.status(500).json({ error: "Update failed" });
    }
});

// Delete Book
app.delete('/api/books/:id', authenticateToken, async (req, res) => {
    try {
        await Book.findOneAndDelete({ _id: req.params.id, userId: req.user.userId });
        res.json({ message: "Deleted" });
    } catch (err) {
        res.status(500).json({ error: "Delete failed" });
    }
});

// Rankings (Sorted by Rating)
app.get('/api/books/rankings', authenticateToken, async (req, res) => {
    try {
        const books = await Book.find({ userId: req.user.userId }).sort({ rating: -1 });
        res.json(books);
    } catch (err) {
        res.status(500).json({ error: "Fetch rankings failed" });
    }
});

// 7. START SERVER
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});