import "dotenv/config";
import { app } from "./index.js";

const port = Number(process.env.PORT || 3001);
const host = process.env.API_HOST || "0.0.0.0";
const allowedDomain = (process.env.ALLOWED_DOMAIN || "hbplus.fit").toLowerCase();
const skipDomainCheck = process.env.NODE_ENV !== "production"
  && process.env.SKIP_EMAIL_DOMAIN_CHECK?.trim().toLowerCase() === "true";

app.listen(port, host, () => {
  console.log(`HB+ Access server listening on http://${host}:${port}`);
  console.log(
    skipDomainCheck
      ? "Email domain restriction is disabled for local testing."
      : `Email domain restriction is enforced for @${allowedDomain}.`,
  );
});
