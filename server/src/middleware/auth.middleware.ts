import { Request, Response, NextFunction } from 'express';
import { getFirebaseAuth } from '../config/firebase.js';
import { config } from '../config/env.js';
import { AppError } from '../shared/errors.js';
import { DbUser, UserRole } from '../shared/types.js';
import { usersRepository } from '../modules/users/users.repository.js';

import { verifyToken } from '../shared/auth.utils.js';

interface TrustedIdentity {
  uid: string;
  email: string;
  displayName: string | null;
  role: UserRole;
}

function resolveDevelopmentIdentity(token: string): TrustedIdentity | null {
  if (config.nodeEnv === 'production') return null;

  if (token === 'dev-admin') {
    return {
      uid: 'admin_demo_uid_123',
      email: 'admin@geoissue.org',
      displayName: 'Lead Admin',
      role: 'admin',
    };
  }

  if (token === 'dev-user') {
    return {
      uid: 'citizen_demo_uid_456',
      email: 'citizen@geoissue.org',
      displayName: 'Tariq Al-Mansoor',
      role: 'user',
    };
  }

  if (token.startsWith('mock:')) {
    const uid = token.slice('mock:'.length);
    if (!/^[A-Za-z0-9_-]{1,100}$/.test(uid)) {
      throw AppError.unauthenticated('Invalid mock authentication token');
    }
    return {
      uid,
      email: `${uid}@geoissue.org`,
      displayName: null,
      role: 'user',
    };
  }

  return null;
}

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

    const developmentIdentity = resolveDevelopmentIdentity(token);
    let uid: string;
    let email: string;
    let displayName: string | null;
    let role: UserRole;

    if (developmentIdentity) {
      ({ uid, email, displayName, role } = developmentIdentity);
    } else {
      const firebaseAuth = getFirebaseAuth();
      if (!firebaseAuth) {
        throw AppError.unauthenticated('Invalid authentication token');
      }
      try {
        const decodedToken = await firebaseAuth.verifyIdToken(token);
        uid = decodedToken.uid;
        email = decodedToken.email || `${uid}@geoissue.local`;
        displayName = decodedToken.name || null;
        role = 'user';
      } catch {
        throw AppError.unauthenticated('Invalid authentication token');
      }
    }

    req.firebaseUid = uid;
    req.firebaseEmail = email;

    // Load or lazy sync local user
    let user = await usersRepository.findByFirebaseUid(uid);
    if (!user) {
      const emailOwner = await usersRepository.findByEmail(email);
      if (emailOwner) {
        throw AppError.conflict(
          'An account with this email already uses a different sign-in method'
        );
      }
      user = await usersRepository.upsert({
        firebase_uid: uid,
        email,
        display_name: displayName || (email ? email.split('@')[0] : 'Citizen'),
        role,
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

    const jwtPayload = verifyToken(token);
    if (jwtPayload) {
      const user = await usersRepository.findById(jwtPayload.id);
      if (user && user.account_status !== 'suspended') {
        req.user = user;
      }
      return next();
    }

    const developmentIdentity = resolveDevelopmentIdentity(token);
    let uid: string;
    if (developmentIdentity) {
      uid = developmentIdentity.uid;
    } else {
      const firebaseAuth = getFirebaseAuth();
      if (!firebaseAuth) return next();
      try {
        const decodedToken = await firebaseAuth.verifyIdToken(token);
        uid = decodedToken.uid;
      } catch {
        return next();
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
