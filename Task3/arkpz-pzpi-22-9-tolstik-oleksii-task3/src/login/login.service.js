import bcrypt from 'bcrypt';

export class LoginService {
    async loginUser(db, roleId, email, password) {
        const user = await db.user.findFirst({
            where: { 
                email: email,
                id_role: roleId,
             },
        });

        if (user && bcrypt.compareSync(password, user.password)) {
            return user;
        }
        return null;
    }
}
