const express = require('express');
const { v4: uuidv4 } = require('uuid');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();
const rooms = new Map();

router.post('/create', authMiddleware, (req, res) => {
  const { name } = req.body;
  const roomId = uuidv4().split('-')[0].toUpperCase();
  const room = {
    id: roomId,
    name: name || `Room ${roomId}`,
    host: req.user.id,
    createdAt: new Date().toISOString(),
    participants: [],
  };
  rooms.set(roomId, room);
  res.json({ room });
});

router.get('/:roomId', authMiddleware, (req, res) => {
  const room = rooms.get(req.params.roomId.toUpperCase());
  if (!room) return res.status(404).json({ error: 'Room not found' });
  res.json({ room });
});

router.post('/join', authMiddleware, (req, res) => {
  const { roomId } = req.body;
  const room = rooms.get(roomId.toUpperCase());
  if (!room) return res.status(404).json({ error: 'Room not found' });
  res.json({ room });
});

module.exports = router;
