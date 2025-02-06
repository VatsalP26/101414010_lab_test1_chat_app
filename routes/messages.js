const express = require('express');
const GroupMessage = require('../models/GroupMessage');
const PrivateMessage = require('../models/PrivateMessage');
const verifyToken = require('./authMiddleware');
const router = express.Router();

router.get('/group/:room', verifyToken, async (req, res) => {
    try {
        const messages = await GroupMessage.find({ room: req.params.room });
        res.json(messages);
    } catch (err) {
        res.status(500).json({ msg: 'Server error' });
    }
});

router.get('/private/:user1/:user2', verifyToken, async (req, res) => {
    try {
        const messages = await PrivateMessage.find({
            $or: [
                { from_user: req.params.user1, to_user: req.params.user2 },
                { from_user: req.params.user2, to_user: req.params.user1 }
            ]
        });
        res.json(messages);
    } catch (err) {
        res.status(500).json({ msg: 'Server error' });
    }
});

router.post('/group', verifyToken, async (req, res) => {
    const { from_user, room, message } = req.body;

    try {
        const newMessage = new GroupMessage({ from_user, room, message });
        await newMessage.save();
        res.status(201).json({ msg: "Message sent", message: newMessage });
    } catch (err) {
        res.status(500).json({ msg: "Server error" });
    }
});

router.post('/private', verifyToken, async (req, res) => {
    const { from_user, to_user, message } = req.body;

    try {
        const newMessage = new PrivateMessage({ from_user, to_user, message });
        await newMessage.save();
        res.status(201).json({ msg: "Private message sent", message: newMessage });
    } catch (err) {
        res.status(500).json({ msg: "Server error" });
    }
});

module.exports = router;
