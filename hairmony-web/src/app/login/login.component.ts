import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from './auth.service';
import { Usuario } from './usuario';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  public usuario: Usuario = new Usuario();
  public loginError: string | undefined = '';

  constructor(private authService: AuthService, private router: Router) {
    
  }

  Logar(){
    this.authService.login(this.usuario).subscribe({
    next: (response) => {
      console.log('Login realizado com sucesso:', response);
      this.router.navigate(['/']);
    },
    error: (err) => {
      if (err.status === 401) {
        this.loginError = 'Usuário ou senha inválidos.';
      } else {
        this.loginError = 'Erro ao tentar fazer login. Tente novamente mais tarde.';
      }
      this.authService.logout();
    }
  });
  }
}
