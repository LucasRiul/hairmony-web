import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, switchMap } from 'rxjs';
import { environment } from '../../../environments/environment';

interface Colaborador {
  id: string; // Guid no backend
  nome: string;
  ativo: boolean;
  data_criacao: Date;
  salaoId: string; // Guid no backend
}

@Injectable({
  providedIn: 'root'
})
export class ColaboradoresService {
  public apiUrl = `${environment.apiUrl}/colaboradores`;

  constructor(private http: HttpClient) { }

  getColaboradores(): Observable<Colaborador[]> {
    return this.http.get<Colaborador[]>(this.apiUrl);
  }

  getColaborador(id: string): Observable<Colaborador> {
    return this.http.get<Colaborador>(`${this.apiUrl}/${id}`);
  }

  createColaborador(colaborador: Omit<Colaborador, 'id' | 'data_criacao'>): Observable<Colaborador> {
    const salaoId = this.getSalaoIdFromStorage();
    const colaboradorComSalao = {
      ...colaborador,
      salaoId: salaoId
    };
    return this.http.post<Colaborador>(this.apiUrl, colaboradorComSalao);
  }

  updateColaborador(id: string, colaboradorData: Partial<Omit<Colaborador, 'id' | 'salaoId' | 'data_criacao'>>): Observable<Colaborador> {
    // Primeiro, buscar o colaborador atual
    return this.getColaborador(id).pipe(
      switchMap(colaboradorAtual => {
        // Criar um objeto atualizado mantendo os campos originais e atualizando apenas os novos
        const colaboradorAtualizado = {
          ...colaboradorAtual,
          ...colaboradorData
        };
        
        // Enviar o objeto completo para a API
        return this.http.put<Colaborador>(`${this.apiUrl}/${id}`, colaboradorAtualizado);
      })
    );
  }

  deleteColaborador(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  private getSalaoIdFromStorage(): string {
    // Você pode armazenar o salaoId no localStorage após o login
    // ou obtê-lo de um serviço centralizado
    return localStorage.getItem('SALAO_ID') || '';
  }
}
