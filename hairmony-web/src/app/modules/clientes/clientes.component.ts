import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { ClienteService } from './clientes.service';
import { HttpClient } from '@angular/common/http';
import { NgxMaskDirective } from 'ngx-mask';

interface Cliente {
  id: string; // Guid no backend
  nome: string;
  celular: string;
  data_criacao: Date;
  salaoId: string; // Guid no backend
}

@Component({
  selector: 'app-clientes',
  templateUrl: './clientes.component.html',
  styleUrls: ['./clientes.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgbModule, NgxMaskDirective ]
})
export class ClientesComponent implements OnInit {
  clientes: Cliente[] = [];
  clienteForm: FormGroup;
  isEditing = false;
  currentClienteId: string | null = null;
  isLoading = false;
  
  constructor(
    private clienteService: ClienteService,
    private modalService: NgbModal,
    private fb: FormBuilder,
    private http: HttpClient
  ) {
    this.clienteForm = this.fb.group({
      nome: ['', [Validators.required]],
      celular: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
    this.loadClientes();
  }

  loadClientes(): void {
    this.isLoading = true;
    this.clienteService.getClientes().subscribe({
      next: (data) => {
        this.clientes = data;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erro ao carregar clientes:', error);
        this.isLoading = false;
      }
    });
  }

  openModal(content: any, cliente?: Cliente): void {
    if (cliente) {
      // Edição de cliente existente
      this.isEditing = true;
      this.currentClienteId = cliente.id;
      this.clienteForm.patchValue({
        nome: cliente.nome,
        celular: cliente.celular
      });
    } else {
      // Novo cliente
      this.isEditing = false;
      this.currentClienteId = null;
      this.clienteForm.reset();
    }

    this.modalService.open(content, { centered: true });
  }

  openDeleteConfirmation(content: any, clienteId: string): void {
    this.currentClienteId = clienteId;
    this.modalService.open(content, { centered: true });
  }

  saveCliente(): void {
    if (this.clienteForm.invalid) {
      // Marcar todos os campos como touched para mostrar erros
      Object.keys(this.clienteForm.controls).forEach(key => {
        const control = this.clienteForm.get(key);
        control?.markAsTouched();
      });
      return;
    }
  
    const clienteData = this.clienteForm.value;
    
    if (this.isEditing && this.currentClienteId) {
      // Buscar o cliente atual primeiro
      this.clienteService.getCliente(this.currentClienteId).subscribe({
        next: (clienteAtual) => {
          // Criar objeto completo com todos os campos originais + atualizações
          const clienteCompleto = {
            id: clienteAtual.id,
            nome: clienteData.nome,
            celular: clienteData.celular,
            data_criacao: clienteAtual.data_criacao,
            salaoId: clienteAtual.salaoId
          };
          
          // Enviar o objeto completo para a API
          this.http.put(`${this.clienteService.apiUrl}/${this.currentClienteId}`, clienteCompleto ).subscribe({
            next: () => {
              this.modalService.dismissAll();
              this.loadClientes();
            },
            error: (error) => {
              console.error('Erro ao atualizar cliente:', error);
              console.log('Payload enviado:', clienteCompleto);
            }
          });
        },
        error: (error) => console.error('Erro ao buscar cliente atual:', error)
      });
    } else {
      // Criar novo cliente (sem alterações)
      this.clienteService.createCliente(clienteData).subscribe({
        next: () => {
          this.modalService.dismissAll();
          this.loadClientes();
        },
        error: (error) => console.error('Erro ao criar cliente:', error)
      });
    }
  }
  

  deleteCliente(): void {
    if (this.currentClienteId) {
      this.clienteService.deleteCliente(this.currentClienteId).subscribe({
        next: () => {
          this.modalService.dismissAll();
          this.loadClientes();
        },
        error: (error) => console.error('Erro ao excluir cliente:', error)
      });
    }
  }

  // Método para formatar a data para exibição na tabela
  formatDate(dateString: string | Date): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  }
}
