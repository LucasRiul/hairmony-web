import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

interface Cliente {
  id: string; // Guid no backend
  nome: string;
  celular: string;
  data_criacao: Date;
  salaoId: string; // Guid no backend
}

@Injectable({
  providedIn: 'root'
})
export class ClienteService {
  public apiUrl = `${environment.apiUrl}/clientes`;

  constructor(private http: HttpClient) { }

  getClientes(): Observable<Cliente[]> {
    return this.http.get<Cliente[]>(this.apiUrl);
  }

  getCliente(id: string): Observable<Cliente> {
    return this.http.get<Cliente>(`${this.apiUrl}/${id}`);
  }

  createCliente(cliente: Omit<Cliente, 'id' |'data_criacao'>): Observable<Cliente> {
    const salaoId = this.getSalaoIdFromStorage();
    const clienteComSalao = {
      ...cliente,
      salaoId: salaoId
    };
    return this.http.post<Cliente>(this.apiUrl, clienteComSalao);
  }

  updateCliente(id: string, clienteData: Partial<Omit<Cliente, 'id' | 'salaoId' | 'data_criacao'>>): Observable<Cliente> {
    // Primeiro, buscar o cliente atual
    return this.getCliente(id).pipe(
      switchMap(clienteAtual => {
        // Criar um objeto atualizado mantendo os campos originais e atualizando apenas os novos
        const clienteAtualizado = {
          ...clienteAtual,
          ...clienteData
        };
        
        // Enviar o objeto completo para a API
        return this.http.put<Cliente>(`${this.apiUrl}/${id}`, clienteAtualizado );
      })
    );
  }

  private getSalaoIdFromStorage(): string {
    // Você pode armazenar o salaoId no localStorage após o login
    // ou obtê-lo de um serviço centralizado
    return localStorage.getItem('SALAO_ID') || '';
  }
  

  deleteCliente(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
