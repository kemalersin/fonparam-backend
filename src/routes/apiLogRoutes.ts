import express from 'express';
import { apiLogController } from '../controllers/apiLogController';
import { adminAuth } from '../middleware/adminAuth';

const router = express.Router();

// Log temizleme endpoint'i (sadece admin erişebilir)
router.delete('/cleanup', adminAuth, apiLogController.cleanupLogs);

export default router; 