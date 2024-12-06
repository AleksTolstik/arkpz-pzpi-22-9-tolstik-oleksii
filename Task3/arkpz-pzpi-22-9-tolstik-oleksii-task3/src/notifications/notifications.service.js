export class NotificationService {
    // Створення сповіщення
    async createNotification(db, containerId, medicationId) {
        const container = await db.container.findUnique({
            where: { id_container: Number(containerId) },
            include: { 
                User: true, 
                Inventory: {
                    include: { Medication: true }
                }
            }
        });

        if (!container) {
            return { message: "Container not found" };
        }

        const inventory = container.Inventory.find(item => item.id_medication === Number(medicationId));
        
        if (!inventory || !inventory.Medication) {
            return { message: "Medication not found in the container." };
        }

        // Шукаємо розклад прийому ліків для даного препарату
        const medicationSchedule = await db.medicationIntakeSchedule.findMany({
            where: {
                id_medication_in_prescription: { in: inventory.id_medication_in_prescription },
                status: 0, 
            },
        });

        if (medicationSchedule.length === 0) {
            return { message: "No missed doses found for the medication" };
        }

        const notification = await db.notification.create({
            data: {
                text: `You missed a dose of ${inventory.Medication.medication_name}. Please take it as soon as possible.`,
                send_date: new Date(),
                send_time: new Date(),
                id_container: container.id_container,
            },
        });

        const formattedNotification = {
            ...notification,
            send_date: new Date(notification.send_date).toLocaleDateString('uk-UA'),
            send_time: new Date(notification.send_time).toLocaleTimeString('uk-UA', {
                hour: '2-digit',
                minute: '2-digit',
            }), 
        };

        return formattedNotification;
    }

    // сповіщення про низький рівень запасу таблеток
    async createLowStockNotification(db, containerId, medicationId) {
        const container = await db.container.findUnique({
            where: { id_container: Number(containerId) },
            include: { 
                User: true, 
                Inventory: {
                    include: { Medication: true }
                }
            }
        });

        if (!container) {
            return { message: "Container not found" };
        }

        const inventory = container.Inventory.find(item => item.id_medication === Number(medicationId));
        
        if (!inventory || !inventory.Medication) {
            return { message: "Medication not found in the container." };
        }

        if (inventory.quantity >= 2) {
            return { message: "Sufficient stock available for the medication." };
        }

        const notification = await db.notification.create({
            data: {
                text: `Low stock alert for ${inventory.Medication.medication_name}. Only ${inventory.quantity} tablet(s) left. Please refill the container.`,
                send_date: new Date(),
                send_time: new Date(),
                id_container: container.id_container,
            },
        });

        const formattedNotification = {
            ...notification,
            send_date: new Date(notification.send_date).toLocaleDateString('uk-UA'),
            send_time: new Date(notification.send_time).toLocaleTimeString('uk-UA', {
                hour: '2-digit',
                minute: '2-digit',
            }),
        };

        return formattedNotification;
    }
}
