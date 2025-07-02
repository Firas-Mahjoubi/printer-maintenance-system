import { Component } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { NotificationService } from './service/notification.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'maintenance-frontend';
  showLayout = true;

  constructor(
    private router: Router,
    private notificationService: NotificationService
  ) {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        // Hide layout on login, client landing pages, and all client routes
        const url = event.urlAfterRedirects;
        this.showLayout = !(
          url.includes('/login') || 
          url === '/' || 
          url === '/home' || 
          url.includes('/client-dashboard') ||
          url.includes('/client-') ||
          url.includes('/client-landing')
        );
      }
    });
  }
}
