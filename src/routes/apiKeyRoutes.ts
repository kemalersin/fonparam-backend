import express from 'express';
import { apiKeyController } from '../controllers/apiKeyController';
import { adminAuth } from '../middleware/adminAuth';

const router = express.Router();

// API key yönetim rotaları (admin yetkisi gerekli)
router.post('/', adminAuth, apiKeyController.generateKey);
router.delete('/:key', adminAuth, apiKeyController.deactivateKey);
router.put('/:key/limit', adminAuth, apiKeyController.updateLimits);
router.get('/', adminAuth, apiKeyController.listKeys);

export default router; 