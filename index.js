require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const Session = require("./models/Session");

const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();

/* ======================
   MIDDLEWARE
====================== */
app.use(express.json());

app.use(cors());


/* ======================
   MONGODB
====================== */
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error(err.message));

/* ======================
   UPLOADS FOLDER
====================== */
const uploadDir = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
  console.log("📁 uploads folder created");
}

/* ======================
   MULTER (DISK STORAGE)
====================== */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName =
      Date.now() + "-" + Math.random().toString(36).substring(2);
    cb(null, uniqueName + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});

/* ======================
   TEST ROUTE
====================== */
app.get("/", (req, res) => {
  res.send("DropShare backend running");
});

/* ======================
   TEXT SHARE
====================== */
app.post("/api/text", async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: "Text required" });

  const code = Math.random().toString(36).substring(2, 8);

  await Session.create({
    code,
    type: "text",
    data: text,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000),
  });

  res.json({ code });
});

app.get("/api/text/:code", async (req, res) => {
  const session = await Session.findOne({
    code: req.params.code,
    type: "text",
  });

  if (!session)
    return res.status(404).json({ error: "Invalid or expired" });

  await Session.deleteOne({ _id: session._id });
  res.json({ text: session.data });
});

/* ======================
   LINK SHARE
====================== */
app.post("/api/link", async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: "URL required" });

  const code = Math.random().toString(36).substring(2, 8);

  await Session.create({
    code,
    type: "link",
    data: url,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000),
  });

  res.json({ code });
});

app.get("/api/link/:code", async (req, res) => {
  const session = await Session.findOne({
    code: req.params.code,
    type: "link",
  });

  if (!session)
    return res.status(404).json({ error: "Invalid or expired" });

  await Session.deleteOne({ _id: session._id });
  res.json({ url: session.data });
});

/* ======================
   FILE UPLOAD (LOCAL)
====================== */
app.post("/api/file", upload.single("file"), async (req, res) => {
  if (!req.file)
    return res.status(400).json({ error: "No file uploaded" });

  console.log("📦 Saved file:", req.file.path);

  const code = Math.random().toString(36).substring(2, 8);

  await Session.create({
    code,
    type: "file",
    data: {
      path: path.resolve(req.file.path), // absolute path
      name: req.file.originalname,
      size: req.file.size,
      mime: req.file.mimetype,
    },
    expiresAt: new Date(Date.now() + 5 * 60 * 1000),
  });

  res.json({ code });
});

/* ======================
   FILE DOWNLOAD (ONE-TIME)
====================== */
app.get("/api/file/:code", async (req, res) => {
  const session = await Session.findOne({
    code: req.params.code,
    type: "file",
  });

  if (!session)
    return res.status(404).json({ error: "Invalid or expired" });

  const filePath = session.data.path;
  const originalName = session.data.name;

  console.log("⬇️ Downloading:", filePath);

  if (!fs.existsSync(filePath)) {
    await Session.deleteOne({ _id: session._id });
    return res.status(404).json({ error: "File not found on server" });
  }

  res.download(filePath, originalName, async () => {
    fs.unlinkSync(filePath);
    await Session.deleteOne({ _id: session._id });
    console.log("🗑️ File deleted after download");
  });
});

/* ======================
   START SERVER
====================== */
const PORT = process.env.PORT || 5000
app.listen(PORT, () =>
  console.log(`Server running on ${PORT}`)
);
