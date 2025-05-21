import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { switchMap } from 'rxjs/operators';

interface Servico {
  id: string; // Guid no backend
  nome: string;
  duracao: number;
  preco: number;
  data_criacao: Date;
  salaoid: string; // Guid no backend
}

@Injectable({
  providedIn: 'root'
})
export class ServicoService {
  public apiUrl = `${environment.apiUrl}/servicos`;

  constructor(private http: HttpClient) { }

  getServicos(): Observable<Servico[]> {
    return this.http.get<Servico[]>(this.apiUrl);
  }

  getServico(id: string): Observable<Servico> {
    return this.http.get<Servico>(`${this.apiUrl}/${id}`);
  }

  createServico(servico: Omit<Servico, 'id' | 'data_criacao'>): Observable<Servico> {
    const salaoid = this.getSalaoIdFromStorage();
    const servicoComSalao = {
      ...servico,
      salaoid: salaoid
    };
    return this.http.post<Servico>(this.apiUrl, servicoComSalao);
  }

  updateServico(id: string, servicoData: Partial<Omit<Servico, 'id' | 'salaoid' | 'data_criacao'>>): Observable<Servico> {
    // Primeiro, buscar o serviço atual
    return this.getServico(id).pipe(
      switchMap(servicoAtual => {
        // Criar um objeto atualizado mantendo os campos originais e atualizando apenas os novos
        const servicoAtualizado = {
          ...servicoAtual,
          ...servicoData
        };
        
        // Enviar o objeto completo para a API
        return this.http.put<Servico>(`${this.apiUrl}/${id}`, servicoAtualizado);
      })
    );
  }
  private getSalaoIdFromStorage(): string {
    // Você pode armazenar o salaoId no localStorage após o login
    // ou obtê-lo de um serviço centralizado
    return localStorage.getItem('SALAO_ID') || '';
  }
  deleteServico(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
