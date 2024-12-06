import { Router } from 'express';
import { ProfileService } from './profile.service.js';

const router = Router();
const profileService = new ProfileService();

// отримати профіль користувача
router.get('/massage', (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: 'You need to log in' });
    }

    const userProfile = {
        id: req.session.userId,
        name: req.session.userName,
    };

    res.status(200).json({ message: 'User profile loaded successfully', profile: userProfile });
});

// вихід із системи
router.post('/logout', (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: 'You are not logged in' });
    }
    
    req.session.destroy((err) => {
        if (err) {
            console.error('Помилка при завершенні сесії:', err);
            return res.status(500).json({ message: 'Помилка при виході з аккаунту' });
        }
        res.clearCookie('connect.sid');
        return res.status(200).json({ message: 'Ви успішно вийшли з аккаунту' });
    });
});

export const profileRouter = router;
