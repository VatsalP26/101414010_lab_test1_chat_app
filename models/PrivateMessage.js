const mongoose = require('mongoose');

const PrivateMessageSchema = new mongoose.Schema({
    from_user: { type: String, required: true },
    to_user: { type: String, required: true },
    message: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model('PrivateMessage', PrivateMessageSchema);
