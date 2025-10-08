import { Router } from 'express';

const router = Router();

// TODO: Implement integrations CRUD
router.get('/', (req, res) => {
  res.json({ message: 'Integrations endpoint - coming soon' });
});

export default router;