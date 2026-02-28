import mongoose from 'mongoose';
import { WITHDRAWAL_STATUSES } from '../config/constants.js';

const withdrawalSchema = new mongoose.Schema(
  {
    counselorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: [true, 'Withdrawal amount is required'],
      min: [1, 'Minimum withdrawal amount is $1'],
    },
    bankDetails: {
      accountName: { type: String, required: [true, 'Account name is required'], trim: true },
      accountNumber: { type: String, required: [true, 'Account number is required'], trim: true },
      bankName: { type: String, required: [true, 'Bank name is required'], trim: true },
      swiftCode: { type: String, default: '', trim: true },
    },
    status: {
      type: String,
      enum: WITHDRAWAL_STATUSES,
      default: 'pending',
    },
    adminNote: {
      type: String,
      default: '',
    },
    processedAt: {
      type: Date,
    },
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

const Withdrawal = mongoose.model('Withdrawal', withdrawalSchema);

export default Withdrawal;
