import mongoose, { Schema, Document } from 'mongoose';

export interface IConcept extends Document {
  topicId: mongoose.Types.ObjectId;
  code: string;
  title: string;
  shortDescription: string;
  orderIndex: number;
  estimatedMinutes: number;
  createdAt: Date;
  updatedAt: Date;
}

const ConceptSchema = new Schema<IConcept>(
  {
    topicId: {
      type: Schema.Types.ObjectId,
      ref: 'Topic',
      required: true,
      index: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    shortDescription: {
      type: String,
      required: true,
    },
    orderIndex: {
      type: Number,
      required: true,
    },
    estimatedMinutes: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Concept = mongoose.model<IConcept>('Concept', ConceptSchema);