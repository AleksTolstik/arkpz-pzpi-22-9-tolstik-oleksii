import bcrypt from 'bcrypt';

export class LoginService {
    async loginUser(db, tableName, email, password) {
        const user = await db[tableName].findFirst({
            where: { email },
        });

        if (user && bcrypt.compareSync(password, user.password)) {
            return user;
        }
        return null;
    }
}
