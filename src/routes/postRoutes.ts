import express, { Request, Response } from "express";
import Post, { IPost } from "../models/Post";
import { getAuth } from "@clerk/express";
import { clerkClient } from "@clerk/clerk-sdk-node";
import Comment from "../models/Comment";

const router = express.Router();

router.get("/dashboard", async (req: any, res: any) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ message: "Не авторизовано" });

  try {
    const posts = await Post.find({ authorId: userId });
    res.json(posts);
  } catch (err) {
    console.error("Dashboard error:", err);
    res.status(500).json({ message: "Помилка при отриманні постів" });
  }
});

router.post("/", async (req: any, res: any) => {
  console.log("Received body:", req.body);
  console.log("AUTH object:", req.auth);

  const { userId } = getAuth(req);

  if (!userId) {
    return res.status(401).json({ message: "Не авторизовано" });
  }

  console.log("userId from Clerk:", userId);

  try {
    const post: IPost = new Post({
      ...req.body,
      authorId: userId,
    });

    await post.save();
    res.status(201).json(post);
  } catch (err: any) {
    console.error("Create post error:", err);
    res.status(400).json({
      message: err.message,
      errors: err.errors,
    });
  }
});

router.post("/:id/vote", async (req: any, res: any) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ message: "Не авторизовано" });

  const { type } = req.body; // 'like' або 'dislike'
  const { id } = req.params;

  try {
    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ message: "Пост не знайдено" });

    if (type === "like") {
      post.dislikes = post.dislikes.filter((uid) => uid !== userId);
      if (post.likes.includes(userId)) {
        post.likes = post.likes.filter((uid) => uid !== userId);
      } else {
        post.likes.push(userId);
      }
    } else {
      post.likes = post.likes.filter((uid) => uid !== userId);
      if (post.dislikes.includes(userId)) {
        post.dislikes = post.dislikes.filter((uid) => uid !== userId);
      } else {
        post.dislikes.push(userId);
      }
    }

    await post.save();
    res.json({ likes: post.likes.length, dislikes: post.dislikes.length });
  } catch (err) {
    res.status(500).json({ message: "Помилка сервера" });
  }
});

router.get("/", async (req: Request, res: Response) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 });

    const userIds = [...new Set(posts.map((p) => p.authorId))];

    const users = await clerkClient.users.getUserList({
      userId: userIds,
    });

    const userMap: any = {};
    users.forEach((user) => {
      userMap[user.id] = user;
    });

    // додаємо дані автора до постів
    const postsWithAuthors = posts.map((post) => ({
      ...post.toObject(),
      author: {
        name: userMap[post.authorId]?.firstName || "Unknown",
        avatar: userMap[post.authorId]?.imageUrl,
      },
    }));

    res.json(postsWithAuthors);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/:id/comments", async (req: Request, res: Response) => {
  try {
    const comments = await Comment.find({ postId: req.params.id }).sort({
      createdAt: -1,
    });

    if (comments.length === 0) {
      return res.json([]);
    }

    const userIds = [...new Set(comments.map((c) => c.authorId))];
    const users = await clerkClient.users.getUserList({ userId: userIds });

    const userMap: any = {};
    users.forEach((user) => {
      userMap[user.id] = user;
    });

    const commentsWithAuthors = comments.map((comment) => ({
      ...comment.toObject(),
      author: {
        name:
          userMap[comment.authorId]?.firstName +
            " " +
            (userMap[comment.authorId]?.lastName || "") || "Unknown",
        avatar: userMap[comment.authorId]?.imageUrl || null,
      },
    }));

    res.json(commentsWithAuthors);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ message: "Помилка при отриманні коментарів" });
  }
});

router.post("/:id/comments", async (req: any, res: any) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ message: "Не авторизовано" });

  const { content } = req.body;
  if (!content?.trim()) {
    return res
      .status(400)
      .json({ message: "Текст коментаря не може бути порожнім" });
  }

  try {
    const comment = new Comment({
      postId: req.params.id,
      authorId: userId,
      content: content.trim(),
    });

    await comment.save();
    res.status(201).json(comment);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ message: "Помилка при створенні коментаря" });
  }
});

router.delete("/comment/:id", async (req: any, res: any) => {
  const { userId } = getAuth(req);

  if (!userId) {
    return res.status(401).json({ message: "Не авторизовано" });
  }

  const comment = await Comment.findById(req.params.id);

  if (!comment) {
    return res.status(404).json({ message: "Коментар не знайдено" });
  }

  if (comment.authorId !== userId) {
    return res.status(403).json({ message: "Немає доступу" });
  }

  await comment.deleteOne();
  res.json({ message: "Коментар видалено" });
});

// має бути в кінці
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Пост не знайдено" });
    const userId = post.authorId;
    const user = await clerkClient.users.getUser(userId);
    const fullInfo = {
      ...post.toObject(),
      author: {
        name: user?.firstName || "Unknown",
        avatar: user?.imageUrl || null,
      },
    };
    res.json(fullInfo);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

router.delete("/:id", async (req: any, res: any) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ message: "Не авторизовано" });

  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Пост не знайдено" });

    if (post.authorId !== userId) {
      return res
        .status(403)
        .json({ message: "Ви не можете видалити чужий пост" });
    }

    await Post.findByIdAndDelete(req.params.id);
    res.json({ message: "Пост успішно видалено" });
  } catch (err) {
    res.status(500).json({ message: "Помилка сервера" });
  }
});

export default router;
