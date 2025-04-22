import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ClientesService {

  private baseUrl = environment.apiUrl; // ajuste conforme sua API

  constructor(private http: HttpClient) {}

  getAll(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/clientes`);
  }

  getById(id: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/clientes/${id}`);
  }

  create(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/clientes`, data);
  }

  update(id: string, data: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/clientes/${id}`, data);
  }

  delete(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/clientes/${id}`);
  }

}
