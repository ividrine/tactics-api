import express from "express";
import openApiSpec from "../../docs/openApiSpec.js";
import { apiReference } from "@scalar/express-api-reference";

const router = express.Router();

router.use(
  "/",
  apiReference({
    theme: "default",
    content: openApiSpec
  })
);

export default router;
