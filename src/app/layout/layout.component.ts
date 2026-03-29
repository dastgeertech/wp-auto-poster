import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from './sidebar/sidebar.component';
import { HeaderComponent } from './header/header.component';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarComponent, HeaderComponent],
  template: `
    <div class="layout" [class.sidebar-collapsed]="sidebarCollapsed()">
      <app-sidebar></app-sidebar>
      <app-header></app-header>
      <main class="main-content">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [`
    .layout {
      min-height: 100vh;
      background: #0f0f1a;
    }

    .main-content {
      margin-left: 260px;
      margin-top: 64px;
      padding: 24px;
      min-height: calc(100vh - 64px);
      transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .sidebar-collapsed .main-content {
      margin-left: 70px;
    }
  `]
})
export class LayoutComponent {
  sidebarCollapsed = signal(false);
}
