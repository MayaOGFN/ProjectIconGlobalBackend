const express = require('express');
const { v4: uuidv4 } = require('uuid');
const WebSocket = require('ws');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public'));

// --- OGFN DATABASE (MOCK) ---
let users = [];
let serversActive = { backend: true, gameserver: false };

// --- FORTNITE API ENDPOINTS ---

// 1. OAuth Token (What the game calls to login)
app.post('/account/api/oauth/token', (req, res) => {
    res.json({
        access_token: uuidv4(),
        expires_in: 28800,
        token_type: "bearer",
        account_id: "ogfn_user_id"
    });
});

// 2. Cloudstorage (Where settings are stored)
app.get('/fortnite/api/cloudstorage/system', (req, res) => {
    res.json([]); // Return empty array or your custom config files
});

// 3. Profiles (The most important part for skins/vbucks)
app.post('/fortnite/api/game/v2/profile/:accountId/client/:command', (req, res) => {
    res.json({
        profileRevision: 1,
        profileId: req.params.command.replace('QueryProfile', 'athena'),
        profileChanges: []
    });
});

// --- DEV & GAME SERVER LOGIC ---

app.post('/api/dev-login', (req, res) => {
    if (req.body.token === 'testerdev') return res.json({ success: true });
    res.status(401).send();
});

// --- XMPP SERVER (Lobby/Friends) ---
// Note: Fortnite uses port 5222 for TCP XMPP, but on Render we use WebSockets (WS)
const wss = new WebSocket.Server({ noServer: true });

wss.on('connection', (ws) => {
    console.log('Client connected to XMPP');
    ws.on('message', (message) => {
        // Handle XMPP Stanzas (presence, iq, message)
        console.log('Received XMPP Stanza:', message.toString());
    });
});

// Start Server
const server = app.listen(PORT, () => {
    console.log(`OGFN Backend Running at: https://globalprojecticon-backend-dev-test.onrender.com`);
});

// Handle WebSocket Upgrades
server.on('upgrade', (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
    });
});
