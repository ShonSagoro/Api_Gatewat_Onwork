import express, { Application } from "express";
import morgan from "morgan";
import dotenv from 'dotenv';
import { Signale } from "signale";
import proxy from "express-http-proxy";
import JWTMiddleware from "./middleware/JWTMiddleware";
import { AuthTokenBanned } from "./infraestructure/Dependencies";
import { rateLimiter } from "./middleware/RateLimiter";

dotenv.config();

const app: Application = express();
const signale = new Signale();
const PORT = process.env.PORT || 3000;
const GATEWAY = process.env.SERVICE_NAME;
let server = null;

const user_url = 'http://localhost:3001';
const tags_url = 'http://localhost:3001';
const user_tag_url = 'http://localhost:3001';
const valoration_url = 'http://localhost:3002';

app.use(morgan('dev'));

const publicPaths = [
  '/api/v1/users/sign_up',
  '/api/v1/users/sign_in',
  '/api/v1/users/health',
  '/api/v1/users/activate/[^/]+',
  '/api/v1/gateway/health',
  '/api/v1/valorations/health'
];

app.use(rateLimiter);

// app.use((req, res, next) => {
//   if (publicPaths.includes(req.path) || publicPaths.some(path => new RegExp(path).test(req.path))) {
//     next();
//   } else {
//     JWTMiddleware.VerifyToken(req, res, next);
//   }
// });

app.use('/api/v1/users', proxy(user_url, {
  proxyReqPathResolver: (req) => `/users${req.url}`
}));

app.use('/api/v1/tags', proxy(tags_url, {
  proxyReqPathResolver: (req) => `/tags${req.url}`
}));

app.use('/api/v1/user_tags', proxy(user_tag_url, {
  proxyReqPathResolver: (req) => `/user_tags${req.url}`
}));

app.use('/api/v1/valorations', proxy(valoration_url, {
  proxyReqPathResolver: (req) => {
    // Normaliza la URL eliminando la barra final
    return `/valorations${req.url.replace(/\/$/, '')}`;
  },
  }
));
app.get('/api/v1/gateway/health', (req, res) => {
  res.status(200).json({ message: 'Gateway is healthy' });
});

app.use((err: any, req: any, res: any, next: any) => {
  signale.error(err);
  res.status(500).send('Something broke!');
});

async function startServer() {
  await AuthTokenBanned();
  server = app.listen(PORT, () => {
    signale.success(`Servicio ${GATEWAY} corriendo en http://localhost:${PORT}`);
  });
}

startServer();
