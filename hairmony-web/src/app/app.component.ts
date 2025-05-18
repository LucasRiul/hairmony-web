import { Component, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from './login/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  
  
})
export class AppComponent implements OnInit{
  title = 'salveee';
  mostrarMenu: boolean = false;

  constructor(private authService: AuthService) {
    
  }

  ngOnInit(): void {
    this.authService.mostrarMenuEmitter.subscribe(x =>
      this.mostrarMenu = x
    );
  }
  
}
