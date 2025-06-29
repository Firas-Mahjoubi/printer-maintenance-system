import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { SidebarToggleService } from '../../service/sidebar-toggle.service';
import { NotificationService } from '../../service/notification.service';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit, OnDestroy {
  isVisible = true;
  isContratsActive = false;
  unreadCount = 0;
  
  private subscriptions: Subscription[] = [];
  // Simuler l'ID utilisateur (devrait venir de l'AuthService)
  private currentUserId = 5; // ID de l'utilisateur admin connecté

  constructor(
    private toggleService: SidebarToggleService, 
    private router: Router,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.toggleService.sidebarVisible$.subscribe(visible => {
      this.isVisible = visible;
    });

    // Track active route
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.isContratsActive = this.router.url.startsWith('/contrats');
    });

    // Subscribe to unread notifications count
    const unreadSub = this.notificationService.unreadCount$.subscribe(count => {
      this.unreadCount = count;
    });
    this.subscriptions.push(unreadSub);

    // Load initial unread count
    this.notificationService.refreshUnreadCount(this.currentUserId);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
}
