import { Document, Packer, Paragraph, TextRun } from 'docx';

export class ReportService {
    // генерація звіту про видачу ліків для пацієнта
    async generateMedicationDistributionReport(db, patientId) {
        const patient = await db.user.findUnique({
            where: { id_user: patientId },
        });

        if (!patient) {
            throw new Error('Patient not found.');
        }

        const prescriptions = await db.prescription.findMany({
            where: { id_patient: patientId },
            include: {
                MedicationInPrescription: {
                    include: { Medication: true },
                },
                User_Prescription_id_doctorToUser: true,
            },
        });

        if (!prescriptions.length) {
            throw new Error('No prescriptions found for the patient.');
        }

        const doc = new Document({
            sections: [
                {
                    children: [
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: `Medication Distribution Report`,
                                    bold: true,
                                    size: 36,
                                }),
                            ],
                        }),

                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: `Patient ID: ${patientId}, `,
                                    bold: true,
                                    size: 28,
                                    break: 1,
                                }),
                                new TextRun({
                                    text: `Name: ${patient.first_name} ${patient.last_name}`,
                                    size: 28,
                                    break: 1,
                                }),
                                new TextRun({
                                    text: `Birth date: ${patient.birth_date ? patient.birth_date.toLocaleDateString() : 'Not Available'}`,
                                    size: 28,
                                    break: 1,
                                }),
                                new TextRun({
                                    text: `Address: ${patient.address || 'Not Available'}`,
                                    size: 28,
                                    break: 1,
                                }),
                            ],
                        }),

                        ...prescriptions.map((prescription) => new Paragraph({
                            children: [
                                new TextRun({
                                    text: `Diagnosis: "${prescription.diagnosis_name}"`,
                                    bold: true,
                                    size: 24,
                                    break: 1,
                                }),
                                new TextRun({
                                    text: `Prescription Date: ${prescription.prescription_date ? prescription.prescription_date.toLocaleDateString() : 'Not Available'}`,
                                    size: 24,
                                    break: 1,
                                }),
                                new TextRun({
                                    text: `Doctor: ${prescription.User_Prescription_id_doctorToUser?.last_name || 'Not Available'}`,
                                    size: 24,
                                    break: 1,
                                }),
                                ...prescription.MedicationInPrescription.map((med) =>
                                    new Paragraph({
                                        children: [
                                            new TextRun({
                                                text: `\t- ${med.Medication?.medication_name || 'No name'} (${med.dosage_duration || 'N/A'})`,
                                                size: 22,
                                                break: 1,
                                            }),
                                        ],
                                    }),
                                ),
                            ],
                        })),
                    ],
                },
            ],
        });

        const buffer = await Packer.toBuffer(doc);
        return buffer;
    }


    // генерація звіту про залишки ліків на складі
    async generateStockReport(db) {
        const medications = await db.medication.findMany({
            include: {
                Inventory: {
                    include: {
                        Container: true,
                    },
                },
            },
        });

        if (!medications.length) {
            throw new Error('No medication information available.');
        }

        const doc = new Document({
            sections: [
                {
                    children: [
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: `Medication Stock Report`,
                                    bold: true,
                                    size: 36,
                                }),
                            ],
                        }),
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: `Report Date: ${new Date().toLocaleDateString()}`,
                                    size: 28,
                                    break: 1,
                                }),
                            ],
                        }),
                        ...medications.map((medication) =>
                            new Paragraph({
                                children: [
                                    new TextRun({
                                        text: `Medication Name: ${medication.medication_name || 'Not Available'}`,
                                        bold: true,
                                        size: 24,
                                        break: 1,
                                    }),
                                    new TextRun({
                                        text: `Quantity: ${medication.quantity || 'Not Available'}`,
                                        size: 22,
                                        break: 1,
                                    }),
                                    new Paragraph({ text: '' })
                                ],
                            })
                        ),
                    ],
                },
            ],
        });

        const buffer = await Packer.toBuffer(doc);
        return buffer;
    }
}
