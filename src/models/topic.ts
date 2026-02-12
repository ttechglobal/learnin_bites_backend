import mongoose, { Schema, Document } from 'mongoose';

export interface ITopic extends Document {
  subjectId: mongoose.Types.ObjectId;
  code: string;
  name: string;
  description: string;
  orderIndex: number;
  createdAt: Date;
  updatedAt: Date;
}

const TopicSchema = new Schema<ITopic>(
  {
    subjectId: {
      type: Schema.Types.ObjectId,
      ref: 'Subject',
      required: true,
      index: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    orderIndex: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Topic = mongoose.model<ITopic>('Topic', TopicSchema);