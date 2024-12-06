import { Router } from 'express';
import { NotificationService } from './notifications.service.js';

const router = Router();
const notificationService = new NotificationService();

// створення сповіщення про пропущену дозу
router.post('/missed-doseate', async (req, res) => {
    try {
        const { containerId, medicationId } = req.body;

        if (!containerId || !medicationId) {
            return res.status(400).json({ error: 'containerId and medicationId are required.' });
        }

        const notification = await notificationService.createNotification(req.db, containerId, medicationId);
        
        return res.status(201).json({ notification });
    } catch (error) {
        console.error('Error creating notification:', error);
        return res.status(500).json({ error: 'Failed to create notification.' });
    }
});

// сповіщення про низький рівень запасу
router.post('/low-stock', async (req, res) => {
    try {
        const { containerId, medicationId } = req.body;

        if (!containerId || !medicationId) {
            return res.status(400).json({ error: 'containerId and medicationId are required.' });
        }

        const notification = await notificationService.createLowStockNotification(req.db, containerId, medicationId);
        
        return res.status(201).json({ notification });
    } catch (error) {
        console.error('Error creating low stock notification:', error);
        return res.status(500).json({ error: 'Failed to create low stock notification.' });
    }
});

export const notificationRouter = router;
