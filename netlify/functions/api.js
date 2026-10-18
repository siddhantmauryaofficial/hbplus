import serverless from "serverless-http";
import { app } from "../../server/index.js";

const handleRequest = serverless(app, {
  basePath: "/.netlify/functions/api",
});

export const handler = async (event, context) => handleRequest(event, context);
