import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Utilisateur {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  imageUrl?: string;
}

export interface Contrat {
  id?: number;
  numeroContrat: string;
  dateDebut: string;
  dateFin: string;
  statutContrat: string;
  clientId?: number;          // For creating new contract with clientId
  client?: Utilisateur;       // For displaying associated client
  conditions_contrat: string; // HTML content for contract conditions
}

@Injectable({
  providedIn: 'root'
})
export class ContratService {
  private baseUrl = 'http://localhost:8081/api/Contrat';

  constructor(private http: HttpClient) {}

  // Get all contracts
  getAll(): Observable<Contrat[]> {
    return this.http.get<Contrat[]>(`${this.baseUrl}/findAll`);
  }

  // Get contract by ID
  getById(id: number): Observable<Contrat> {
    return this.http.get<Contrat>(`${this.baseUrl}/findById/${id}`);
  }

  // Create new contract with associated clientId
  create(contrat: Contrat, clientId: number): Observable<Contrat> {
    return this.http.post<Contrat>(`${this.baseUrl}/save/${clientId}`, contrat);
  }

  // Update contract by ID
  update(id: number, contrat: Contrat): Observable<Contrat> {
    return this.http.put<Contrat>(`${this.baseUrl}/update/${id}`, contrat);
  }

  // Delete contract by ID
  delete(id: number): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/delete/${id}`, {});
  }

  // Renew contract by ID
  renew(id: number, contrat: Contrat): Observable<Contrat> {
    return this.http.post<Contrat>(`${this.baseUrl}/renouveler/${id}`, contrat);
  }

  // Get contract history
  getHistory(): Observable<Contrat[]> {
    return this.http.get<Contrat[]>(`${this.baseUrl}/getContratsHistorie`);
  }

  // Export contract to PDF
  exportContratToPdf(id: number): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/export/pdf/${id}`, {
      responseType: 'blob'
    });
  }
}
