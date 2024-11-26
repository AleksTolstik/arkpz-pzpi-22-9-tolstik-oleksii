import { Router } from 'express';
import { LoginService } from './login.service.js';

const router = Router();
const loginService = new LoginService();

async function registerUser(req, res, tableName, roleId) {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Please enter both email and password.' });
    }

    try {
        const user = await loginService.loginUser(req.db, tableName, email, password);

        if (!user || user.id_role !== roleId) {
            return res.status(401).json({ message: `Invalid email or password for ${tableName.toLowerCase()}.` });
        }

        req.session.userId = user[`id_${tableName.toLowerCase()}`];
        req.session.userName = user.first_name;

        res.cookie('userId', user[`id_${tableName.toLowerCase()}`], { httpOnly: true });
        res.status(200).json({ message: 'Logged in successfully', user });
    } catch (error) {
        res.status(500).json({ message: 'Failed to log in', error: error.message });
    }
}

// маршрути входу користувачів
router.post('/doctor', (req, res) => {
    registerUser(req, res, 'Doctor', 1);
});

router.post('/medicalStaff', (req, res) => {
    registerUser(req, res, 'MedicalStaff', 2);
});

router.post('/pharmacist', (req, res) => {
    registerUser(req, res, 'Pharmacist', 3);
});

router.post('/patient', (req, res) => {
    registerUser(req, res, 'Patient', 4);
});

export const loginRouter = router;
