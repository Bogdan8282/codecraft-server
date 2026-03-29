import express, {Request, Response} from "express";
import Post, { IPost } from "../models/Post";
import { getAuth } from "@clerk/express";

const router = express.Router();

// Створити новий пост
router.post("/", async (req: any, res: any) => {   // можна прибрати requireAuth()
  console.log("Received body:", req.body);
  console.log("AUTH object:", req.auth);           // подивись весь об'єкт

  const { userId } = getAuth(req);                 // ← правильний спосіб

  if (!userId) {
    return res.status(401).json({ message: "Не авторизовано" });
  }

  console.log("userId from Clerk:", userId);

  try {
    const post: IPost = new Post({
      ...req.body,
      authorId: userId
    });

    await post.save();
    res.status(201).json(post);
  } catch (err: any) {
    console.error("Create post error:", err);
    res.status(400).json({
      message: err.message,
      errors: err.errors
    });
  }
});

// Отримати всі пости
router.get("/", async (req: Request, res: Response) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 });
    res.json(posts);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// Отримати один пост за ID
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Пост не знайдено" });
    res.json(post);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// router.get("/api/dashboard", requireAuth(), async (req: Request, res: Response) => {

//   const posts = await Post.find({
//     authorId: req.auth.userId
//   });

//   res.json(posts);
// });

export default router;
