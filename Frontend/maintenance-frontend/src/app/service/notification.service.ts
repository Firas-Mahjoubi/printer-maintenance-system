import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface Notification {
  id: number;
  titre: string;
  message: string;
  type: string;
  statut: string;
  dateCreation: string;
  dateLecture?: string;
  joursRestants?: number;
  actionRequise?: string;
  contrat?: {
    id: number;
    numeroContrat: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private baseUrl = 'http://localhost:8081/api/notifications';
  private unreadCountSubject = new BehaviorSubject<number>(0);
  public unreadCount$ = this.unreadCountSubject.asObservable();

  constructor(private http: HttpClient) {}

  // Get notifications for a user
  getNotificationsByUser(userId: number): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${this.baseUrl}/user/${userId}`);
  }

  // Get unread notifications for a user
  getUnreadNotificationsByUser(userId: number): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${this.baseUrl}/user/${userId}/unread`);
  }

  // Get unread count
  getUnreadCount(userId: number): Observable<number> {
    return this.http.get<number>(`${this.baseUrl}/user/${userId}/count-unread`)
      .pipe(
        tap(count => this.unreadCountSubject.next(count))
      );
  }

  // Mark notification as read
  markAsRead(notificationId: number): Observable<string> {
    return this.http.put(`${this.baseUrl}/mark-read/${notificationId}`, {}, { responseType: 'text' });
  }

  // Mark all notifications as read
  markAllAsRead(userId: number): Observable<string> {
    return this.http.put(`${this.baseUrl}/mark-all-read/${userId}`, {}, { responseType: 'text' })
      .pipe(
        tap(() => this.unreadCountSubject.next(0))
      );
  }

  // Delete notification
  deleteNotification(notificationId: number): Observable<string> {
    return this.http.delete(`${this.baseUrl}/delete/${notificationId}`, { responseType: 'text' });
  }

  // Get all notifications (admin)
  getAllNotifications(): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${this.baseUrl}/all`);
  }

  // Refresh unread count
  refreshUnreadCount(userId: number): void {
    this.getUnreadCount(userId).subscribe();
  }

  // Get notification type class for styling
  getNotificationTypeClass(type: string): string {
    switch (type) {
      case 'ALERTE_ECHEANCE':
        return 'warning';
      case 'CONTRAT_EXPIRE':
        return 'danger';
      case 'MAINTENANCE_PREVUE':
        return 'info';
      case 'INTERVENTION_TERMINEE':
        return 'success';
      case 'URGENT':
        return 'danger';
      default:
        return 'secondary';
    }
  }

  // Get notification icon
  getNotificationIcon(type: string): string {
    switch (type) {
      case 'ALERTE_ECHEANCE':
        return 'bi-clock-history';
      case 'CONTRAT_EXPIRE':
        return 'bi-exclamation-triangle-fill';
      case 'MAINTENANCE_PREVUE':
        return 'bi-calendar-check';
      case 'INTERVENTION_TERMINEE':
        return 'bi-check-circle-fill';
      case 'URGENT':
        return 'bi-exclamation-circle-fill';
      default:
        return 'bi-info-circle';
    }
  }

  // Format relative time
  getRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffDays > 0) {
      return `il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
    } else if (diffHours > 0) {
      return `il y a ${diffHours} heure${diffHours > 1 ? 's' : ''}`;
    } else if (diffMinutes > 0) {
      return `il y a ${diffMinutes} minute${diffMinutes > 1 ? 's' : ''}`;
    } else {
      return 'À l\'instant';
    }
  }
}
