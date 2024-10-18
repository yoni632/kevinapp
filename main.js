// app.js (Node.js with Express and Socket.IO)
const express = require('express');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server); // Initialize Socket.IO
const PORT = 5000;

app.use(cors({
    origin: '*', // Allow all origins
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],
}));

// Configure Multer for file uploads
const storage = multer.diskStorage({
    destination: './uploads/',
    filename: (req, file, cb) => {
        cb(null, `imageFile-${Date.now()}${path.extname(file.originalname)}`);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 5MB file size limit
}).single('photo');  // Accept a single file under the field name 'photo'

// Serve static files from the uploads directory
app.use('/uploads', express.static('uploads'));

// Handle file uploads and notify all connected clients of the new image
app.post('/upload', (req, res) => {
    upload(req, res, function (err) {
        if (err instanceof multer.MulterError) {
            return res.status(400).json({ error: 'File size exceeds limit of 5MB' });
        } else if (err) {
            return res.status(500).json({ error: err.message });
        }

        if (req.file) {
            const imageUrl = `http://localhost:${PORT}/uploads/${req.file.filename}`;

            // Notify all connected clients about the new image
            io.emit('new-image', imageUrl);

            return res.json({ filepath: imageUrl });
        } else {
            return res.status(400).json({ message: 'No file uploaded.' });
        }
    });
});

// WebSocket connection handler
io.on('connection', (socket) => {
    console.log('A user connected');
    socket.on('disconnect', () => {
        console.log('A user disconnected');
    });
});

// Start the server
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
