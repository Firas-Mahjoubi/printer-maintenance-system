import { Component, OnInit, OnDestroy } from '@angular/core';
import { NotificationService, Notification } from '../../service/notification.service';
import { Subscription, interval } from 'rxjs';

@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.css']
})
export class NotificationsComponent implements OnInit, OnDestroy {
  notifications: Notification[] = [];
  unreadNotifications: Notification[] = [];
  loading = true;
  error: string | null = null;
  unreadCount = 0;
  showUnreadOnly = false;
  
  private refreshSubscription?: Subscription;
  
  // Simuler l'ID utilisateur (devrait venir de l'AuthService)
  private currentUserId = 5; // ID de l'utilisateur admin connecté

  constructor(private notificationService: NotificationService) {}

  ngOnInit(): void {
    this.loadNotifications();
    this.loadUnreadCount();
    
    // Actualiser les notifications toutes les 30 secondes
    this.refreshSubscription = interval(30000).subscribe(() => {
      this.loadUnreadCount();
      if (this.showUnreadOnly) {
        this.loadUnreadNotifications();
      }
    });
  }

  ngOnDestroy(): void {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
  }

  loadNotifications(): void {
    this.loading = true;
    this.error = null;

    this.notificationService.getNotificationsByUser(this.currentUserId).subscribe({
      next: (notifications) => {
        this.notifications = notifications;
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Erreur lors du chargement des notifications.';
        this.loading = false;
        console.error('Error loading notifications:', error);
      }
    });
  }

  loadUnreadNotifications(): void {
    this.loading = true;
    this.error = null;

    this.notificationService.getUnreadNotificationsByUser(this.currentUserId).subscribe({
      next: (notifications) => {
        this.unreadNotifications = notifications;
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Erreur lors du chargement des notifications non lues.';
        this.loading = false;
        console.error('Error loading unread notifications:', error);
      }
    });
  }

  loadUnreadCount(): void {
    this.notificationService.getUnreadCount(this.currentUserId).subscribe({
      next: (count) => {
        this.unreadCount = count;
      },
      error: (error) => {
        console.error('Error loading unread count:', error);
      }
    });
  }

  markAsRead(notification: Notification): void {
    if (notification.statut === 'NON_LUE') {
      this.notificationService.markAsRead(notification.id).subscribe({
        next: () => {
          notification.statut = 'LUE';
          notification.dateLecture = new Date().toISOString();
          this.loadUnreadCount();
        },
        error: (error) => {
          console.error('Error marking notification as read:', error);
        }
      });
    }
  }

  markAllAsRead(): void {
    this.notificationService.markAllAsRead(this.currentUserId).subscribe({
      next: () => {
        this.notifications.forEach(n => {
          if (n.statut === 'NON_LUE') {
            n.statut = 'LUE';
            n.dateLecture = new Date().toISOString();
          }
        });
        this.unreadNotifications = [];
        this.unreadCount = 0;
      },
      error: (error) => {
        console.error('Error marking all notifications as read:', error);
      }
    });
  }

  deleteNotification(notification: Notification): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette notification ?')) {
      this.notificationService.deleteNotification(notification.id).subscribe({
        next: () => {
          this.notifications = this.notifications.filter(n => n.id !== notification.id);
          this.unreadNotifications = this.unreadNotifications.filter(n => n.id !== notification.id);
          this.loadUnreadCount();
        },
        error: (error) => {
          console.error('Error deleting notification:', error);
        }
      });
    }
  }

  toggleView(): void {
    this.showUnreadOnly = !this.showUnreadOnly;
    if (this.showUnreadOnly) {
      this.loadUnreadNotifications();
    } else {
      this.loadNotifications();
    }
  }

  getNotificationClass(notification: Notification): string {
    return this.notificationService.getNotificationTypeClass(notification.type);
  }

  getNotificationIcon(notification: Notification): string {
    return this.notificationService.getNotificationIcon(notification.type);
  }

  getRelativeTime(dateString: string): string {
    return this.notificationService.getRelativeTime(dateString);
  }

  getDisplayedNotifications(): Notification[] {
    return this.showUnreadOnly ? this.unreadNotifications : this.notifications;
  }

  navigateToContract(notification: Notification): void {
    if (notification.contrat?.id) {
      // Navigation vers la page du contrat
      // this.router.navigate(['/contrats', notification.contrat.id]);
      console.log('Navigate to contract:', notification.contrat.id);
    }
  }

  trackByNotificationId(index: number, notification: Notification): number {
    return notification.id;
  }

  getUrgentNotificationsCount(): number {
    return this.notifications.filter(n => 
      n.type === 'CONTRAT_EXPIRE' || n.type === 'URGENT'
    ).length;
  }
}
