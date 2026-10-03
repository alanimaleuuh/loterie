/** Exécution manuelle / cron des tirages arrivés à échéance : npm run draws:run */
import { processDueDraws } from "../src/server/draws/engine";
import { db } from "../src/server/db";

processDueDraws()
  .then((n) => console.log(`${n} tirage(s) traité(s)`))
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
