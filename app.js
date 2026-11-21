import express from 'express';
import 'dotenv/config';
import cors from 'cors';
import { connectMongoDB } from './src/db/connectMongoDB.js';
import helmet from 'helmet';
import { logger } from './src/middleware/logger.js';
import { errorHandler } from './src/middleware/errorHandler.js';
import { notFoundHandler } from './src/middleware/notFoundHandler.js';
import { errors } from 'celebrate';
import applicationRouter from './src/routes/applicationsRoutes.js';
import authRouter from './src/routes/AuthRoutes.js';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';
import { readFileSync } from 'node:fs';

const swaggerDocument = JSON.parse(
  readFileSync(new URL('./swagger.json', import.meta.url), 'utf-8'),
);

const app = express();

// {LIBRARIES} //
app.use(helmet());

app.use(cors({
  origin: '*'
}));

app.use(logger());

app.use(express.json());

app.use(cookieParser());

// {ROUTES} //

app.use(authRouter);

app.use(applicationRouter);

// {API DOCS} //

app.use(
  '/api-docs',
  helmet({
    contentSecurityPolicy: {
      directives: {
        'default-src': ["'self'"],
        'script-src': ["'self'", "'unsafe-inline'"],
        'style-src': ["'self'", "'unsafe-inline'"],
        'img-src': ["'self'", 'data:'],
        'connect-src': ["'self'"],
      },
    },
  }),
  swaggerUi.serve,
  swaggerUi.setup(swaggerDocument, {
    customSiteTitle: 'Job Tracker API Docs',
  }),
);

// {ERROR MIDLEWARE} //

app.use(notFoundHandler);

app.use(errors());

app.use(errorHandler);

// {CONNECTION TO DB} //

await connectMongoDB();

app.listen(process.env.PORT, () => {
  console.log(`Server is running at http://localhost:${process.env.PORT}/`);
});
