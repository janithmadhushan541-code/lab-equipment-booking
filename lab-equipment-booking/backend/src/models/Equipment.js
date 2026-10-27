import mongoose from 'mongoose';
const equipmentSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  category: { type: String, required: true, trim: true },
  location: { type: String, required: true, trim: true },
  description: { type: String, default: '', maxlength: 1000 },
  quantity: { type: Number, min: 1, default: 1 },
  imageUrl: { type: String, default: '' },
  status: { type: String, enum: ['available', 'maintenance', 'retired'], default: 'available' },
  instructions: { type: String, default: '' }
}, { timestamps: true });
export default mongoose.model('Equipment', equipmentSchema);
