import { Router } from 'express';
import { ContainerService } from './container.service.js';

const router = Router();
const containerService = new ContainerService();

// додавання нового контейнера
router.post('/add', async (req, res) => {
    try {
        const newContainer = await containerService.addContainer(req.db);
        res.status(201).json({ message: 'Новий контейнер успішно додано', container: newContainer });
    } catch (error) {
        console.error('Error adding container:', error);
        res.status(500).json({ message: 'Не вдалося додати контейнер' });
    }
});

// отримання інформації про контейнер
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const containerDetails = await containerService.getContainerDetails(req.db, id);
        res.json(containerDetails);
    } catch (error) {
        console.error('Error fetching container details:', error);
        res.status(500).json({ message: 'Помилка при отриманні інформації про контейнер' });
    }
});

// закріплення пацієнта за контейнером
router.post('/:id/addPatient', async (req, res) => {
    try {
        const { id } = req.params;
        const { patient_id } = req.body;
      
        if (!patient_id) {
            console.error('patient_id is required')
            return res.status(401).json({ message: 'Обов\'язково оберіть пацієнта для додавання' });
        }

        const addingDetails = await containerService.addPatientToContainer(req.db, id, patient_id);
        res.json(addingDetails);
    } catch (error) {
        console.error('Error adding patient:', error);
        res.status(500).json({ message: 'Помилка при додаванні пацієнта' });
    }
});

// додати ліки до відсіку
router.post('/addMedicationToInventory/:id_inventory', async (req, res) => {
    try {
        const { id_inventory } = req.params;
        const { quantity, id_medication } = req.body;

        if (!quantity || !id_medication){
            console.error('quantity and id_medication is required')
            return res.status(401).json({ message: 'Обов\'язково заповніть обидва поля' });
        }

        const addingDetails = await containerService.addMedicationToInventory(req.db, id_inventory, quantity, id_medication);
        res.json(addingDetails);
    } catch (error) {
        console.error('Error adding medication:', error);
        res.status(500).json({ message: 'Помилка при додаванні медикаментів' });
    }
});

// отримання списку призначених препаратів
router.post('/prescribedMedications', async (req, res) => {
    try {
        const { id_patient } = req.body;

        if (!id_patient){
            console.error('id_patient is required')
            return res.status(401).json({ message: 'Пацієнта не знайдено' });
        }

        const medicationInfo = await containerService.getPrescribedMedications(req.db, id_patient);
        res.json(medicationInfo);
    } catch (error) {
        console.error('Error getting medication:', error);
        res.status(500).json({ message: 'Помилка при отриманні медикаментів' });
    }
});

// отримання типу відсіку
router.post('/inventoryUnit/:id_inventory', async (req, res) => {
    try {
        const { id_inventory } = req.params;

        if (!id_inventory){
            console.error('id_inventory is required')
            return res.status(401).json({ message: 'Відсік не знайдено' });
        }

        const unitInfo = await containerService.getInventoryUnit(req.db, id_inventory);
        res.json(unitInfo);    
    } catch (error) {
        console.error('Error getting unit:', error);
        res.status(500).json({ message: 'Помилка при отриманні данних' });
    }
});

export const containerRouter = router;
