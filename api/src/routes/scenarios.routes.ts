import { Router } from 'express';

const router = Router();

// TODO: Implement scenarios CRUD
router.get('/', (req, res) => {
  res.json({ message: 'Scenarios endpoint - coming soon' });
});

export default router;