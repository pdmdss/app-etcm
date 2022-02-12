import { Keypair } from '@dmdata/oauth2-client';

export type AppSettings = {
  oauthRefreshToken: string;
  soundPlayAutoActivation: boolean;
  oauthDPoPKeypair: Keypair;
}
