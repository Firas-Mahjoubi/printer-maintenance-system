import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Client {
  id?: number;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  imageUrl?: string;
}

export interface CreateClientRequest {
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  imageUrl?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ClientService {
  private baseUrl = 'http://localhost:8081/api/Utilisateur'; // Adjust to your real URL

  constructor(private http: HttpClient) {}

  getAllClients(): Observable<Client[]> {
    return this.http.get<Client[]>(`${this.baseUrl}/getAllClients`);
  }

  createClient(client: CreateClientRequest): Observable<Client> {
    return this.http.post<Client>(`${this.baseUrl}/createClient`, client);
  }

  updateClient(id: number, client: CreateClientRequest): Observable<Client> {
    return this.http.put<Client>(`${this.baseUrl}/updateClient/${id}`, client);
  }

  deleteClient(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/deleteClient/${id}`);
  }

  getClientById(id: number): Observable<Client> {
    return this.http.get<Client>(`${this.baseUrl}/getClient/${id}`);
  }
}
