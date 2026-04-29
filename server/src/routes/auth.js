const express = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
const { generateToken } = require('../utils/jwtHelper');

const router = express.Router();
const USERS_FILE = path.join(__dirname, '../../data/users.json');

function readUsers() {
  if (!fs.existsSync(USERS_FILE)) {
    fs.mkdirSync(path.dirname(USERS_FILE), { recursive: true });
    fs.writeFileSync(USERS_FILE, JSON.stringify([]));
    return [];
  }
  return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
}

function writeUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

router.post('/register', async (req, res) => {
  try {
    const { username, email, password, displayName } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const users = readUsers();
    if (users.find((u) => u.email === email)) {
      return res.status(409).json({ error: 'Email already registered' });
    }
    if (users.find((u) => u.username === username)) {
      return res.status(409).json({ error: 'Username already taken' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const newUser = {
      id: uuidv4(),
      username,
      email,
      password: hashedPassword,
      displayName: displayName || username,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    writeUsers(users);

    const token = generateToken({ id: newUser.id, username: newUser.username, email: newUser.email, displayName: newUser.displayName });
    const { password: _, ...userWithoutPassword } = newUser;

    res.status(201).json({ token, user: userWithoutPassword });
  } catch (err) {
    res.status(500).json({ error: 'Registration failed', details: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const users = readUsers();
    const user = users.find((u) => u.email === email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken({ id: user.id, username: user.username, email: user.email, displayName: user.displayName });
    const { password: _, ...userWithoutPassword } = user;

    res.json({ token, user: userWithoutPassword });
  } catch (err) {
    res.status(500).json({ error: 'Login failed', details: err.message });
  }
});

router.get('/me', require('../middleware/authMiddleware'), (req, res) => {
  const users = readUsers();
  const user = users.find((u) => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const { password: _, ...userWithoutPassword } = user;
  res.json({ user: userWithoutPassword });
});

router.patch('/profile', require('../middleware/authMiddleware'), async (req, res) => {
  try {
    const { displayName, bio, status, avatarStyle, avatarSeed, currentPassword, newPassword } = req.body;
    const users = readUsers();
    const idx = users.findIndex((u) => u.id === req.user.id);
    if (idx === -1) return res.status(404).json({ error: 'User not found' });

    const user = users[idx];

    if (newPassword) {
      if (!currentPassword) return res.status(400).json({ error: 'Current password required' });
      const valid = await bcrypt.compare(currentPassword, user.password);
      if (!valid) return res.status(401).json({ error: 'Current password is incorrect' });
      if (newPassword.length < 6) return res.status(400).json({ error: 'New password must be at least 6 characters' });
      users[idx].password = await bcrypt.hash(newPassword, 12);
    }

    if (displayName !== undefined) users[idx].displayName = displayName.trim() || user.displayName;
    if (bio !== undefined) users[idx].bio = bio.slice(0, 200);
    if (status !== undefined) users[idx].status = status;
    if (avatarStyle !== undefined) users[idx].avatarStyle = avatarStyle;
    if (avatarSeed !== undefined) users[idx].avatarSeed = avatarSeed;

    const seed = users[idx].avatarSeed || users[idx].username;
    const style = users[idx].avatarStyle || 'avataaars';
    users[idx].avatar = `https://api.dicebear.com/7.x/${style}/svg?seed=${seed}`;

    writeUsers(users);

    const { password: _, ...updated } = users[idx];
    res.json({ user: updated });
  } catch (err) {
    res.status(500).json({ error: 'Profile update failed', details: err.message });
  }
});

module.exports = router;
