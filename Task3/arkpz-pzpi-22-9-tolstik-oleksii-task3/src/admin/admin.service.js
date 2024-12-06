export class AdminService {
    // зміна ролі користувача
    async changeRole(db, userId, newRoleId) {
        return await db.user.update({
            where: { id_user: Number(userId) },
            data: { id_role: Number(newRoleId) },
        });
    }

    // отримання всіх користувачів за роллю
    async getUsersByRole(db, id_role) {
        const filter = id_role ? { id_role: Number(id_role) } : {};
        return await db.user.findMany({
            where: filter,
            select: {
                id_user: true,
                email: true,
                last_name: true,
                first_name: true,
                id_role: true,
            },
        });
    }

    // додавання нової ролі
    async addRole(db, roleName) {
        return await db.userRole.create({
            data: { role_name: roleName },
        });
    }

    // отримання всіх ролей
    async getRoles(db) {
        return await db.userRole.findMany();
    } 

    // видалення користувача
    async deleteUser(db, userId) {
        return await db.user.delete({
            where: { id_user: Number(userId) },
        });
    }

    // блокування користувача
    async blockUser(db, userId) {
        return await db.user.update({
            where: { id_user: Number(userId) },
            data: { id_role: 0 },
        });
    }

    // отримання всіх повідомлень
    async getNotifications(db) {
        return await db.notification.findMany({
            select: {
                text: true,
                send_date: true,
                send_time: true,
            },
        });
    }

    // отримання статистики контейнерів
    async getContainerStats(db) {
        return await db.container.findMany({
            select: {
                id_container: true,
                operational_status: true,
                network_status: true,
            },
        });
    }

    // отримання статистики лікування пацієнта
    async getTreatmentStats(db, patientId) {
        return await db.prescription.findMany({
            where: { id_patient: Number(patientId) },
            select: {
                diagnosis_name: true,
                prescription_date: true,
                MedicationInPrescription: {
                    select: {
                        Medication: { select: { medication_name: true } },
                        dosage_duration: true,
                    },
                },
            },
        });
    }
}
