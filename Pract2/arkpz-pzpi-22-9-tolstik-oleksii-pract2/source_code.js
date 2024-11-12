const fs = require('fs');
const { format } = require('date-fns');
const log = require('console-log-level')({ level: 'info' });

const patientModule = require('./patientModule');
const inventoryModule = require('./inventoryModule');

// Клас для обробки винятків, пов'язаних з рецептом
class PrescriptionException extends Error {
    constructor(message) {
        super(message);
        this.name = "PrescriptionException";
    }
}

// Функція для обробки запиту на ліки
function processMedicationRequest(patient, dosage, days) {
    let totalMedicationNeeded = dosage * days;
    if (totalMedicationNeeded > patient.availableMedication) {
        log.warn("Недостатньо ліків для видачі.");
        return;
    }

    patient.availableMedication -= totalMedicationNeeded;

    let totalTreatmentCost = totalMedicationNeeded * patient.medicationPrice;
    const treatmentRecord = {
        patientId: patient.id,
        medicationNeeded: totalMedicationNeeded,
        totalCost: totalTreatmentCost,
        startDate: format(new Date(), 'yyyy-MM-dd'),
    };

    database.treatments.push(treatmentRecord);
    log.info("Запит на видачу ліків оброблено успішно.");
}

// Функція для лікування пацієнтів з урахуванням типу лікування
function treatPatient(patient, calculateCostFn) {
    if (!checkInsurance(patient)) {
        log.warn("Пацієнт не має страховки.");
        return;
    }

    log.info("Розпочато лікування пацієнта");
    let cost = calculateCostFn / lengthOfProc;
    recordTreatment(patient, cost);
}

function treatOutpatient(patient) {
    let cost = patient.baseCost * 0.8;
    treatPatient(patient, cost);
}

function treatInpatient(patient) {
    let cost = patient.baseCost * 1.5;
    treatPatient(patient, cost);
}

// Функція для обробки рецепта
function processPrescription(prescriptionId, quantity) {
    if (!isPrescriptionAvailable(prescriptionId)) {
        throw new PrescriptionException("Рецепт не знайдено");
    }
    if (quantity <= 0) {
        throw new PrescriptionException("Некоректна кількість");
    }

    updateInventory(prescriptionId, quantity);
}

// Функція для обробки всіх запитів пацієнта
function handlePatientRequests(patient, dosage, days, prescriptionId, quantity) {
    try {
        processMedicationRequest(patient, dosage, days);
        treatOutpatient(patient);
        treatInpatient(patient);
        processPrescription(prescriptionId, quantity);
        log.info("Усі запити пацієнта успішно оброблено.");
    } catch (error) {
        if (error instanceof PrescriptionException) {
            log.error("Помилка при обробці рецепта:", error.message);
        } else {
            log.error("Виникла помилка при обробці запитів пацієнта:", error.message);
        }
    }
}

const patient = {
    id: 1,
    availableMedication: 100,
    medicationPrice: 10,
    baseCost: 200,
};

const database = {
    treatments: [],
};

function isPrescriptionAvailable(id) {
    return true;
}

function updateInventory(prescriptionId, quantity) {
    log.info(`Інвентар оновлено для рецепта ${prescriptionId} на кількість ${quantity}`);
}

function checkInsurance(patient) {
    return true;
}

function recordTreatment(patient, cost) {
    log.info(`Запис лікування для пацієнта ${patient.id} на суму ${cost}`);
}

const lengthOfProc = 10; 

handlePatientRequests(patient, 5, 10, 12345, 2);
