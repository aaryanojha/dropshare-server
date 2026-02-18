const mongoose = require("mongoose");

const SessionSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    index: true,
  },
  type: {
    type: String,
    enum: ["text", "link", "file"],
    required: true,
  },
  data: {
    type: mongoose.Schema.Types.Mixed, // 🔥 KEY FIX
    required: true,
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: 0 }, // TTL
  },
});

module.exports = mongoose.model("Session", SessionSchema);
