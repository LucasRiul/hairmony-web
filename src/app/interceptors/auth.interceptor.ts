import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Recuperar o token do localStorage
  const token = localStorage.getItem('JWT_TOKEN');

  if (token) {
    // Clone a requisição e adicione o token no cabeçalho Authorization
    const authReq = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`)
    });
    return next(authReq);
  }

  // Se não houver token, prossiga com a requisição original
  return next(req);
};
