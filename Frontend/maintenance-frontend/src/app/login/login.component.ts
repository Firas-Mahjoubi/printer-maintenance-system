import { Component } from '@angular/core';
import { AuthService } from '../service/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  email = '';
  password = '';
  error = '';
  isLoading = false;

  constructor(private authService: AuthService, private router: Router) {}

  login() {
    if (!this.email || !this.password) {
      this.error = 'Veuillez remplir tous les champs';
      return;
    }

    this.isLoading = true;
    this.error = '';

    this.authService.login(this.email, this.password).subscribe({
      next: (res: any) => {
        console.log('Login response:', res);
        
        // Le token est maintenant automatiquement stocké par le service auth
        // Déboguer le token pour vérifier qu'il est correct
        this.authService.debugToken();
        
        this.isLoading = false;
        
        // Route based on user role
        const userRole = this.authService.getCurrentUserRole();
        console.log('User role:', userRole);
        
        if (userRole === 'ADMIN') {
          this.router.navigate(['/dashboard']);
        } else if (userRole === 'CLIENT') {
          this.router.navigate(['/client-dashboard']);
        } else {
          // Default route if role is not recognized
          this.router.navigate(['/dashboard']);
        }
      },
      error: (err) => {
        this.isLoading = false;
        if (err.status === 401) {
          this.error = 'Email ou mot de passe incorrect';
        } else if (err.status === 0) {
          this.error = 'Erreur de connexion au serveur';
        } else {
          this.error = 'Une erreur s\'est produite. Veuillez réessayer.';
        }
        console.error('Login error:', err);
      }
    });
  }

  // Méthode de test temporaire
  testToken() {
    console.log('=== TEST TOKEN ===');
    
    // Create test token for CLIENT role by default
    const testRole = 'CLIENT'; // Change this to 'ADMIN' to test admin routing
    this.authService.createTestToken(testRole);
    
    console.log('Current user ID:', this.authService.getCurrentUserId());
    console.log('Current user role:', this.authService.getCurrentUserRole());
    console.log('Current user email:', this.authService.getCurrentUserEmail());
    console.log('Current user:', this.authService.getCurrentUser());
    console.log('Is logged in:', this.authService.isLoggedIn());
    
    // Route based on user role
    const userRole = this.authService.getCurrentUserRole();
    if (userRole === 'ADMIN') {
      this.router.navigate(['/dashboard']);
    } else if (userRole === 'CLIENT') {
      this.router.navigate(['/client-dashboard']);
    } else {
      this.router.navigate(['/dashboard']);
    }
  }
}
