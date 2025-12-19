const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to serve static files
app.use(express.static('public'));
app.use(express.json());

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Mock API Endpoints for your OGFN Devs
app.post('/api/register', (req, res) => {
    res.json({ status: "success", message: "Account created (Mock)" });
});

app.listen(PORT, () => {
    console.log(`OGFN Backend running on port ${PORT}`);
});
