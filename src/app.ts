import express, { Application } from "express";
import morgan from "morgan";
import dotenv from 'dotenv';
import { Signale } from "signale";
import proxy from "express-http-proxy";
import JWTMiddleware from "./middleware/JWTMiddleware";
import { AuthTokenBanned } from "./infraestructure/Dependencies";
import { rateLimiter } from "./middleware/RateLimiter";
import bodyParser from "body-parser";
import cors from 'cors';

dotenv.config();

const app = express();
app.use(cors({
  methods: ['GET', 'POST', 'DELETE', 'UPDATE', 'PUT', 'PATCH'],
}));
const signale = new Signale();
const PORT = process.env.PORT || 3000;
const GATEWAY = process.env.SERVICE_NAME;
let server = null;


app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

const user_microservices_url = 'https://onwork-user.integrador.xyz';
const valoration_microservices_url = 'https://onwork-publication.integrador.xyz';
const payment_microservices_url = 'https://onwork-payments.integrador.xyz';

// const user_microservices_url = 'http://localhost:3001';
// const valoration_microservices_url = 'http://localhost:3002';
// const payment_microservices_url = 'http://localhost:3003';

app.use(morgan('dev'));
app.set('trust proxy', ['loopback', 'linklocal', 'uniquelocal']);

const publicPaths = [
  '/api/v1/users/sign_up',
  '/api/v1/users/sign_in',
  '/api/v1/users/health',
  '/api/v1/users/refresh/[^/]+',
  '/api/v1/users/activate/[^/]+',
  '/api/v1/users/ubication/[^/]+', //todo: check this
  '/api/v1/users/token/[^/]+', //todo: check this
  '/api/v1/gateway/health',
  '/api/v1/valorations/health',
  '/api/v1/chats/health',
  '/api/v1/messages/health',
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

app.use('/api/v1/messages', proxy(user_microservices_url, {
  proxyReqPathResolver: (req) => `/messages${req.url}`
}));

app.use('/api/v1/chats', proxy(user_microservices_url, {
  proxyReqPathResolver: (req) => `/chats${req.url}`
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
