import { Router } from 'express';
import Booking from '../models/Booking.js';
import Equipment from '../models/Equipment.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = Router();

router.get('/mine', protect, async (req, res, next) => {
  try {
    const bookings = await Booking.find({ user: req.user._id }).populate('equipment').sort({ createdAt: -1 });
    res.json({ bookings });
  } catch (e) { next(e); }
});
router.get('/', protect, adminOnly, async (_req, res, next) => {
  try {
    const bookings = await Booking.find().populate('equipment').populate('user', 'name email studentId department').sort({ createdAt: -1 });
    res.json({ bookings });
  } catch (e) { next(e); }
});
router.post('/', protect, async (req, res, next) => {
  try {
    const { equipmentId, startAt, endAt, purpose, courseCode } = req.body;
    const start = new Date(startAt), end = new Date(endAt);
    if (!equipmentId || !startAt || !endAt || !purpose?.trim()) return res.status(400).json({ message: 'Equipment, start time, end time and purpose are required.' });
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start <= new Date() || end <= start) return res.status(400).json({ message: 'Choose a future start time and an end time after the start.' });
    if (end - start > 7 * 24 * 60 * 60 * 1000) return res.status(400).json({ message: 'A booking cannot be longer than 7 days.' });
    const item = await Equipment.findById(equipmentId);
    if (!item || item.status !== 'available') return res.status(400).json({ message: 'This equipment is unavailable or under maintenance.' });
    const overlappingCount = await Booking.countDocuments({
      equipment: equipmentId, status: { $in: ['pending', 'approved'] },
      startAt: { $lt: end }, endAt: { $gt: start }
    });
    if (overlappingCount >= item.quantity) return res.status(409).json({ message: 'All units are reserved or awaiting approval for that time slot. Choose another time.' });
    const booking = await Booking.create({ equipment: equipmentId, user: req.user._id, startAt: start, endAt: end, purpose: purpose.trim(), courseCode });
    res.status(201).json({ booking: await booking.populate('equipment') });
  } catch (e) { next(e); }
});
router.patch('/:id/cancel', protect, async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found.' });
    if (req.user.role !== 'admin' && String(booking.user) !== String(req.user._id)) return res.status(403).json({ message: 'You cannot cancel this booking.' });
    if (!['pending', 'approved'].includes(booking.status)) return res.status(400).json({ message: 'This booking cannot be cancelled.' });
    booking.status = 'cancelled'; await booking.save();
    res.json({ booking });
  } catch (e) { next(e); }
});
router.patch('/:id/status', protect, adminOnly, async (req, res, next) => {
  try {
    const { status, adminNote = '' } = req.body;
    if (!['approved', 'rejected', 'completed', 'cancelled'].includes(status)) return res.status(400).json({ message: 'Invalid status.' });
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found.' });
    if (status === 'approved') {
      const item = await Equipment.findById(booking.equipment);
      if (!item || item.status !== 'available') return res.status(409).json({ message: 'Cannot approve: this equipment is unavailable.' });
      const overlappingCount = await Booking.countDocuments({
        _id: { $ne: booking._id }, equipment: booking.equipment, status: 'approved',
        startAt: { $lt: booking.endAt }, endAt: { $gt: booking.startAt }
      });
      if (overlappingCount >= item.quantity) return res.status(409).json({ message: 'Cannot approve: all units are already allocated for this time slot.' });
    }
    booking.status = status; booking.adminNote = adminNote; await booking.save();
    res.json({ booking });
  } catch (e) { next(e); }
});
export default router;
