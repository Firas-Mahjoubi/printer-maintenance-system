import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { SidebarToggleService } from '../../service/sidebar-toggle.service';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit {
  isVisible = true;
  isContratsActive = false;

  constructor(private toggleService: SidebarToggleService, private router: Router) {}

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
  }
}
