import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { InterventionDTO } from './intervention.service';

@Injectable({
  providedIn: 'root'
})
export class MaintenanceSchedulerService {
  private apiUrl = 'http://localhost:8081/api/interventions';

  constructor(private http: HttpClient) { }

  /**
   * Déclenche manuellement la planification des maintenances préventives
   * pour tous les contrats actifs qui ont besoin d'une maintenance
   */
  planifierMaintenancesPreventives(): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/planifier-maintenances-preventives`, {});
  }

  /**
   * Déclenche manuellement l'envoi des notifications pour les maintenances préventives
   * qui sont programmées dans un mois
   */
  envoyerNotificationsMaintenance(): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/envoyer-notifications-maintenance`, {});
  }

  /**
   * Récupère toutes les maintenances préventives planifiées
   */
  obtenirMaintenancesPreventives(page: number = 0, size: number = 10): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}?type=PREVENTIVE&statut=PLANIFIEE&page=${page}&size=${size}`);
  }
}
