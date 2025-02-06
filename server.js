const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const authRoutes = require("./routes/auth");
const messagesRoutes = require("./routes/messages");

dotenv.config();
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
    },
});

app.use(cors());
app.use(express.json());
app.use(express.static("views"));

app.use("/api/auth", authRoutes);
app.use("/api/messages", messagesRoutes);

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB Atlas connected successfully"))
    .catch((err) => console.error("MongoDB connection error:", err));

require("./routes/chat_auth")(io);  // Pass the shared io instance to the chat_auth module

const PORT = process.env.PORT;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
