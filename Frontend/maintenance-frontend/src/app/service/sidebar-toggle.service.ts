import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SidebarToggleService {
  private visible = new BehaviorSubject<boolean>(true);
  sidebarVisible$ = this.visible.asObservable();

  toggleSidebar() {
    const current = this.visible.getValue();
    this.visible.next(!current);

    const body = document.body;
    if (current) {
      body.classList.add('sidebar-collapsed');
    } else {
      body.classList.remove('sidebar-collapsed');
    }
  }
}
