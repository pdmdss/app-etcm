import { Injectable } from '@angular/core';
import { OAuth2Code } from '@dmdata/oauth2-client';
import { from, interval, Observable, take, tap } from 'rxjs';
import { concatMap, filter } from 'rxjs/operators';

import { Settings } from '@/db/settings';

import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class Oauth2Service {
  private oauth2?: OAuth2Code;
  private refreshToken?: string;

  constructor() {
    this.init();
  }

  async refreshTokenDelete() {
    await Settings.delete('oauthRefreshToken');
    this.refreshToken = undefined;
  }

  async oAuth2ClassReInit() {
    await this.init();
  }

  getAuthorizationRxjs(): Observable<string> {
    if (!this.oauth2) {
      return interval(100)
        .pipe(
          tap(() => console.log(this.oauth2)),
          filter(() => !!this.oauth2),
          take(1),
          concatMap(() => this.getAuthorizationRxjs())
        );
    }

    return from(this.oauth2.getAuthorization());
  }

  getDPoPProofJWT(method: string, uri: string, nonce?: string | null) {
    return from(this.oauth2?.getDPoPProofJWT(method, uri, nonce) ?? Promise.resolve(null));
  }

  async refreshTokenCheck() {
    return !!await Settings.get('oauthRefreshToken');
  }

  async init() {
    const refreshToken = Settings.get('oauthRefreshToken');

    const oauthDPoPKeypair = Settings.get('oauthDPoPKeypair').then(res => res ? res : 'ES384');

    this.oauth2 = new OAuth2Code({
      endpoint: {
        authorization: 'https://manager.dmdata.jp/account/oauth2/v1/auth',
        token: 'https://manager.dmdata.jp/account/oauth2/v1/token',
        introspect: 'https://manager.dmdata.jp/account/oauth2/v1/introspect'
      },
      client: {
        id: 'CId.xyw6-lPflvaxR9CrGR-zHBfGJ_8dUmVtai_61qRSplwM',
        scopes: [
          'contract.list',
          'parameter.earthquake',
          'socket.start',
          'telegram.list',
          'telegram.data',
          'telegram.get.earthquake',
          'gd.earthquake'
        ],
        redirectUri: environment.OAUTH_REDIRECT_URI
      },
      pkce: true,
      refreshToken,
      dpop: oauthDPoPKeypair
    });

    this.refreshToken = await refreshToken;

    this.oauth2
      .on('refresh_token', refreshToken => Settings.set('oauthRefreshToken', refreshToken))
      .on('dpop_keypair', keypair => Settings.set('oauthDPoPKeypair', keypair));
  }
}
