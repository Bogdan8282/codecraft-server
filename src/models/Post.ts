import mongoose, { Schema, Document } from 'mongoose';

export interface IPost extends Document {
  title: string;
  content: string;
  imageURL: string;
  createdAt: Date;
  authorId: string;
  likes: string[];
  dislikes: string[];
}

const PostSchema: Schema = new Schema({
  title: { type: String, required: true, trim: true },
  content: { type: String, required: true },
  imageURL: {
    type: String,
    default: () => {
      const randomSeed = Math.random().toString(36).substring(7);
      return `https://api.dicebear.com/9.x/shapes/svg?seed=${randomSeed}`;
    }
  },
  createdAt: { type: Date, default: Date.now },
  authorId: { type: String, required: true },
  likes: { type: [String], default: [] },
  dislikes: { type: [String], default: [] }
});

export default mongoose.model<IPost>('Post', PostSchema);