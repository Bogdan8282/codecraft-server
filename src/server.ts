import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import postRoutes from "./routes/postRoutes"
import dotenv from "dotenv";
import { clerkMiddleware } from "@clerk/express";

dotenv.config();

const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN || "http://localhost:5173" }));
app.use(express.json());
app.use(clerkMiddleware());

const PORT = process.env.PORT || 5000;

const MONGO_URI = process.env.MONGO_URI

if (!MONGO_URI) {
  throw new Error('MONGO_URI не знайдено в змінних середовища');
}

mongoose
  .connect(MONGO_URI)
  .then(() => console.log("MongoDB підключено"))
  .catch((err) => console.error("Помилка MongoDB:", err));

app.use("/api/posts", postRoutes);

app.listen(PORT, () => {
  console.log(`Сервер запущено на http://localhost:${PORT}`);
});
