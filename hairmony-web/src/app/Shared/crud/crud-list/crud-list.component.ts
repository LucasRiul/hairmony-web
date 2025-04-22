import { Component, Input } from '@angular/core';
import { CrudService } from '../crud.service';
import { MatDialog } from '@angular/material/dialog';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-crud',
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    FormsModule
  ],
  templateUrl: './crud-list.component.html',
  styleUrl: './crud-list.component.scss',
  standalone: true,
  
})
export class CrudComponent {
  @Input() tipo: 'colaboradores' | 'servicos' | 'clientes' | 'agendamentos' = 'colaboradores';
  data: any[] = [];
  filteredData: any[] = [];
  filterValue = '';
  displayedColumns = ['nome', 'acoes'];

  constructor(private crudService: CrudService, private dialog: MatDialog) {}

  ngOnInit() {
    this.carregarDados();
  }

  carregarDados() {
    this.crudService.getAll(this.tipo).subscribe((dados) => {
      this.data = dados;
      this.filteredData = dados;
    });
  }

  applyFilter() {
    this.filteredData = this.data.filter(item =>
      item.nome.toLowerCase().includes(this.filterValue.toLowerCase())
    );
  }

  editar(item: any) {
    // abre o form com dados
  }

  criarNovo() {
    // abre o form vazio
  }

  deletar(id: string) {
    this.crudService.delete(this.tipo, id).subscribe(() => this.carregarDados());
  }

}
