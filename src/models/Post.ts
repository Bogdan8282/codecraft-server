import mongoose, { Schema, Document } from 'mongoose';

export interface IPost extends Document {
  title: string;
  content: string;
  createdAt: Date;
  authorId: string;
  likes: string[];
  dislikes: string[];
}

const PostSchema: Schema = new Schema({
  title: { type: String, required: true, trim: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  authorId: { type: String, required: true },
  likes: { type: [String], default: [] },
  dislikes: { type: [String], default: [] }
});

export default mongoose.model<IPost>('Post', PostSchema);