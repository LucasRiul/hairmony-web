import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface Cliente {
  id: string;
  nome: string;
  celular: string;
}

export interface Servico {
  id: string;
  nome: string;
  duracao: number;
  preco: number;
}

export interface Colaborador {
  id: string;
  nome: string;
  ativo: boolean;
}

export interface Agendamento {
  id: string; // Guid no backend
  data_de: Date;
  data_ate: Date;
  concluido: boolean;
  data_criacao: Date;
  salaoId: string; // Guid no backend
  clienteid: string; // Guid no backend
  servicoid: string; // Guid no backend
  colaboradorid: string; // Guid no backend
  
  // Propriedades adicionais para exibição na agenda
  cliente?: Cliente;
  servico?: Servico;
  colaborador?: Colaborador;
}

export interface AgendamentoRequest {
  data_de: Date;
  clienteid: string;
  servicoid: string;
  colaboradorid: string;
  concluido?: boolean;
  repete?: boolean;
  dias?: number;
}

@Injectable({
  providedIn: 'root'
})
export class AgendamentoService {
  public apiUrl = `${environment.apiUrl}/agendamentos`;

  constructor(private http: HttpClient) { }

  getAgendamentos(data?: Date): Observable<Agendamento[]> {
    let url = this.apiUrl;
    if (data) {
      // Formatar a data para o formato esperado pela API
      const dataFormatada = data.toISOString().split('T')[0];
      url = `${this.apiUrl}?data=${dataFormatada}`;
    }
    return this.http.get<Agendamento[]>(url);
  }

  getAgendamentosComDetalhes(data?: Date): Observable<Agendamento[]> {
    return this.getAgendamentos(data).pipe(
      switchMap(agendamentos => {
        if (agendamentos.length === 0) {
          return [[]];
        }
        
        // Obter detalhes de clientes, serviços e colaboradores
        const clientesIds = [...new Set(agendamentos.map(a => a.clienteid))];
        const servicosIds = [...new Set(agendamentos.map(a => a.servicoid))];
        const colaboradoresIds = [...new Set(agendamentos.map(a => a.colaboradorid))];
        
        const clientesRequest = this.http.get<Cliente[]>(`${environment.apiUrl}/clientes`);
        const servicosRequest = this.http.get<Servico[]>(`${environment.apiUrl}/servicos`);
        const colaboradoresRequest = this.http.get<Colaborador[]>(`${environment.apiUrl}/colaboradores`);
        
        return forkJoin([
          clientesRequest,
          servicosRequest,
          colaboradoresRequest
        ]).pipe(
          map(([clientes, servicos, colaboradores]) => {
            return agendamentos.map(agendamento => {
              const cliente = clientes.find(c => c.id === agendamento.clienteid);
              const servico = servicos.find(s => s.id === agendamento.servicoid);
              const colaborador = colaboradores.find(c => c.id === agendamento.colaboradorid);
              
              return {
                ...agendamento,
                cliente,
                servico,
                colaborador
              };
            });
          })
        );
      })
    );
  }

  getAgendamento(id: string): Observable<Agendamento> {
    return this.http.get<Agendamento>(`${this.apiUrl}/${id}`);
  }

  createAgendamento(agendamento: AgendamentoRequest): Observable<Agendamento> {
    const salaoId = this.getSalaoIdFromStorage();
    const agendamentoComSalao = {
      ...agendamento,
      salaoId: salaoId
    };
    var stringRepete = '';
    if(agendamento.repete == true){
      stringRepete = `?repete=${agendamento.repete}&dias=${agendamento.dias}`;
    }
    return this.http.post<Agendamento>(`${this.apiUrl}${stringRepete}`, agendamentoComSalao);
  }

  updateAgendamento(id: string, agendamentoData: Partial<Agendamento>): Observable<Agendamento> {
    // Primeiro, buscar o agendamento atual
    return this.getAgendamento(id).pipe(
      switchMap(agendamentoAtual => {
        // Criar um objeto atualizado mantendo os campos originais e atualizando apenas os novos
        const agendamentoAtualizado = {
          ...agendamentoAtual,
          ...agendamentoData
        };
        
        // Enviar o objeto completo para a API
        return this.http.put<Agendamento>(`${this.apiUrl}/${id}`, agendamentoAtualizado);
      })
    );
  }

  concluirAgendamento(id: string): Observable<Agendamento> {
    return this.updateAgendamento(id, { concluido: true });
  }

  deleteAgendamento(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  relatorioSemanal(){
    return this.http.get(`${this.apiUrl}/relatorio-semanal`,{
      responseType: 'blob'
    })
  }

  private getSalaoIdFromStorage(): string {
    // Você pode armazenar o salaoId no localStorage após o login
    // ou obtê-lo de um serviço centralizado
    return localStorage.getItem('SALAO_ID') || '';
  }
}
