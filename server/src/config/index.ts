import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Resolve a path inside the ACE-Step-1.5 model repo. Tries, in order:
 *   1. ACE_STEP_DIR env var (treat as the repo root)
 *   2. Sibling layout: <parent>/ACE-Step-1.5/<sub>      ← user's setup
 *   3. Nested layout:  <ace-step-ui>/ACE-Step-1.5/<sub> ← upstream default
 * Returns the first that exists, or the sibling-layout path as fallback.
 */
function aceStepPath(sub: string): string {
  if (process.env.ACE_STEP_DIR) return path.join(process.env.ACE_STEP_DIR, sub);
  const sibling = path.join(__dirname, '../../../../ACE-Step-1.5', sub);
  if (existsSync(sibling)) return sibling;
  const nested = path.join(__dirname, '../../../ACE-Step-1.5', sub);
  if (existsSync(nested)) return nested;
  return sibling;
}

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  // SQLite database
  database: {
    path: process.env.DATABASE_PATH || path.join(__dirname, '../../data/acestep.db'),
  },

  // ACE-Step API (local)
  acestep: {
    apiUrl: process.env.ACESTEP_API_URL || 'http://localhost:8001',
  },

  // Pexels (optional - for video backgrounds)
  pexels: {
    apiKey: process.env.PEXELS_API_KEY || '',
  },

  // Frontend URL
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',

  // Storage (local only)
  storage: {
    provider: 'local' as const,
    audioDir: process.env.AUDIO_DIR || path.join(__dirname, '../../public/audio'),
  },

  // Training datasets (inside ACE-Step-1.5 so Gradio can access them)
  datasets: {
    dir: process.env.DATASETS_DIR || aceStepPath('datasets'),
    uploadsDir: process.env.DATASETS_UPLOADS_DIR || aceStepPath('datasets/uploads'),
  },

  // Bundled prompt/parameter examples shipped with the ACE-Step model.
  // Used by GET /api/examples to serve the official Gradio sample JSONs.
  examples: {
    dir: process.env.EXAMPLES_DIR || aceStepPath('examples'),
  },

  // Simplified JWT (for local session, not critical security)
  jwt: {
    secret: process.env.JWT_SECRET || 'ace-step-ui-local-secret',
    expiresIn: '365d', // Long-lived for local app
  },
};
