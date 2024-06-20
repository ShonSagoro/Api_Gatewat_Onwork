import express, {Application} from "express";
import morgan from "morgan";
import dotenv from 'dotenv';
import {Signale} from "signale";
import proxy from "express-http-proxy";
import JWTMiddleware from "./middleware/JWTMiddleware";
import { AuthTokenBanned } from "./infraestructure/Dependencies";

dotenv.config();

const app:Application = express();
const signale = new Signale();
const PORT = process.env.PORT || 3000;
const GATEWAY = process.env.SERVICE_NAME;
let server = null;
let user_url = process.env.USER_MICROSERVICES_URL || 'http://localhost:3001';
app.use(morgan('dev'));

const publicPaths = [
  '/api/v1/users/sign_up',
  '/api/v1/users/sign_in',
  '/api/v1/users/health',
  '/api/v1/users/activate/[^/]+'
];

app.use((req, res, next) => {
    if (publicPaths.includes(req.path) || publicPaths.some(path => new RegExp(path).test(req.path))) {
      next();
    } else {
      JWTMiddleware.VerifyToken(req, res, next);
    }
  });

app.use('/api/v1/users', proxy(user_url));

async function startServer() {
    await AuthTokenBanned();   
    server = app.listen(PORT, () => {
        signale.success(`Servicio ${GATEWAY} corriendo en http://localhost:${PORT}`);
    });
    
}

startServer();

