import { Component, OnInit } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from './login/auth.service';

import { NavigationEnd, Event } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',


})
export class AppComponent implements OnInit {
  title = 'salveee';
  isLoginPage: boolean = false;

  constructor(private authService: AuthService, private router: Router) {

  }

  ngOnInit() {
    // Verificar a rota inicial
    this.checkIfLoginPage(this.router.url);
    
    // Escutar mudanças de rota
    this.router.events.pipe(
      filter((event: Event): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.checkIfLoginPage(event.url);
    });
  }
  
  checkIfLoginPage(url: string): void {
    this.isLoginPage = url.includes('/login');
  }
}
