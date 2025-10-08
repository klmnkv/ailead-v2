import { Router } from 'express';
import { queueService } from '../services/queue.service.js';

const router = Router();

/**
 * GET /api/queue/stats
 * Статистика очередей
 */
router.get('/stats', async (req, res, next) => {
  try {
    const stats = await queueService.getStats();
    res.json(stats);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/queue/job/:jobId
 * Информация о конкретной задаче
 */
router.get('/job/:jobId', async (req, res, next) => {
  try {
    const { jobId } = req.params;
    const job = await queueService.getJob(jobId);

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const state = await job.getState();
    const progress = job.progress();

    res.json({
      id: job.id,
      state,
      progress,
      data: job.data,
      attemptsMade: job.attemptsMade,
      processedOn: job.processedOn,
      finishedOn: job.finishedOn,
      failedReason: job.failedReason
    });
  } catch (error) {
    next(error);
  }
});

export default router;