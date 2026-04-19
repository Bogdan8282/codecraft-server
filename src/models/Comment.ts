import mongoose, { Schema, Document } from 'mongoose';

export interface IComment extends Document {
  postId: string;
  authorId: string;
  content: string;
  createdAt: Date;
}

const CommentSchema: Schema = new Schema({
  postId: { type: String, required: true, index: true },
  authorId: { type: String, required: true },
  content: { type: String, required: true, trim: true, maxlength: 1000 },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<IComment>('Comment', CommentSchema);