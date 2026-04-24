import { assertAuthTokenSecretConfiguredAtStartup } from "./auth/token-auth.js";
import { buildApp } from "./api/app.js";
import { resolveListenHost, resolveListenPort } from "./config/http-listen.js";
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
  const port = resolveListenPort();
  const host = resolveListenHost();
  try {
    await app.listen({ port, host });
  } catch (error) {
    app.log.error(error);
    if (error instanceof Error && "code" in error && (error as NodeJS.ErrnoException).code === "EADDRINUSE") {
      app.log.error(
        `Port ${port} ist bereits belegt (EADDRINUSE). Anderen Prozess beenden oder z. B. ERP_HTTP_PORT=3001 setzen und PWA VITE_API_BASE_URL anpassen.`,
      );
    }
    process.exit(1);
  }
};

void start();
