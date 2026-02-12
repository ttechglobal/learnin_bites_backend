import mongoose, { Schema, Document } from 'mongoose';

export interface ILessonSection extends Document {
  conceptId: mongoose.Types.ObjectId;
  sectionType: string;
  content: string;
  orderIndex: number;
  createdAt: Date;
}

const LessonSectionSchema = new Schema<ILessonSection>(
  {
    conceptId: {
      type: Schema.Types.ObjectId,
      ref: 'Concept',
      required: true,
      index: true,
    },
    sectionType: {
      type: String,
      required: true,
      enum: ['intro', 'explanation', 'example', 'formula', 'key_point', 'mistake', 'summary'],
    },
    content: {
      type: String,
      required: true,
    },
    orderIndex: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

export const LessonSection = mongoose.model<ILessonSection>('LessonSection', LessonSectionSchema);