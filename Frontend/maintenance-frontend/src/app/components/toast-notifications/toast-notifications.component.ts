import { Component, OnInit, OnDestroy } from '@angular/core';
import { NotificationService } from '../../service/notification.service';
import { Subscription } from 'rxjs';
import { trigger, state, style, transition, animate } from '@angular/animations';

@Component({
  selector: 'app-toast-notifications',
  templateUrl: './toast-notifications.component.html',
  styleUrls: ['./toast-notifications.component.css'],
  animations: [
    trigger('toastAnimation', [
      state('void', style({
        transform: 'translateX(100%)',
        opacity: 0
      })),
      state('visible', style({
        transform: 'translateX(0)',
        opacity: 1
      })),
      transition('void => visible', animate('300ms ease-out')),
      transition('visible => void', animate('300ms ease-in'))
    ])
  ]
})
export class ToastNotificationsComponent implements OnInit, OnDestroy {
  toasts: any[] = [];
  private subscription: Subscription | null = null;

  constructor(private notificationService: NotificationService) {}

  ngOnInit(): void {
    this.subscription = this.notificationService.toast$.subscribe(toast => {
      if (toast) {
        const newToast = {
          ...toast,
          id: Date.now(),
          state: 'visible'
        };
        this.toasts.push(newToast);

        // Set timeout to remove the toast after its duration
        setTimeout(() => {
          this.removeToast(newToast.id);
        }, toast.duration || 5000);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  removeToast(id: number): void {
    const index = this.toasts.findIndex(toast => toast.id === id);
    if (index !== -1) {
      this.toasts[index].state = 'void';
      
      // Remove from array after animation completes
      setTimeout(() => {
        this.toasts = this.toasts.filter(toast => toast.id !== id);
      }, 300);
    }
  }

  getIconClass(type: string): string {
    switch (type) {
      case 'success':
        return 'bi-check-circle-fill';
      case 'error':
        return 'bi-exclamation-circle-fill';
      case 'warning':
        return 'bi-exclamation-triangle-fill';
      case 'info':
      default:
        return 'bi-info-circle-fill';
    }
  }
}
