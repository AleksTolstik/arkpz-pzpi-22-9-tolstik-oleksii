export class RegisterService {
    async createUserAccount(db, data, role) {
        try {
            if (data.birth_date) {
                const parsedDate = new Date(data.birth_date);
                data.birth_date = parsedDate;
                console.log(parsedDate);
            }

            const newUser = await db.user.create({
                data: {
                    ...data,
                    id_role: role,
                },
            });
            return { message: 'Account created successfully', first_name: newUser.first_name, email: newUser.email };
        } catch (error) {
            throw new Error(`Error creating User: ${error.message}`);
        }
    }

    async findUserByEmail(db, email, role) {
        try {
            const user = await db.user.findFirst({
                where: {
                    email: email,
                    id_role: role,
                },
            });
            return user;
        } catch (error) {
            throw new Error(`Error finding User by email: ${error.message}`);
        }
    }
}
