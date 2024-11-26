import { Router } from 'express';
import { MainService } from './main.service.js';

const router = Router();
const mainService = new MainService();

// отримання списку пацієнтів
router.get('/patients', async (req, res) => {
    try {
        const patients = await mainService.viewAllPatients(req.db);

        if (!patients || patients.length === 0) {
            return res.status(404).json({ message: 'No patients found.' });
        }

        res.status(200).json({ patients });
    } catch (error) {
        console.error('Error fetching patients:', error);
        res.status(500).json({ message: 'An error occurred on the server' });
    }
});

// пошук пацієнтів
router.post('/patients/search', async (req, res) => {
    const { query } = req.body;

    if (!query || typeof query !== 'string') {
        return res.status(400).json({ message: 'Search query is required and must be a string.' });
    }

    try {
        const patients = await mainService.searchPatients(req.db, query);

        if (!patients || patients.length === 0) {
            return res.status(404).json({ message: 'No matching patients found.' });
        }

        res.status(200).json({ patients });
    } catch (error) {
        console.error('Error searching patients:', error);
        res.status(500).json({ message: 'An error occurred on the server' });
    }
});

// сортування пацієнтів
router.post('/patients/sort', async (req, res) => {
    const { sortBy } = req.body;

    if (!sortBy || (sortBy !== 'alphabetical' && sortBy !== 'birth_date')) {
        return res.status(400).json({ message: 'Invalid sorting parameter. Use "alphabetical" or "birth_date".' });
    }

    try {
        const sortedPatients = await mainService.getSortedPatients(req.db, sortBy);

        if (!sortedPatients || sortedPatients.length === 0) {
            return res.status(404).json({ message: 'No patients found to sort.' });
        }

        res.status(200).json({ patients: sortedPatients });
    } catch (error) {
        console.error('Error sorting patients:', error);
        res.status(500).json({ message: 'An error occurred on the server' });
    }
});

// отримання детальної інформ. про призначення
router.get('/patients/:id/details', async (req, res) => {
    const { id } = req.params;

    if (!id || isNaN(id)) {
        return res.status(400).json({ message: 'Invalid patient ID' });
    }

    try {
        const patientDetails = await mainService.getPatientDetailsById(req.db, parseInt(id, 10));

        if (!patientDetails) {
            return res.status(404).json({ message: 'Patient not found' });
        }

        res.status(200).json({ patientDetails });
    } catch (error) {
        console.error('Error fetching patient details:', error);
        res.status(500).json({ message: 'An error occurred on the server' });
    }
});

// додати призначення
router.post('/patients/:id/add-prescription', async (req, res) => {
    const { id } = req.params;
    const prescriptionData = req.body;

    if (!id || isNaN(id)) {
        return res.status(400).json({ message: 'Invalid patient ID' });
    }

    try {
        const result = await mainService.addPrescription(req.db, parseInt(id, 10), prescriptionData);

        res.status(201).json(result);
    } catch (error) {
        console.error('Error adding prescription:', error);
        res.status(500).json({ message: 'An error occurred on the server' });
    }
});

// змінити призначення
router.put('/patients/change-prescription/:id', async (req, res) => {
    const { id } = req.params;
    const { medications } = req.body;

    try {
        const result = await MainService.updatePrescription(req.db, id, medications);
        res.json({ message: 'Призначення оновлено успішно', result });
    } catch (error) {
        console.error('Error updating prescription:', error);
        res.status(500).json({ message: 'Помилка оновлення призначення', error: error.message });
    }
});

// отримання розкладу прийому
router.get('/patients/prescription-schedule/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const result = await MainService.getPrescriptionSchedule(req.db, id);

        res.json({
            date: new Date().toLocaleDateString('uk-UA'),
            schedule: result,
        });
    } catch (error) {
        console.error('Error fetching prescription details:', error);
        res.status(500).json({ message: 'Помилка отримання розкладу прийому ліків', error: error.message });
    }
});

export const mainRouter = router;
