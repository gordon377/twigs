// app/config/database.ts
export const DatabaseConfig = {
  // ✅ Environment flags - check for 'true'
  RESET_ON_START: process.env.EXPO_PUBLIC_RESET_DB === 'true',
  RESET_IN_DEV: __DEV__ && process.env.EXPO_PUBLIC_RESET_DB_DEV === 'true',
  
  // ✅ Version-based reset
  DB_VERSION: process.env.EXPO_PUBLIC_DB_VERSION || '1.0.0',
  
  // ✅ Code toggle for development
  FORCE_RESET: false,
};