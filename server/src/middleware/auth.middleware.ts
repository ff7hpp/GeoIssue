import { Request, Response, NextFunction } from 'express';
import { getFirebaseAuth } from '../config/firebase.js';
import { AppError } from '../shared/errors.js';
import { DbUser, UserRole } from '../shared/types.js';
import { usersRepository } from '../modules/users/users.repository.js';

import { verifyToken } from '../shared/auth.utils.js';

declare global {
  namespace Express {
    interface Request {
      user?: DbUser;
      firebaseUid?: string;
      firebaseEmail?: string;
    }
  }
}

export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw AppError.unauthenticated('Authorization bearer token is missing');
    }

    const token = authHeader.split('Bearer ')[1].trim();
    if (!token) {
      throw AppError.unauthenticated('Authorization token is empty');
    }

    // 1. Check if token is a GeoIssue signed JWT token
    const jwtPayload = verifyToken(token);
    if (jwtPayload) {
      const user = await usersRepository.findById(jwtPayload.id);
      if (!user) {
        throw AppError.unauthenticated('User associated with token not found');
      }
      if (user.account_status === 'suspended') {
        throw AppError.forbidden('Your account is currently suspended.');
      }
      req.user = user;
      return next();
    }

    const firebaseAuth = getFirebaseAuth();
    let uid: string;
    let email: string;
    let displayName: string | null = null;

    if (firebaseAuth) {
      try {
        const decodedToken = await firebaseAuth.verifyIdToken(token);
        uid = decodedToken.uid;
        email = decodedToken.email || `${uid}@geoissue.local`;
        displayName = decodedToken.name || null;
      } catch (err: any) {
        throw AppError.unauthenticated(`Invalid authentication token: ${err.message}`);
      }
    } else {
      // Dev / Test / Demo mock token support
      if (token.startsWith('mock:')) {
        uid = token.replace('mock:', '');
        email = `${uid}@geoissue.org`;
      } else if (token === 'dev-admin') {
        uid = 'admin_demo_uid_123';
        email = 'admin@geoissue.org';
        displayName = 'Lead Admin';
      } else if (token === 'dev-user') {
        uid = 'citizen_demo_uid_456';
        email = 'citizen@geoissue.org';
        displayName = 'Tariq Al-Mansoor';
      } else {
        // Assume raw UID or token in dev mode
        uid = token;
        email = `${token}@geoissue.org`;
      }
    }

    req.firebaseUid = uid;
    req.firebaseEmail = email;

    // Load or lazy sync local user
    let user = await usersRepository.findByFirebaseUid(uid);
    if (!user) {
      user = await usersRepository.upsert({
        firebase_uid: uid,
        email,
        display_name: displayName || (email ? email.split('@')[0] : 'Citizen'),
        role: email.includes('admin') || uid.includes('admin') ? 'admin' : 'user',
        language: 'en',
        account_status: 'active',
      });
    }

    if (user.account_status === 'suspended') {
      throw AppError.forbidden('Your account is currently suspended.');
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

export async function optionalAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  try {
    const token = authHeader.split('Bearer ')[1].trim();
    if (!token) return next();

    const firebaseAuth = getFirebaseAuth();
    let uid: string;
    let email: string;

    if (firebaseAuth) {
      try {
        const decodedToken = await firebaseAuth.verifyIdToken(token);
        uid = decodedToken.uid;
        email = decodedToken.email || `${uid}@geoissue.local`;
      } catch {
        return next();
      }
    } else {
      if (token.startsWith('mock:')) {
        uid = token.replace('mock:', '');
      } else if (token === 'dev-admin') {
        uid = 'admin_demo_uid_123';
      } else if (token === 'dev-user') {
        uid = 'citizen_demo_uid_456';
      } else {
        uid = token;
      }
    }

    const user = await usersRepository.findByFirebaseUid(uid);
    if (user && user.account_status !== 'suspended') {
      req.user = user;
    }
    next();
  } catch {
    next();
  }
}

export function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(AppError.unauthenticated('Authentication required'));
    }
    if (!roles.includes(req.user.role)) {
      return next(
        AppError.forbidden(`Access restricted to role(s): ${roles.join(', ')}`)
      );
    }
    next();
  };
}
