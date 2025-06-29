import { Component } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'maintenance-frontend';
   showLayout = true;

  constructor(private router: Router) {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        // Hide layout on login, client landing pages, and client dashboard
        const url = event.urlAfterRedirects;
        this.showLayout = !(url.includes('/login') || url === '/' || url === '/home' || url.includes('/client-dashboard'));
      }
    });
  }
}
