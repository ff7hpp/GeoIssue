import { app } from './app.js';
import { config } from './config/env.js';
import { initDb } from './db/pool.js';
import { initFirebase } from './config/firebase.js';

async function bootstrap() {
  try {
    console.log('Initializing GeoIssue backend service...');

    // Initialize DB connection / store
    await initDb();

    // Initialize Firebase
    initFirebase();

    app.listen(config.port, () => {
      console.log(`GeoIssue API running on http://localhost:${config.port}`);
      console.log(`Environment: ${config.nodeEnv}`);
      console.log(`Match radius threshold: ${config.matchRadiusMeters} meters`);
    });
  } catch (err) {
    console.error('Fatal error during startup:', err);
    process.exit(1);
  }
}

bootstrap();
