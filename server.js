const express = require('express');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const WebSocket = require('ws');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(__dirname)); 

// --- CONFIGURATION ---
const DEV_AUTH = { email: "Backend@dev.com", pass: "test", token: "testerdev" };
const PLAYER_DATA = {
    id: "OGFN_DEV_USER",
    name: "TesterDev",
    level: 100,
    vbucks: 999999
};

// 1. WEB LOGIN (Dashboard Access)
app.post('/api/dev-login', (req, res) => {
    const { email, password, token } = req.body;
    // Check for either the specific email/pass OR the dev token
    if ((email === DEV_AUTH.email && password === DEV_AUTH.pass) || token === DEV_AUTH.token) {
        return res.json({ success: true, user: PLAYER_DATA });
    }
    res.status(401).json({ success: false, message: "Invalid Credentials" });
});

// 2. FORTNITE OAUTH (Game Login)
app.post('/account/api/oauth/token', (req, res) => {
    res.json({
        access_token: uuidv4(),
        expires_in: 28800,
        token_type: "bearer",
        account_id: PLAYER_DATA.id,
        displayName: PLAYER_DATA.name
    });
});

// 3. ATHENA PROFILE (Skins & Stats)
app.post('/fortnite/api/game/v2/profile/:accountId/client/:command', (req, res) => {
    const profileId = req.query.profileId || "athena";
    
    res.json({
        profileRevision: 1,
        profileId: profileId,
        profileChanges: [{
            changeType: "fullProfileUpdate",
            profile: {
                _id: PLAYER_DATA.id,
                stats: { 
                    attributes: { 
                        level: PLAYER_DATA.level, 
                        template_id: "athena_dogfood_01",
                        vbucks: PLAYER_DATA.vbucks 
                    } 
                },
                items: {
                    "skin_renegade": {
                        templateId: "CosmeticVariant:AthenaCharacter:CID_028_Athena_Character_F_Retro",
                        attributes: { favorite: true }
                    }
                    // You can add more item IDs here
                }
            }
        }],
        serverTime: new Date().toISOString()
    });
});

// 4. MATCHMAKER
app.get('/fortnite/api/matchmaking/session/matchmaking-session', (req, res) => {
    res.json({ id: uuidv4(), ad: "127.0.0.1", p: 7777 });
});

// 5. SERVER START & XMPP
const server = app.listen(PORT, () => console.log(`Backend Live: ${PLAYER_DATA.name} mode.`));

const wss = new WebSocket.Server({ noServer: true });
wss.on('connection', (ws) => {
    ws.send(`<open xmlns="urn:ietf:params:xml:ns:xmpp-framing" from="fortnite-service.com" />`);
    ws.on('message', (msg) => { if (msg.toString().includes('iq')) ws.send(`<iq type="result" id="${uuidv4()}" />`); });
});
server.on('upgrade', (req, sock, head) => wss.handleUpgrade(req, sock, head, (ws) => wss.emit('connection', ws, req)));
