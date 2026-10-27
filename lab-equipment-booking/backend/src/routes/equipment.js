import { Router } from 'express';
import Equipment from '../models/Equipment.js';
import Booking from '../models/Booking.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = Router();
router.get('/', async (req, res, next) => {
  try {
    const { search = '', category = '', status = '' } = req.query;
    const query = {};
    if (search) query.$or = [{ name: { $regex: search, $options: 'i' } }, { code: { $regex: search, $options: 'i' } }, { location: { $regex: search, $options: 'i' } }];
    if (category) query.category = category;
    if (status) query.status = status;
    const items = await Equipment.find(query).sort({ name: 1 }).lean();
    const now = new Date();
    const equipment = await Promise.all(items.map(async item => {
      const activeBookings = await Booking.countDocuments({
        equipment: item._id, status: { $in: ['pending', 'approved'] },
        startAt: { $lt: new Date(now.getTime() + 24 * 60 * 60 * 1000) }, endAt: { $gt: now }
      });
      return { ...item, activeBookings };
    }));
    res.json({ equipment });
  } catch (e) { next(e); }
});
router.post('/', protect, adminOnly, async (req, res, next) => {
  try { res.status(201).json({ equipment: await Equipment.create(req.body) }); }
  catch (e) { next(e); }
});
router.put('/:id', protect, adminOnly, async (req, res, next) => {
  try {
    const equipment = await Equipment.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!equipment) return res.status(404).json({ message: 'Equipment not found.' });
    res.json({ equipment });
  } catch (e) { next(e); }
});
router.delete('/:id', protect, adminOnly, async (req, res, next) => {
  try {
    const active = await Booking.exists({ equipment: req.params.id, status: { $in: ['pending', 'approved'] } });
    if (active) return res.status(409).json({ message: 'Cancel or resolve active bookings before deleting this equipment.' });
    const equipment = await Equipment.findByIdAndDelete(req.params.id);
    if (!equipment) return res.status(404).json({ message: 'Equipment not found.' });
    res.json({ message: 'Equipment deleted.' });
  } catch (e) { next(e); }
});
export default router;
