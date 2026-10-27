import mongoose from 'mongoose';
const bookingSchema = new mongoose.Schema({
  equipment: { type: mongoose.Schema.Types.ObjectId, ref: 'Equipment', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  startAt: { type: Date, required: true },
  endAt: { type: Date, required: true },
  purpose: { type: String, required: true, trim: true, maxlength: 500 },
  courseCode: { type: String, trim: true, default: '' },
  status: { type: String, enum: ['pending', 'approved', 'rejected', 'cancelled', 'completed'], default: 'pending' },
  adminNote: { type: String, default: '' }
}, { timestamps: true });
bookingSchema.index({ equipment: 1, startAt: 1, endAt: 1, status: 1 });
export default mongoose.model('Booking', bookingSchema);
