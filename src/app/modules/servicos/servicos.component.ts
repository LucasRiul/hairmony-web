import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { HttpClient } from '@angular/common/http';
import { ServicoService } from './servicos.service';

interface Servico {
  id: string; // Guid no backend
  nome: string;
  duracao: number;
  preco: number;
  data_criacao: Date;
  salaoId: string; // Guid no backend
}

@Component({
  selector: 'app-servicos',
  templateUrl: './servicos.component.html',
  styleUrls: ['./servicos.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgbModule]
})
export class ServicosComponent implements OnInit {
  servicos: Servico[] = [];
  servicoForm: FormGroup;
  isEditing = false;
  currentServicoId: string | null = null;
  isLoading = false;
  
  constructor(
    private servicoService: ServicoService,
    private modalService: NgbModal,
    private fb: FormBuilder,
    private http: HttpClient
  ) {
    this.servicoForm = this.fb.group({
      nome: ['', [Validators.required]],
      duracao: [30, [Validators.required, Validators.min(1)]],
      preco: [0, [Validators.required, Validators.min(0)]]
    });
  }

  ngOnInit(): void {
    this.loadServicos();
  }

  loadServicos(): void {
    this.isLoading = true;
    this.servicoService.getServicos().subscribe({
      next: (data) => {
        this.servicos = data;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erro ao carregar serviços:', error);
        this.isLoading = false;
      }
    });
  }

  openModal(content: any, servico?: Servico): void {
    if (servico) {
      // Edição de serviço existente
      this.isEditing = true;
      this.currentServicoId = servico.id;
      this.servicoForm.patchValue({
        nome: servico.nome,
        duracao: servico.duracao,
        preco: servico.preco
      });
    } else {
      // Novo serviço
      this.isEditing = false;
      this.currentServicoId = null;
      this.servicoForm.reset({
        duracao: 30,
        preco: 0
      });
    }

    this.modalService.open(content, { centered: true });
  }

  openDeleteConfirmation(content: any, servicoId: string): void {
    this.currentServicoId = servicoId;
    this.modalService.open(content, { centered: true });
  }

  saveServico(): void {
    if (this.servicoForm.invalid) {
      // Marcar todos os campos como touched para mostrar erros
      Object.keys(this.servicoForm.controls).forEach(key => {
        const control = this.servicoForm.get(key);
        control?.markAsTouched();
      });
      return;
    }

    const servicoData = this.servicoForm.value;
    
    if (this.isEditing && this.currentServicoId) {
      // Buscar o serviço atual primeiro
      this.servicoService.getServico(this.currentServicoId).subscribe({
        next: (servicoAtual) => {
          // Criar objeto completo com todos os campos originais + atualizações
          const servicoCompleto = {
            id: servicoAtual.id,
            nome: servicoData.nome,
            duracao: servicoData.duracao,
            preco: servicoData.preco,
            data_criacao: servicoAtual.data_criacao,
            salaoId: servicoAtual.salaoId
          };
          
          // Enviar o objeto completo para a API
          this.http.put(`${this.servicoService.apiUrl}/${this.currentServicoId}`, servicoCompleto).subscribe({
            next: () => {
              this.modalService.dismissAll();
              this.loadServicos();
            },
            error: (error) => {
              console.error('Erro ao atualizar serviço:', error);
              console.log('Payload enviado:', servicoCompleto);
            }
          });
        },
        error: (error) => console.error('Erro ao buscar serviço atual:', error)
      });
    } else {
      // Criar novo serviço
      this.servicoService.createServico(servicoData).subscribe({
        next: () => {
          this.modalService.dismissAll();
          this.loadServicos();
        },
        error: (error) => console.error('Erro ao criar serviço:', error)
      });
    }
  }

  deleteServico(): void {
    if (this.currentServicoId) {
      this.servicoService.deleteServico(this.currentServicoId).subscribe({
        next: () => {
          this.modalService.dismissAll();
          this.loadServicos();
        },
        error: (error) => console.error('Erro ao excluir serviço:', error)
      });
    }
  }

  // Método para formatar a data para exibição na tabela
  formatDate(dateString: string | Date): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  }

  // Método para formatar o preço para exibição na tabela
  formatPreco(preco: number): string {
    return preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  // Método para formatar a duração para exibição na tabela
  formatDuracao(duracao: number): string {
    if (duracao < 60) {
      return `${duracao} min`;
    } else {
      const horas = Math.floor(duracao / 60);
      const minutos = duracao % 60;
      return minutos > 0 ? `${horas}h ${minutos}min` : `${horas}h`;
    }
  }
}
