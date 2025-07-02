import { Component, OnInit, Renderer2 } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { SidebarToggleService } from '../../service/sidebar-toggle.service';
import { AuthService } from '../../service/auth.service';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit {
  searchQuery: string = '';
  currentUser: any = null;
  notificationCount: number = 5;
  notifications: any[] = [];
  currentRoute: string = '';
  isSidebarVisible: boolean = true;

  constructor(
    private toggleService: SidebarToggleService,
    private authService: AuthService,
    private router: Router,
    private renderer: Renderer2
  ) {}

  ngOnInit(): void {
    this.loadCurrentUser();
    this.loadNotifications();
    
    // Track sidebar visibility
    this.toggleService.sidebarVisible$.subscribe(visible => {
      this.isSidebarVisible = visible;
      // Toggle body class for layout adjustments
      if (visible) {
        this.renderer.removeClass(document.body, 'sidebar-collapsed');
      } else {
        this.renderer.addClass(document.body, 'sidebar-collapsed');
      }
    });
    
    // Listen to route changes to update page title
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.currentRoute = event.url;
      }
    });
  }

  loadCurrentUser(): void {
    // Mock user data - replace with actual service call
    this.currentUser = {
      name: 'Jean Dupont',
      email: 'j.dupont@maintenance.com',
      role: 'Administrateur',
      avatar: 'assets/img/profile-placeholder.jpg'
    };
  }

  loadNotifications(): void {
    // Mock notifications - replace with actual service call
    this.notifications = [
      {
        id: 1,
        type: 'warning',
        title: 'Maintenance urgente requise',
        message: 'Imprimante HP LaserJet - Bureau 201 nécessite une intervention',
        time: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
        read: false
      },
      {
        id: 2,
        type: 'success',
        title: 'Ticket résolu',
        message: 'Le ticket #TK-001 a été marqué comme résolu',
        time: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        read: false
      },
      {
        id: 3,
        type: 'info',
        title: 'Nouveau client ajouté',
        message: 'Le client "TechCorp Solutions" a été ajouté au système',
        time: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
        read: false
      },
      {
        id: 4,
        type: 'danger',
        title: 'Équipement hors service',
        message: 'Canon Pixma TS3350 - Bureau 105 est hors service',
        time: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
        read: false
      },
      {
        id: 5,
        type: 'info',
        title: 'Rapport mensuel disponible',
        message: 'Le rapport de maintenance du mois est prêt à être consulté',
        time: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        read: true
      }
    ];
    
    this.notificationCount = this.notifications.filter(n => !n.read).length;
  }

  getPageTitle(): string {
    const routeTitles: { [key: string]: string } = {
      '/dashboard': 'Dashboard',
      '/contrats': 'Contrats',
      '/contrats/add': 'Nouveau Contrat',
      '/clients': 'Clients',
      '/clients/add': 'Nouveau Client',
      '/tickets': 'Tickets de Maintenance',
      '/tickets/create': 'Nouveau Ticket',
      '/printers': 'Imprimantes',
      '/printers/history': 'Historique des Imprimantes',
      '/notifications': 'Notifications'
    };
    
    return routeTitles[this.currentRoute] || 'Maintenance Pro';
  }

  getBreadcrumb(): string {
    const breadcrumbs: { [key: string]: string } = {
      '/dashboard': 'Accueil > Dashboard',
      '/contrats': 'Gestion > Contrats',
      '/contrats/add': 'Gestion > Contrats > Nouveau',
      '/clients': 'Gestion > Clients',
      '/clients/add': 'Gestion > Clients > Nouveau',
      '/tickets': 'Maintenance > Tickets',
      '/tickets/create': 'Maintenance > Tickets > Nouveau',
      '/printers': 'Équipements > Imprimantes',
      '/printers/history': 'Équipements > Historique',
      '/notifications': 'Système > Notifications'
    };
    
    return breadcrumbs[this.currentRoute] || 'Maintenance Pro';
  }

  getNotificationIcon(type: string): string {
    const icons: { [key: string]: string } = {
      'warning': 'bi-exclamation-triangle',
      'success': 'bi-check-circle',
      'info': 'bi-info-circle',
      'danger': 'bi-x-circle'
    };
    
    return icons[type] || 'bi-bell';
  }

  toggleSidebar(): void {
    this.toggleService.toggleSidebar();
  }

  clearSearch(): void {
    this.searchQuery = '';
  }

  dismissNotification(notificationId: number): void {
    this.notifications = this.notifications.filter(n => n.id !== notificationId);
    this.notificationCount = this.notifications.filter(n => !n.read).length;
  }

  markAllAsRead(): void {
    this.notifications.forEach(n => n.read = true);
    this.notificationCount = 0;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
