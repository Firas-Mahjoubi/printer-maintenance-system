import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Imprimante {
  id: number;
  marque: string;
  modele: string;
  emplacement: string;
  numeroSerie: string;
}

@Injectable({
  providedIn: 'root'
})
export class ImprimanteService {
  private baseUrl = 'http://localhost:8081/api/Imprimante';

  constructor(private http: HttpClient) {}

  // Get all printers for a contract
  getAllByContrat(contratId: number): Observable<Imprimante[]> {
    return this.http.get<Imprimante[]>(`${this.baseUrl}/getAllImprimante?contratId=${contratId}`);
  }

  // Get single printer by ID
  getById(imprimanteId: number): Observable<Imprimante> {
    return this.http.get<Imprimante>(`${this.baseUrl}/getImprimante?imprimanteId=${imprimanteId}`);
  }

  // Add new printer to contract
  addToContrat(imprimante: Imprimante, contratId: number): Observable<Imprimante> {
    return this.http.post<Imprimante>(`${this.baseUrl}/addImprimante?contratId=${contratId}`, imprimante);
  }

  // Delete printer
  delete(imprimanteId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/deleteImprimante?imprimanteId=${imprimanteId}`);
  }

  // Assign multiple printers to contract
  assignMultipleToContrat(imprimanteIds: number[], contratId: number): Observable<Imprimante[]> {
    const formData = new FormData();
    formData.append('contratId', contratId.toString());
    imprimanteIds.forEach(id => formData.append('imprimanteIds', id.toString()));
    
    return this.http.post<Imprimante[]>(`${this.baseUrl}/assign-multiple`, formData);
  }

  // Import printers from Excel file
  importFromExcel(file: File, contratId: number): Observable<string> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('contratId', contratId.toString());
    
    return this.http.post<string>(`${this.baseUrl}/import-excel`, formData, {
      responseType: 'text' as 'json'
    });
  }
}
