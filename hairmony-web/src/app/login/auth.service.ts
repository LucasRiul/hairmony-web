import { EventEmitter, Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { Usuario } from './usuario';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { isPlatformBrowser } from '@angular/common';

export interface AuthResponse {
  token: string;
  salao: string;
  // Adicione outras propriedades se o seu backend retornar mais dados no login
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private baseUrl = environment.apiUrl; // ajuste conforme sua API
  private readonly JWT_TOKEN = 'JWT_TOKEN';
  private readonly SALAO_ID = 'SALAO_ID'; // Para armazenar o salaoId do token
  private isAuthenticatedSubject: BehaviorSubject<boolean>;
  public isAuthenticated$: Observable<boolean>;

  private usuarioAutenticado: boolean = false;

  mostrarMenuEmitter = new EventEmitter<boolean>();

  constructor(
    private router: Router,
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isAuthenticatedSubject = new BehaviorSubject<boolean>(this.hasToken());
    this.isAuthenticated$ = this.isAuthenticatedSubject.asObservable();
  }

  login(credentials: Usuario): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.baseUrl}/Auth/login`, credentials)
      .pipe(
        tap((response) => {
           ;
          this.usuarioAutenticado = true;
        this.mostrarMenuEmitter.emit(true);
          this.storeToken(response.token, response.salao);
          this.isAuthenticatedSubject.next(true);
        })
      );
  }

  logout(): void {
    this.removeToken();
    this.isAuthenticatedSubject.next(false);
    this.router.navigate(['/login']); // Redireciona para a página de login
  }

  public getToken(): string | null {
    return localStorage.getItem(this.JWT_TOKEN);
  }

  public getSalaoId(): string | null {
    return localStorage.getItem(this.SALAO_ID);
  }

  public isLoggedIn(): boolean {
    return this.hasToken();
  }

  private hasToken(): boolean {
    if (isPlatformBrowser(this.platformId)) {
      return !!localStorage.getItem(this.JWT_TOKEN);
    }
    return false;
  }

  private storeToken(token: string, salao: string): void {
    localStorage.setItem(this.JWT_TOKEN, token);
    localStorage.setItem(this.SALAO_ID, salao);
  }

  private removeToken(): void {
    localStorage.removeItem(this.JWT_TOKEN);
    localStorage.removeItem(this.SALAO_ID);
  }
}
