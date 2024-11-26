export class RegisterService {
    async createUserAccount(db, tableName, data, role) {
        try {
            if (data.birth_date) {
                const parsedDate = new Date(data.birth_date);
                data.birth_date = parsedDate;
                console.log(parsedDate);
            }

            const newUser = await db[tableName].create({
                data: {
                    ...data,
                    id_role: role,
                },
            });
            return { message: 'Account created successfully', first_name: newUser.first_name, email: newUser.email };
        } catch (error) {
            throw new Error(`Error creating ${tableName}: ${error.message}`);
        }
    }

    async findUserByEmail(db, tableName, email) {
        try {
            const user = await db[tableName].findFirst({
                where: { email },
            });
            return user;
        } catch (error) {
            throw new Error(`Error finding ${tableName} by email: ${error.message}`);
        }
    }
}
