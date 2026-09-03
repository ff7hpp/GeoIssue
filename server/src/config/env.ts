import path from 'path';
import dotenv from 'dotenv';

// Support commands launched from either the repository root or server/.
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), 'server/.env') });

const nodeEnv = process.env.NODE_ENV || 'development';
const jwtSecret = process.env.JWT_SECRET;

if (nodeEnv === 'production' && !jwtSecret) {
  throw new Error('JWT_SECRET is required when NODE_ENV=production');
}

export const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  nodeEnv,
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  databaseUrl: process.env.DATABASE_URL || '',
  matchRadiusMeters: parseFloat(process.env.MATCH_RADIUS_METERS || '50'),
  geocodingTimeout: parseInt(process.env.GEOCODING_TIMEOUT || '5000', 10),
  jwtSecret: jwtSecret || 'geoissue_local_development_jwt_secret',
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID || '',
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL || '',
    privateKey: process.env.FIREBASE_PRIVATE_KEY
      ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
      : '',
  },
};
