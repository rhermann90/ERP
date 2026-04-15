import { assertAuthTokenSecretConfiguredAtStartup } from "./auth/token-auth.js";
import { buildApp } from "./api/app.js";
import { assertFailClosedProductionDatabase } from "./config/repository-mode.js";

assertAuthTokenSecretConfiguredAtStartup();
assertFailClosedProductionDatabase();

const app = await buildApp();

if (process.env.ERP_ALLOW_INSECURE_DEV_AUTH === "1" && process.env.NODE_ENV !== "production") {
  app.log.warn(
    "ERP_ALLOW_INSECURE_DEV_AUTH=1 aktiv: unsicherer Demo-Auth-Mode; niemals in Produktion verwenden.",
  );
}

const start = async () => {
  try {
    await app.listen({ port: 3000, host: "0.0.0.0" });
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
};

void start();
