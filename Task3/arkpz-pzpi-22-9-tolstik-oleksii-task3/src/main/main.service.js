export class MainService {
    async viewAllPatients(db) {
        try {
            const patients = await db.user.findMany({
                where: {
                    id_role: 4,
                },
                select: {
                    last_name: true,
                    first_name: true,
                    patronymic: true,
                    birth_date: true,
                    address: true,
                },
            });

            return patients;
        } catch (error) {
            console.error('Error retrieving patients:', error);
            throw new Error('Failed to retrieve patients');
        }
    }

    async searchPatients(db, query) {
        try {
            const patients = await db.user.findMany({
                where: {
                    id_role: 4,
                    OR: [
                        {
                            first_name: {
                                contains: query,
                                mode: 'insensitive',
                            },
                        },
                        {
                            last_name: {
                                contains: query,
                                mode: 'insensitive',
                            },
                        },
                        {
                            patronymic: {
                                contains: query,
                                mode: 'insensitive',
                            },
                        },
                    ],
                },
                select: {
                    last_name: true,
                    first_name: true,
                    patronymic: true,
                    birth_date: true,
                    address: true,
                },
            });

            return patients;
        } catch (error) {
            console.error('Error searching patients:', error);
            throw new Error('Failed to search patients');
        }
    }


    async getSortedPatients(db, sortBy) {
        try {
            const orderBy = 
                sortBy === 'alphabetical' 
                    ? { last_name: 'asc' } 
                    : sortBy === 'birth_date'
                    ? { birth_date: 'asc' }
                    : null;

            if (!orderBy) {
                throw new Error('Invalid sorting parameter');
            }

            const patients = await db.user.findMany({
                where: {
                    id_role: 4,
                },
                orderBy,
                select: {
                    last_name: true,
                    first_name: true,
                    patronymic: true,
                    birth_date: true,
                    address: true,
                },
            });

            return patients;
        } catch (error) {
            console.error('Error fetching sorted patients:', error);
            throw new Error('Failed to fetch sorted patients');
        }
    }

    async getPatientDetailsById(db, patientId) {
        try {
            const patientDetails = await db.user.findFirst({
                where: {
                    id_user: patientId,
                    id_role: 4,
                },
                select: {
                    last_name: true,
                    first_name: true,
                    patronymic: true,
                    birth_date: true,
                    address: true,
                    Prescription_Prescription_id_patientToUser: {
                        select: {
                            diagnosis_name: true,
                            prescription_date: true,
                            MedicationInPrescription: {
                                select: {
                                    dosage_duration: true,
                                    Medication: {
                                        select: {
                                            medication_name: true,
                                        },
                                    },
                                    MedicationIntakeSchedule: {
                                        select: {
                                            intake_time: true,
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            });

            if (!patientDetails) {
                throw new Error('Patient not found');
            }
    
            return patientDetails;
        } catch (error) {
            console.error('Error fetching patient details:', error.message);
            throw new Error('Failed to fetch patient details');
        }
    }

    async addPrescription(db, patientId, prescriptionData) {
        const { diagnosis_name, prescription_date, medications } = prescriptionData;

        try {
            const newPrescription = await db.prescription.create({
                data: {
                    diagnosis_name,
                    prescription_date: new Date(prescription_date),
                    id_patient: patientId,
                },
            });

            for (const medication of medications) {
                const { medication_id, dosage_duration, intake_times } = medication;

                const newMedication = await db.medicationInPrescription.create({
                    data: {
                        id_medication: medication_id,
                        dosage_duration,
                        id_prescription: newPrescription.id_prescription,
                    },
                });

                for (const intake_time of intake_times) {
                    const dbTime = convertToDatabaseTime(intake_time);
                    await db.medicationIntakeSchedule.create({
                        data: {
                            intake_time: dbTime,
                            id_medication_in_prescription: newMedication.id_medication_in_prescription,
                        },
                    });
                }
            }

            return { message: 'Prescription added successfully', newPrescription };
        } catch (error) {
            console.error('Error adding prescription:', error);
            throw new Error('Failed to add prescription');
        }
    }
    
    static async updatePrescription(db, id, medications) {
        const prescription = await db.prescription.findUnique({
            where: { id_prescription: Number(id) },
        });
    
        if (!prescription) {
            throw new Error('Призначення не знайдено');
        }
    
        for (const medication of medications) {
            const { id_medication_in_prescription, intake_times, dosage_duration } = medication;
    
            await db.medicationInPrescription.update({
                where: { id_medication_in_prescription },
                data: { dosage_duration },
            });
    
            await db.medicationIntakeSchedule.deleteMany({
                where: { id_medication_in_prescription },
            });
    
            for (const intake_time of intake_times) {
                const dbTime = convertToDatabaseTime(intake_time); 
                await db.medicationIntakeSchedule.create({
                    data: {
                        intake_time: dbTime,
                        status: 0,
                        id_medication_in_prescription,
                    },
                });
            }
        }
    
        return { id, medications };
    }

    static async getPrescriptionSchedule(db, id) {
        try {
            const prescription = await db.prescription.findUnique({
                where: { id_prescription: Number(id) },
                include: {
                    MedicationInPrescription: {
                        include: {
                            Medication: true,
                            MedicationIntakeSchedule: {
                                orderBy: { intake_time: 'asc' },
                            },
                        },
                    },
                },
            });
    
            if (!prescription) {
                throw new Error('Призначення не знайдено');
            }
       
            const schedule = prescription.MedicationInPrescription.map(medication => {
                return medication.MedicationIntakeSchedule.map(scheduleItem => ({
                    time: scheduleItem.intake_time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    medication: medication.Medication ? medication.Medication.medication_name : 'Unknown',
                    dosage: medication.dosage_duration,
                    status: scheduleItem.status,
                }));
            }).flat();
    
            return schedule;
        } catch (error) {
            console.error('Error fetching schedule:', error);
            throw new Error('Помилка отримання розкладу прийому ліків');
        }
    }    
}

function convertToDatabaseTime(timeString) {
    const today = new Date();
    const [hours, minutes] = timeString.split(':').map(Number);

    today.setHours(hours, minutes, 0, 0);
    return today;
}
