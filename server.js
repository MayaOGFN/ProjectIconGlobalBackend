app.post('/api/auth', async (req, res) => {
    const { email, password, username, type } = req.body;

    // --- 1. DEV BYPASS (Fixes Backend Rejection) ---
    if (email === "Backend@dev.com" && password === "Test") {
        console.log("🛠️ Dev login detected. Bypassing database check.");
        return res.json({ 
            message: "Dev Login Success", 
            user: { 
                username: "DevUser", 
                playerId: "ICON_DEV_01", 
                selectedServer: "Auto" 
            } 
        });
    }

    // --- 2. NORMAL AUTH LOGIC ---
    try {
        if (type === 'register') {
            const existing = await User.findOne({ email });
            if (existing) return res.status(400).json({ message: "User exists" });

            const userData = {
                username, email, password,
                playerId: `ICON_${crypto.randomBytes(2).toString('hex')}`,
                selectedServer: "Auto"
            };
            const newUser = await User.create(userData);
            
            // Save to JSON
            const users = getJSONUsers();
            users.push(userData);
            fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));

            return res.json({ message: "Registered!", user: newUser });
        } else {
            // Login Check
            const user = await User.findOne({ email });
            if (user && user.password === password) {
                return res.json({ message: "Logged in!", user });
            }
            
            // Fallback to JSON
            const jsonUsers = getJSONUsers();
            const jsonUser = jsonUsers.find(u => u.email === email && u.password === password);
            if (jsonUser) return res.json({ message: "Logged in!", user: jsonUser });

            res.status(401).json({ message: "Invalid email or password" });
        }
    } catch (err) { 
        res.status(500).json({ message: "Server Error" }); 
    }
});
