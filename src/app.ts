import express from "express";
import config from "./config/config.js";
import helmet from "helmet";
import httpStatus from "http-status";
import compression from "compression";
import routes from "./routes/v1/index.js";
import { xss } from "express-xss-sanitizer";
import { authLimiter } from "./middlewares/rateLimiter.middleware.js";
import ApiError from "./utils/ApiError.js";
import cors from "cors";
import {
  errorConverter,
  errorHandler
} from "./middlewares/error.middleware.js";

const app = express();

// set security HTTP headers
// these are default values needed for scalar docs to work correctly

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://cdn.jsdelivr.net",
          "https://unpkg.com"
        ],
        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://cdn.jsdelivr.net",
          "https://fonts.googleapis.com"
        ],
        fontSrc: [
          "'self'",
          "https://fonts.gstatic.com",
          "https://cdn.jsdelivr.net",
          "https://unpkg.com",
          "https://fonts.scalar.com",
          "data:"
        ],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"]
      }
    }
  })
);

// parse json request body
app.use(express.json());

// parse html/text for SNS notifications
app.use(express.text());

// parse urlencoded request body
app.use(express.urlencoded({ extended: true }));

// sanitize Request Data
app.use(xss());

// gzip compression
app.use(compression());

// enable cors
app.use(cors());

// limit repeated failed requests to auth endpoints
if (config.env === "production") {
  app.use("/v1/auth", authLimiter);
}

// v1 api routes
app.use("/v1", routes);

// Handle favicon requests
app.get("/favicon.ico", (req, res) => res.status(204).end());

// send back a 404 error for any unknown api request
app.use((req, res, next) => {
  next(new ApiError(httpStatus.NOT_FOUND, "Not found"));
});

// convert error to ApiError, if needed
app.use(errorConverter);

// handle error
app.use(errorHandler);

export default app;
