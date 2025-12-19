const express = require('express');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const WebSocket = require('ws');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public'));

// --- OGFN SINGLEPLAYER CONFIG ---
const ACCOUNT_ID = "ogfn_dev_user";
const DISPLAY_NAME = "TesterDev";

// 1. AUTHENTICATION (Bypasses login for singleplayer)
app.post('/account/api/oauth/token', (req, res) => {
    res.json({
        access_token: uuidv4(),
        expires_in: 28800,
        token_type: "bearer",
        account_id: ACCOUNT_ID,
        displayName: DISPLAY_NAME
    });
});

app.get('/account/api/public/account/:accountId', (req, res) => {
    res.json({ id: ACCOUNT_ID, displayName: DISPLAY_NAME, externalAuths: [] });
});

// 2. PROFILE SYSTEM (Loads your Locker/Skins)
app.post('/fortnite/api/game/v2/profile/:accountId/client/:command', (req, res) => {
    const profileId = req.query.profileId || "athena";
    
    // Basic profile response to get you past the loading screen
    res.json({
        profileRevision: 1,
        profileId: profileId,
        profileChanges: [{
            changeType: "fullProfileUpdate",
            profile: {
                _id: ACCOUNT_ID,
                stats: { attributes: { level: 100, vbucks: 999999 } },
                items: {} // Add item IDs here to unlock specific skins
            }
        }],
        serverTime: new Date().toISOString()
    });
});

// 3. XMPP MOCK (Prevents Friends List errors)
const wss = new WebSocket.Server({ noServer: true });

wss.on('connection', (ws) => {
    // Send basic XMPP open stream
    ws.send(`<open xmlns="urn:ietf:params:xml:ns:xmpp-framing" from="fortnite-service.com" version="1.0" />`);
    
    ws.on('message', (msg) => {
        const data = msg.toString();
        // Automatically answer "IQ" requests so the game thinks the friends server is alive
        if (data.includes('iq')) {
            ws.send(`<iq type="result" id="${uuidv4()}" />`);
        }
    });
});

// 4. DEV TOGGLES
app.post('/api/dev-login', (req, res) => {
    if (req.body.token === 'testerdev') return res.json({ success: true });
    res.status(401).json({ success: false });
});

const server = app.listen(PORT, () => {
    console.log(`OGFN Singleplayer Backend: https://globalprojecticon-backend-dev-test.onrender.com`);
});

// Handle XMPP Upgrade
server.on('upgrade', (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
    });
});
