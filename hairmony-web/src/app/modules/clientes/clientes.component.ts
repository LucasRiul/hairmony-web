import { Component } from '@angular/core';
import { CrudComponent } from '../../Shared/crud/crud-list/crud-list.component';

@Component({
  selector: 'app-clientes',
  imports: [
    CrudComponent
  ],
  templateUrl: './clientes.component.html',
  styleUrl: './clientes.component.scss',
  standalone: true,
})
export class ClientesComponent {

}
