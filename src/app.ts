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

// const user_microservices_url = 'http://44.205.172.214:3001';
// const valoration_microservices_url = 'http://52.1.165.16:3002';
// const payment_microservices_url = 'http://44.215.98.61:3003';

const user_microservices_url = 'http://localhost:3001';
const valoration_microservices_url = 'http://localhost:3002';
const payment_microservices_url = 'http://localhost :3003';

app.use(morgan('dev'));

const publicPaths = [
  '/api/v1/users/sign_up',
  '/api/v1/users/sign_in',
  '/api/v1/users/health',
  '/api/v1/users/activate/[^/]+',
  '/api/v1/users/ubication/[^/]+', //todo: check this
  '/api/v1/gateway/health',
  '/api/v1/valorations/health',
  '/api/v1/comments/health',
  '/api/v1/publications/health',
  '/api/v1/services/health',
  '/api/v1/payments/health'
];

app.use(rateLimiter);

app.use((req, res, next) => {
  if (publicPaths.includes(req.path) || publicPaths.some(path => new RegExp(path).test(req.path))) {
    next();
  } else {
    JWTMiddleware.VerifyToken(req, res, next);
  }
});

app.use('/api/v1/users', proxy(user_microservices_url, {
  proxyReqPathResolver: (req) => `/users${req.url}`
}));

app.use('/api/v1/tags', proxy(user_microservices_url, {
  proxyReqPathResolver: (req) => `/tags${req.url}`
}));

app.use('/api/v1/user_tags', proxy(user_microservices_url, {
  proxyReqPathResolver: (req) => `/user_tags${req.url}`
}));

app.use('/api/v1/payments', proxy(payment_microservices_url, {
  proxyReqPathResolver: (req) => `/payments${req.url}`
}));

app.use('/api/v1/services', proxy(payment_microservices_url, {
  proxyReqPathResolver: (req) => `/services${req.url}`
}));

app.use('/api/v1/valorations', proxy(valoration_microservices_url, {
  proxyReqPathResolver: (req) => {
    return `/valorations${req.url.replace(/\/$/, '')}`;
  },
  }
));
app.use('/api/v1/publications', proxy(valoration_microservices_url, {
  proxyReqPathResolver: (req) => {
    return `/publications${req.url.replace(/\/$/, '')}`;
  },
  }
));
app.use('/api/v1/comments', proxy(valoration_microservices_url, {
  proxyReqPathResolver: (req) => {
    return `/comments${req.url.replace(/\/$/, '')}`;
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
