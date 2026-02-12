import mongoose, { Schema, Document } from 'mongoose';

export interface IPastQuestion extends Document {
  examBoard: string;
  subjectCode: string;
  year: number;
  questionNumber: number;
  topicCode?: string;
  conceptCode?: string;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: string;
  explanation: string;
  difficulty: string;
  createdAt: Date;
}

const PastQuestionSchema = new Schema<IPastQuestion>(
  {
    examBoard: {
      type: String,
      required: true,
      index: true,
    },
    subjectCode: {
      type: String,
      required: true,
      index: true,
    },
    year: {
      type: Number,
      required: true,
      index: true,
    },
    questionNumber: {
      type: Number,
      required: true,
    },
    topicCode: {
      type: String,
      required: false,
    },
    conceptCode: {
      type: String,
      required: false,
    },
    questionText: {
      type: String,
      required: true,
    },
    optionA: {
      type: String,
      required: true,
    },
    optionB: {
      type: String,
      required: true,
    },
    optionC: {
      type: String,
      required: true,
    },
    optionD: {
      type: String,
      required: true,
    },
    correctAnswer: {
      type: String,
      required: true,
      enum: ['A', 'B', 'C', 'D'],
    },
    explanation: {
      type: String,
      required: true,
    },
    difficulty: {
      type: String,
      required: true,
      enum: ['easy', 'medium', 'hard'],
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Compound index for efficient querying
PastQuestionSchema.index({ examBoard: 1, subjectCode: 1, year: 1 });

export const PastQuestion = mongoose.model<IPastQuestion>('PastQuestion', PastQuestionSchema);