const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static('public'));
app.use(express.json());

// State variables (Reset when Render sleeps on Free Tier)
let backendActive = false;
let gameServerActive = false;

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// API for Dev Login
app.post('/api/dev-login', (req, res) => {
    const { token } = req.body;
    if (token === 'testerdev') {
        res.json({ success: true, message: "Welcome Dev" });
    } else {
        res.status(401).json({ success: false, message: "Invalid Dev Token" });
    }
});

// API to Toggle Servers
app.post('/api/toggle-server', (req, res) => {
    const { type } = req.body; // 'backend' or 'gs'
    if (type === 'backend') backendActive = !backendActive;
    if (type === 'gs') gameServerActive = !gameServerActive;
    
    res.json({ 
        backend: backendActive, 
        gs: gameServerActive, 
        msg: gameServerActive ? "cobalt.dll injected into FN" : "Servers stopped" 
    });
});

app.listen(PORT, () => console.log(`OGFN running on ${PORT}`));
