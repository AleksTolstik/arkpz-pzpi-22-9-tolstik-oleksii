import { Router } from 'express';
import { AdminService } from './admin.service.js';
import { backupFiles } from '../../backup.js';
import { reportRouter } from '../reports/reports.controller.js';

const router = Router();
const adminService = new AdminService();

// доступ то друкування звітностей
router.use('/reports', reportRouter);

// змінити роль користувача
router.post('/changeRole/:userId', async (req, res) => {
    const { userId } = req.params;
    const { newRoleId } = req.body;
 
    if (!newRoleId){
        console.error('newRoleId is required')
        return res.status(401).json({ message: 'No required data (newRoleId)' });
    }

    try {
        const updatedUser = await adminService.changeRole(req.db, userId, newRoleId);
        res.status(200).json({ message: 'Role updated successfully', user: updatedUser });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update role', details: error.message });
    }
});

// отримати всіх користувачів системи
router.get('/users/:id_role', async (req, res) => {
    const { id_role } = req.params;

    try {
        const users = await adminService.getUsersByRole(req.db, id_role);
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch users', details: error.message });
    }
});

// додати нову роль
router.post('/addRole', async (req, res) => {
    const { roleName } = req.body;

    if (!roleName){
        console.error('roleName is required')
        return res.status(401).json({ message: 'No required data (roleName)' });
    }

    try {
        const newRole = await adminService.addRole(req.db, roleName);
        res.status(201).json({ message: 'Role added successfully', role: newRole });
    } catch (error) {
        res.status(500).json({ error: 'Failed to add role', details: error.message });
    }
});

// отримати всі ролі системи
router.get('/getRoles', async (req, res) => {
    try {
        const roles = await adminService.getRoles(req.db,);
        res.status(201).json({ message: 'Roles find successfully', roles });
    } catch (error) {
        res.status(500).json({ error: 'Failed to find roles', details: error.message });
    }
});

// видалити користувача
router.delete('/deleteUser', async (req, res) => {
    const { userId } = req.body;

    if (!userId){
        console.error('userId is required')
        return res.status(401).json({ message: 'No required data (userId)' });
    }
    try {
        await adminService.deleteUser(req.db, userId);
        res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete user', details: error.message });
    }
});

// заблокувати користувача
router.post('/blockUser/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const blockedUser = await adminService.blockUser(req.db, userId);
        res.status(200).json({ message: 'User blocked successfully', user: blockedUser });
    } catch (error) {
        res.status(500).json({ error: 'Failed to block user', details: error.message });
    }
});

// отримання журналу всіх повідомлень
router.get('/notifications', async (req, res) => {
    try {
        const notifications = await adminService.getNotifications(req.db);
        res.status(200).json(notifications);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch notifications', details: error.message });
    }
});

// отримання статистики контейнерів
router.get('/containerStats', async (req, res) => {
    try {
        const stats = await adminService.getContainerStats(req.db);
        res.status(200).json(stats);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch container stats', details: error.message });
    }
});

// отримання статистики лікування пацієнтів
router.get('/treatmentStats/:patientId', async (req, res) => {
    const { patientId } = req.params;
    try {
        const stats = await adminService.getTreatmentStats(req.db, patientId);
        res.status(200).json(stats);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch treatment stats', details: error.message });
    }
});

// резервне копіювання
router.post('/backup', async (req, res) => {
    try {
      // Викликаємо функцію резервного копіювання
      await backupFiles();
      res.status(200).json({ message: 'Backup created successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to create backup', details: error.message });
    }
});

export const adminRouter = router;
