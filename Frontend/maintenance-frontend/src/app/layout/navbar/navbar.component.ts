import { Component, Inject } from '@angular/core';
import { SidebarToggleService } from '../../service/sidebar-toggle.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent {
  constructor(private toggleService: SidebarToggleService) {}

  toggleSidebar() {
    this.toggleService.toggleSidebar();
  }
}
