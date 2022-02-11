import { Injectable } from '@angular/core';

import { OAuth2Code } from '@dmdata/oauth2-client';

import { Settings } from '@/db/settings';

import { environment } from '../../environments/environment';
import { from, interval, Observable } from 'rxjs';
import { concatMap, filter, take, tap } from 'rxjs/operators';

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
          filter(() => !!this.oauth2),
          take(1),
          concatMap(() => this.getAuthorizationRxjs())
        );
    }

    return from(this.oauth2.getAuthorization())
      .pipe(tap(() => !this.refreshToken && this.refreshTokenSave()));
  }

  getDPoPProofJWT(method: string, uri: string) {
    return from(this.oauth2?.getDPoPProofJWT(method, uri) ?? Promise.resolve(null));
  }

  async refreshTokenCheck() {
    return !!await Settings.get('oauthRefreshToken');
  }

  private async refreshTokenSave() {
    const refreshToken = this.refreshToken = this.oauth2?.getRefreshToken();
    refreshToken && await Settings.set('oauthRefreshToken', refreshToken);
  }

  private async init() {
    const refreshToken = this.refreshToken = await Settings.get('oauthRefreshToken');

    this.oauth2 = new OAuth2Code({
      endpoint: {
        authorization: 'https://manager.dmdata.jp/account/oauth2/v1/auth',
        token: 'https://manager.dmdata.jp/account/oauth2/v1/token'
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
      dpop: 'ES384'
    });
  }
}
