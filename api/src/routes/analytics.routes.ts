import { Router } from 'express';

const router = Router();

// TODO: Implement analytics
router.get('/', (req, res) => {
  res.json({ message: 'Analytics endpoint - coming soon' });
});

export default router;