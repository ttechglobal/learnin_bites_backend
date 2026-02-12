import mongoose, { Schema, Document } from 'mongoose';

export interface ISubject extends Document {
  code: string;
  name: string;
  category: string;
  level: string;
  description: string;
  version: string;
  boardsSupported: string[];
  createdAt: Date;
  updatedAt: Date;
}

const SubjectSchema = new Schema<ISubject>(
  {
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
    category: {
      type: String,
      required: true,
    },
    level: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    version: {
      type: String,
      required: true,
    },
    boardsSupported: {
      type: [String],
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Subject = mongoose.model<ISubject>('Subject', SubjectSchema);