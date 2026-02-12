import mongoose, { Schema, Document } from 'mongoose';

export interface IConceptQuestion extends Document {
  conceptId: mongoose.Types.ObjectId;
  code: string;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: string;
  difficulty: string;
  hint?: string;
  explanation: string;
  createdAt: Date;
}

const ConceptQuestionSchema = new Schema<IConceptQuestion>(
  {
    conceptId: {
      type: Schema.Types.ObjectId,
      ref: 'Concept',
      required: true,
      index: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      index: true,
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
    difficulty: {
      type: String,
      required: true,
      enum: ['easy', 'medium', 'hard'],
    },
    hint: {
      type: String,
      required: false,
    },
    explanation: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

export const ConceptQuestion = mongoose.model<IConceptQuestion>('ConceptQuestion', ConceptQuestionSchema);