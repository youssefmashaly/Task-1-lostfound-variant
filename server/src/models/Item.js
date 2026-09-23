import mongoose from 'mongoose';

const itemSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    category: {
      type: String,
      enum: ['electronics', 'clothing', 'documents', 'accessories', 'other'],
      default: 'other'
    },
    status: {
      type: String,
      enum: ['lost', 'found', 'claimed'],
      default: 'lost'
    },
    location: { type: String, trim: true },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false
    }
  },
  { timestamps: true }
);

itemSchema.index({ title: 1, location: 1 }, { unique: true });

export const Item = mongoose.model('Item', itemSchema);
