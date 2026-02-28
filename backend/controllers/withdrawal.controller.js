import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import Withdrawal from '../models/Withdrawal.model.js';
import Booking from '../models/Booking.model.js';
import { HTTP_STATUS } from '../config/constants.js';

// Helper: compute available balance for a counselor
const getAvailableBalance = async (counselorId) => {
  // Total earned from confirmed/completed paid bookings
  const earningsAgg = await Booking.aggregate([
    {
      $match: {
        counselorId: counselorId,
        paymentStatus: 'paid',
        status: { $in: ['confirmed', 'completed'] },
      },
    },
    { $group: { _id: null, total: { $sum: '$counselorEarning' } } },
  ]);
  const totalEarned = earningsAgg[0]?.total || 0;

  // Total withdrawn (completed) + pending/processing (locked)
  const withdrawalsAgg = await Withdrawal.aggregate([
    {
      $match: {
        counselorId: counselorId,
        status: { $in: ['completed', 'pending', 'processing'] },
      },
    },
    { $group: { _id: '$status', total: { $sum: '$amount' } } },
  ]);

  let withdrawn = 0;
  let locked = 0;
  for (const row of withdrawalsAgg) {
    if (row._id === 'completed') withdrawn += row.total;
    else locked += row.total; // pending + processing
  }

  return {
    totalEarned: +totalEarned.toFixed(2),
    withdrawn: +withdrawn.toFixed(2),
    locked: +locked.toFixed(2),
    available: +(totalEarned - withdrawn - locked).toFixed(2),
  };
};

// ── Counselor endpoints ───────────────────────────────────────────────────────

// GET /api/withdrawals/balance
export const getBalance = asyncHandler(async (req, res) => {
  const balance = await getAvailableBalance(req.user._id);
  res.json(new ApiResponse(HTTP_STATUS.OK, { balance }));
});

// GET /api/withdrawals/my
export const getMyWithdrawals = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const [withdrawals, total] = await Promise.all([
    Withdrawal.find({ counselorId: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Withdrawal.countDocuments({ counselorId: req.user._id }),
  ]);

  res.json(
    new ApiResponse(HTTP_STATUS.OK, {
      withdrawals,
      total,
      page,
      pages: Math.ceil(total / limit),
    })
  );
});

// POST /api/withdrawals
export const createWithdrawal = asyncHandler(async (req, res) => {
  const { amount, bankDetails } = req.body;

  if (!amount || amount <= 0) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'A valid withdrawal amount is required');
  }
  if (!bankDetails?.accountName || !bankDetails?.accountNumber || !bankDetails?.bankName) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Account name, account number, and bank name are required');
  }

  // Verify sufficient balance
  const balance = await getAvailableBalance(req.user._id);
  if (amount > balance.available) {
    throw new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      `Insufficient balance. Available: Rs. ${balance.available.toFixed(2)}`
    );
  }

  const withdrawal = await Withdrawal.create({
    counselorId: req.user._id,
    amount,
    bankDetails: {
      accountName: bankDetails.accountName.trim(),
      accountNumber: bankDetails.accountNumber.trim(),
      bankName: bankDetails.bankName.trim(),
      swiftCode: bankDetails.swiftCode?.trim() || '',
    },
  });

  res.status(HTTP_STATUS.CREATED).json(
    new ApiResponse(HTTP_STATUS.CREATED, { withdrawal }, 'Withdrawal request submitted')
  );
});

// ── Admin endpoints ───────────────────────────────────────────────────────────

// GET /api/admin/withdrawals
export const listWithdrawals = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const filter = {};
  if (req.query.status) filter.status = req.query.status;

  const [withdrawals, total] = await Promise.all([
    Withdrawal.find(filter)
      .populate('counselorId', 'name email username')
      .populate('processedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Withdrawal.countDocuments(filter),
  ]);

  res.json(
    new ApiResponse(HTTP_STATUS.OK, {
      withdrawals,
      total,
      page,
      pages: Math.ceil(total / limit),
    })
  );
});

// PUT /api/admin/withdrawals/:id
export const processWithdrawal = asyncHandler(async (req, res) => {
  const { status, adminNote } = req.body;
  const allowed = ['processing', 'completed', 'rejected'];

  if (!allowed.includes(status)) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, `Status must be one of: ${allowed.join(', ')}`);
  }

  const withdrawal = await Withdrawal.findById(req.params.id);
  if (!withdrawal) throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Withdrawal not found');

  if (withdrawal.status === 'completed' || withdrawal.status === 'rejected') {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'This withdrawal has already been finalized');
  }

  withdrawal.status = status;
  if (adminNote !== undefined) withdrawal.adminNote = adminNote;
  if (status === 'completed' || status === 'rejected') {
    withdrawal.processedAt = new Date();
    withdrawal.processedBy = req.user._id;
  }

  await withdrawal.save();

  res.json(new ApiResponse(HTTP_STATUS.OK, { withdrawal }, 'Withdrawal updated'));
});
