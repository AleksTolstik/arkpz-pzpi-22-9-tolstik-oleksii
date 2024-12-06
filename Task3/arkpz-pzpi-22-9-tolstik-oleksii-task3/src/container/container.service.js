export class ContainerService {
    //додавання нового контейнера до бд
    async addContainer(db) {
        try {
            const result = await db.container.aggregate({
                _max: {
                    container_number: true,
                },
            });

            const lastNumber = result._max.container_number || 0;
            const newNumber = lastNumber + 1;

            const newContainer = await db.container.create({
                data: {
                    container_number: newNumber,
                    operational_status: 0,
                    network_status: 0,
                    id_patient: null,
                },
            });
    
            return newContainer;
        } catch (error) {
            console.error('Помилка при додаванні контейнера:', error);
            throw new Error('Не вдалося додати контейнер');
        }
    }
    
    // отримання детальної інформації про контейнер
    async getContainerDetails(db, id) {
        try {
            const container = await db.container.findUnique({
                where: { id_container: Number(id) },
                include: {
                    User: {
                        select: {
                            last_name: true,
                            first_name: true,
                            patronymic: true,
                        },
                    },
                    Inventory: {
                        select: {
                            inventory_number: true,
                        }
                    },
                    Inventory: {
                        include: {
                            Medication: {
                                select: {
                                    medication_name: true,
                                },
                            },
                            Type: {
                                select: {
                                    type_name: true,
                                },
                            },
                        },
                    },
                },
            });

            if (!container) {
                throw new Error('Контейнер не знайдено');
            }

            const response = {
                id: container.id_container,
                status: container.operational_status ? 'Активний' : 'Неактивний',
                network_status: container.network_status ? 'Підключено' : 'Не підключено',
                patient: container.User ? `${container.User.last_name} ${container.User.first_name} ${container.User.patronymic}` : 'Немає пацієнта',
                compartments: container.Inventory.map(inventory => ({
                    id_compartment: inventory.id_inventory,
                    inventory_number: inventory.inventory_number,
                    medication: inventory.Medication ? inventory.Medication.medication_name : 'Невідомо',
                    quantity: inventory.quantity || 0,
                    type: inventory.Type ? inventory.Type.type_name : 'Невідомо',
                })),
            };

            return response;
        } catch (error) {
            console.error('Помилка при отриманні даних контейнера:', error);
            throw new Error('Помилка при отриманні інформації про контейнер');
        }
    }

    // закріпити контейнер за пацієнтом
    async addPatientToContainer(db, id, patient_id) {
        try {
            const container = await db.container.findUnique({
                where: {
                    id_container: Number(id),
                },
            });
    
            if (!container) {
                throw new Error('Контейнер не знайдено');
            }
    
            const updatedContainer = await db.container.update({
                where: {
                    id_container: Number(id),
                },
                data: {
                    id_patient: Number(patient_id), 
                },
            });
    
            const newPatient = await db.User.findUnique({
                where: {
                    id_user: Number(patient_id),
                },
                select: {
                    last_name: true,
                    first_name: true,
                    patronymic: true,
                },
            });
    
            if (!newPatient) {
                throw new Error('Пацієнт не знайдений');
            }
    
            const response = {
                id: updatedContainer.id_container,
                patient: newPatient,
                message: 'Пацієнта додано успішно',
            };
    
            return response;
        } catch (error) {
            console.error('Помилка при додаванні пацієнта', error);
            throw new Error('Помилка при додаванні пацієнта');
        }
    }

    // додати медичний препарати до відсіку
    async addMedicationToInventory(db, id_inventory, quantity, id_medication){
        try {
            const updateInventory = await db.inventory.update({
                where: {
                    id_inventory: Number(id_inventory),
                },
                data: {
                    quantity: Number(quantity), 
                    id_medication: Number(id_medication),
                },
            });      
    
            const response = {
                id: updateInventory.id_inventory,
                message: 'Препарати додано успішно',
            };
    
            return response;
        } catch (error) {
            console.error('Помилка при додаванні препарату', error);
            throw new Error('Помилка при додаванні препарату');
        }
    } 
    
    // отримати інформацію про призначені медикаменти
    async getPrescribedMedications(db, patient_id) {
        try {
            const medications = await db.medicationInPrescription.findMany({
                where: {
                    Prescription: {
                        id_patient: Number(patient_id),
                    },
                },
                include: {
                    Medication: {
                        select: {
                            medication_name: true,
                        },
                    },
                },
            });

            const response = medications.map((item) => ({
                medication_name: item.Medication.medication_name,
            }));

            return response;
        } catch (error) {
            console.error('Помилка при отриманні медикаментів:', error);
            throw new Error('Не вдалося отримати інформацію про медикаменти');
        }
    }

    // отримати інформацію про тип відсіку
    async getInventoryUnit(db, id_inventory) {
        try {
            const inventoryUnit = await db.inventory.findUnique({
                where: {
                    id_inventory: Number(id_inventory),
                },
                include: {
                    Type: {
                        select: {
                            unit: true,
                        },
                    },
                },
            });

            if (!inventoryUnit) {
                throw new Error(`Відсік з ID ${id_inventory} не знайдено`);
            }

            const response = {
                id_inventory: inventoryUnit.id_inventory,
                type_unit: inventoryUnit.Type?.unit || null,
            };

            return response;
        } catch (error) {
            console.error('Помилка при отриманні типу:', error);
            throw new Error('Не вдалося отримати тип відсіку');
        }
    }
}
