import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { HttpClient } from '@angular/common/http';
import { ColaboradoresService } from './colaboradores.service';

interface Colaborador {
  id: string; // Guid no backend
  nome: string;
  ativo: boolean;
  data_criacao: Date;
  salaoId: string; // Guid no backend
}

@Component({
  selector: 'app-colaboradores',
  templateUrl: './colaboradores.component.html',
  styleUrls: ['./colaboradores.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgbModule]
})
export class ColaboradoresComponent implements OnInit {
  colaboradores: Colaborador[] = [];
  colaboradorForm: FormGroup;
  isEditing = false;
  currentColaboradorId: string | null = null;
  isLoading = false;
  
  constructor(
    private colaboradoresService: ColaboradoresService,
    private modalService: NgbModal,
    private fb: FormBuilder,
    private http: HttpClient
  ) {
    this.colaboradorForm = this.fb.group({
      nome: ['', [Validators.required]],
      ativo: [true]
    });
  }

  ngOnInit(): void {
     
    this.loadColaboradores();
  }

  loadColaboradores(): void {
     
    this.isLoading = true;
    this.colaboradoresService.getColaboradores().subscribe({
      next: (data) => {
        this.colaboradores = data;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erro ao carregar colaboradores:', error);
        this.isLoading = false;
      }
    });
  }

  openModal(content: any, colaborador?: Colaborador): void {
    if (colaborador) {
      // Edição de colaborador existente
      this.isEditing = true;
      this.currentColaboradorId = colaborador.id;
      this.colaboradorForm.patchValue({
        nome: colaborador.nome,
        ativo: colaborador.ativo
      });
    } else {
      // Novo colaborador
      this.isEditing = false;
      this.currentColaboradorId = null;
      this.colaboradorForm.reset({
        ativo: true // Valor padrão para novos colaboradores
      });
    }

    this.modalService.open(content, { centered: true });
  }

  openDeleteConfirmation(content: any, colaboradorId: string): void {
    this.currentColaboradorId = colaboradorId;
    this.modalService.open(content, { centered: true });
  }

  saveColaborador(): void {
    if (this.colaboradorForm.invalid) {
      // Marcar todos os campos como touched para mostrar erros
      Object.keys(this.colaboradorForm.controls).forEach(key => {
        const control = this.colaboradorForm.get(key);
        control?.markAsTouched();
      });
      return;
    }

    const colaboradorData = this.colaboradorForm.value;
    
    if (this.isEditing && this.currentColaboradorId) {
      // Buscar o colaborador atual primeiro
      this.colaboradoresService.getColaborador(this.currentColaboradorId).subscribe({
        next: (colaboradorAtual) => {
          // Criar objeto completo com todos os campos originais + atualizações
          const colaboradorCompleto = {
            id: colaboradorAtual.id,
            nome: colaboradorData.nome,
            ativo: colaboradorData.ativo,
            data_criacao: colaboradorAtual.data_criacao,
            salaoId: colaboradorAtual.salaoId
          };
          
          // Enviar o objeto completo para a API
          this.http.put(`${this.colaboradoresService.apiUrl}/${this.currentColaboradorId}`, colaboradorCompleto).subscribe({
            next: () => {
              this.modalService.dismissAll();
              this.loadColaboradores();
            },
            error: (error) => {
              console.error('Erro ao atualizar colaborador:', error);
              console.log('Payload enviado:', colaboradorCompleto);
            }
          });
        },
        error: (error) => console.error('Erro ao buscar colaborador atual:', error)
      });
    } else {
      // Criar novo colaborador
      this.colaboradoresService.createColaborador(colaboradorData).subscribe({
        next: () => {
          this.modalService.dismissAll();
          this.loadColaboradores();
        },
        error: (error) => console.error('Erro ao criar colaborador:', error)
      });
    }
  }

  deleteColaborador(): void {
    if (this.currentColaboradorId) {
      this.colaboradoresService.deleteColaborador(this.currentColaboradorId).subscribe({
        next: () => {
          this.modalService.dismissAll();
          this.loadColaboradores();
        },
        error: (error) => console.error('Erro ao excluir colaborador:', error)
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
