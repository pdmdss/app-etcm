import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { concatMap } from 'rxjs/operators';
import { Oauth2Service } from './oauth2.service';

@Injectable({
  providedIn: 'root'
})
export class RequestService {
  constructor(private http: HttpClient, private oauth2: Oauth2Service) {
  }

  protected get<T>(url: string, params?: { [key: string]: string }, response?: false): Observable<T>;
  protected get<T>(url: string, params: { [key: string]: string }, response: true): Observable<HttpResponse<T>>;
  protected get<T>(url: string, params?: { [key: string]: string }, response = false) {
    return this.request<T>('GET', url, params)
      .pipe(concatMap(r => response ? of(r) : of(r.body)));
  }

  protected post<T>(url: string, postBody?: any, params?: { [key: string]: string },
                    contentType?: 'form' | 'json', response?: false): Observable<T>;
  protected post<T>(url: string, postBody: any, params: { [key: string]: string },
                    contentType: 'form' | 'json', response: true): Observable<HttpResponse<T>>;
  protected post<T>(url: string, postBody?: any, params?: { [key: string]: string },
                    contentType: 'form' | 'json' = 'form', response = false) {
    const body = contentType === 'form' ?
      new HttpParams({ fromObject: postBody }).toString() :
      JSON.stringify(postBody);

    return this.request<T>('POST', url, params, body || null, contentType)
      .pipe(concatMap(r => response ? of(r) : of(r.body)));
  }

  protected put<T>(url: string, postBody?: any, params?: { [key: string]: string },
                   contentType?: 'form' | 'json', response?: false): Observable<T>;
  protected put<T>(url: string, postBody: any, params: { [key: string]: string },
                   contentType: 'form' | 'json', response: true): Observable<HttpResponse<T>>;
  protected put<T>(url: string, postBody?: any, params?: { [key: string]: string },
                   contentType: 'form' | 'json' = 'form', response = false) {
    const body = contentType === 'form' ?
      new HttpParams({ fromObject: postBody }).toString() :
      JSON.stringify(postBody);

    return this.request<T>('PUT', url, params, body || null, contentType)
      .pipe(concatMap(r => response ? of(r) : of(r.body)));
  }

  protected patch<T>(url: string, postBody?: any, params?: { [key: string]: string },
                     contentType?: 'form' | 'json', response?: false): Observable<T>;
  protected patch<T>(url: string, postBody: any, params: { [key: string]: string },
                     contentType: 'form' | 'json', response: true): Observable<HttpResponse<T>>;
  protected patch<T>(url: string, postBody?: any, params?: { [key: string]: string },
                     contentType: 'form' | 'json' = 'form', response = false) {
    const body = contentType === 'form' ?
      new HttpParams({ fromObject: postBody }).toString() :
      JSON.stringify(postBody);

    return this.request<T>('PATCH', url, params, body || null, contentType)
      .pipe(concatMap(r => response ? of(r) : of(r.body)));
  }


  protected delete<T>(url: string, params?: { [key: string]: string }, response?: false): Observable<T>;
  protected delete<T>(url: string, params: { [key: string]: string }, response: true): Observable<HttpResponse<T>>;
  protected delete<T>(url: string, params?: { [key: string]: string }, response = false) {
    return this.request<T>('DELETE', url, params)
      .pipe(concatMap(r => response ? of(r) : of(r.body)));
  }

  private request<T>(method: string, url: string, params?: { [key: string]: string },
                     payload?: string | null, contentType: 'form' | 'json' = 'form'): Observable<HttpResponse<T>> {

    const contentTypeHeader = contentType === 'form' ?
      'application/x-www-form-urlencoded' :
      'application/json';

    return this.oauth2
      .getAuthorizationRxjs()
      .pipe(
        concatMap(token =>
          this.oauth2.getDPoPProofJWT(method, url)
            .pipe(concatMap(dpop =>
              of([
                  token,
                  dpop
                ] as [string, string | null]
              )
            ))
        ),
        concatMap(([token, dpop]) =>
          this.http
            .request<T>(method, url, {
              params: { ...params },
              body: payload,
              observe: 'response',
              responseType: 'json',
              headers: {
                'content-type':
                contentTypeHeader,
                authorization: token,
                ...(dpop ? { dpop } : {})
              }
            })
        )
      );
  }
}
