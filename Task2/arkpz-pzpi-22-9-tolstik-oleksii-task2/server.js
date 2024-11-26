import express from 'express';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import session from 'express-session';
import { PrismaClient } from '@prisma/client';
import { registerRouter } from './src/registration/registration.controller.js';
import { loginRouter } from './src/login/login.controller.js';
import { profileRouter } from './src/profile/profile.controller.js';
import { medicationRouter } from './src/medication/medication.controller.js';
import { mainRouter } from './src/main/main.controller.js';
import { containerRouter } from './src/container/container.controller.js';

dotenv.config();

const prisma = new PrismaClient();
const app = express();

async function main() {
    app.use(express.json()); 
    
    app.use(cookieParser());
    
    app.use((req, res, next) => {
        req.db = prisma;
        next();
    });

    app.use(session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: true,
        cookie: { 
            secure: false, 
            maxAge: 60 * 60 * 1000    
        } 
    }));

    //Маршрути
    app.use('/register', registerRouter);
    
    app.use('/login', loginRouter);

    app.use('/medication', medicationRouter);

    app.use('/main', mainRouter);

    app.use('/container', containerRouter);

    app.use('/profile', profileRouter);


    app.all('*', (req, res) => {
        res.status(404).json({ message: 'Not Found' });
    });

    app.use((err, req, res, next) => {
        console.error(err.stack);
        res.status(500).send('Oops, something happened...');
    });

    app.listen(process.env.PORT || 4200, () => {
        console.log(`Server is running on port ${process.env.PORT || 4200}`);
    });
}

main().catch((err) => {
    console.error(err);
    prisma.$disconnect();
});