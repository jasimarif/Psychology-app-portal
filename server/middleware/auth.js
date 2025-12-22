import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

const initializeFirebase = () => {
  if (!admin.apps.length) {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (!projectId || !clientEmail || !privateKey) {
      console.error('Firebase Admin credentials are missing in .env file');
      console.error('Required: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY');
      throw new Error('Firebase Admin credentials not configured');
    }

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: projectId,
        clientEmail: clientEmail,
        privateKey: privateKey.replace(/\\n/g, '\n'),
      }),
    });
    
  }
};

try {
  initializeFirebase();
} catch (error) {
  console.error('Failed to initialize Firebase Admin:', error.message);
}

export const verifyToken = async (req, res, next) => {
  try {
   
    
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('No valid auth header');
      return res.status(401).json({
        success: false,
        message: 'No token provided. Authorization header must be in format: Bearer <token>'
      });
    }

    const token = authHeader.split('Bearer ')[1];

    if (!token) {
      console.log('No token after Bearer');
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const decodedToken = await admin.auth().verifyIdToken(token);
    
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      emailVerified: decodedToken.email_verified
    };

    next();
  } catch (error) {
    
    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired. Please log in again.'
      });
    }
    
    if (error.code === 'auth/argument-error') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token format'
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const checkUserOwnership = (req, res, next) => {
  try {
    const { userId } = req.params;
    const authenticatedUserId = req.user.uid;
    
    if (userId !== authenticatedUserId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only access your own profile.'
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error verifying user ownership',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
