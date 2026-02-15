import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import http from "http";
import { connectDB } from "./lib/db.js";

const app = express();
dotenv.config();

app.use(cors());
app.use(express.json({limit: "4mb"}));

const server = http.createServer(app);

app.get("/api/status", (req, res) => {
  res.send("server is live");
});

await connectDB();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});