import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class CrudService {
  private baseUrl = 'https://suaapi.com/api'; // ajuste conforme sua API

  constructor(private http: HttpClient) {}

  getAll(tipo: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/${tipo}`);
  }

  getById(tipo: string, id: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/${tipo}/${id}`);
  }

  create(tipo: string, data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/${tipo}`, data);
  }

  update(tipo: string, id: string, data: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/${tipo}/${id}`, data);
  }

  delete(tipo: string, id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${tipo}/${id}`);
  }
}