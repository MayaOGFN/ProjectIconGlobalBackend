const express = require('express');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const WebSocket = require('ws');

const app = express();
const PORT = process.env.PORT || 3000;

// 1. MIDDLEWARE
app.use(express.json());
// This tells Express to serve files (like index.html) from the root folder
app.use(express.static(__dirname)); 

// 2. HOMEPAGE ROUTE
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 3. OGFN DEV & AUTH SYSTEM
app.post('/api/dev-login', (req, res) => {
    const { token } = req.body;
    if (token === 'testerdev') {
        res.json({ success: true, message: "Dev Access Granted" });
    } else {
        res.status(401).json({ success: false, message: "Invalid Token" });
    }
});

// 4. FORTNITE API ENDPOINTS (Singleplayer)
// OAuth Token - The game calls this to log in
app.post('/account/api/oauth/token', (req, res) => {
    res.json({
        access_token: uuidv4(),
        expires_in: 28800,
        token_type: "bearer",
        account_id: "ogfn_dev_id",
        displayName: "TesterDev"
    });
});

// Profile System - Required to get past the loading screen/locker
app.post('/fortnite/api/game/v2/profile/:accountId/client/:command', (req, res) => {
    res.json({
        profileRevision: 1,
        profileId: req.query.profileId || "athena",
        profileChanges: [{
            changeType: "fullProfileUpdate",
            profile: { _id: "ogfn_dev_id", stats: { attributes: { level: 100, vbucks: 9999 } }, items: {} }
        }]
    });
});

// Matchmaker - Tells the game to play locally
app.get('/fortnite/api/matchmaking/session/matchmaking-session', (req, res) => {
    res.json({
        id: uuidv4(),
        ad: "127.0.0.1", 
        p: 7777 
    });
});

// 5. START SERVER
const server = app.listen(PORT, () => {
    console.log(`[OGFN] Backend active on port ${PORT}`);
    console.log(`URL: https://globalprojecticon-backend-dev-test.onrender.com`);
});

// 6. XMPP MOCK (For friends list/Lobby stability)
const wss = new WebSocket.Server({ noServer: true });

wss.on('connection', (ws) => {
    ws.send(`<open xmlns="urn:ietf:params:xml:ns:xmpp-framing" from="fortnite-service.com" version="1.0" />`);
    ws.on('message', (msg) => {
        if (msg.toString().includes('iq')) {
            ws.send(`<iq type="result" id="${uuidv4()}" />`);
        }
    });
});

// Upgrade HTTP to WebSocket for XMPP
server.on('upgrade', (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
    });
});
