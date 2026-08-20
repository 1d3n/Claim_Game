import { FreeGame } from '../detectors/types.js';

export type ClaimStatus = 'success' | 'already_owned' | 'captcha_required' | 'manual_required' | 'failed';

export interface ClaimResult {
  game: FreeGame;
  status: ClaimStatus;
  message: string;
  manualUrl?: string;
  errorDetails?: string;
}
