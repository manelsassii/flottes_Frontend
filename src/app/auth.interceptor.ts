import { HttpEvent, HttpHandlerFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Observable } from 'rxjs';

export function authInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> {
  const platformId = inject(PLATFORM_ID);
  let authReq = req;

  if (isPlatformBrowser(platformId)) {
    const token = localStorage.getItem('token');
    console.log('Interceptor - Token pour', req.url, ':', token ? 'Présent' : 'Absent');
    if (token) {
      authReq = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
        },
      });
    }
  } else {
    console.log('Interceptor - Token: Non disponible (SSR) pour', req.url);
  }

  return next(authReq);
}