import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private apiUrl = 'http://localhost:8081'; // adjust this to your backend URL

  constructor(private http: HttpClient) {}

  login(email: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, { email: email, motDePasse: password })
      .pipe(
        tap((response: any) => {
          if (response.jwtToken) {
            localStorage.setItem('token', response.jwtToken);
          }
        })
      );
  }

  logout() {
    localStorage.removeItem('token');
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  private decodeToken(token: string): any {
    try {
      if (!token || typeof token !== 'string') {
        console.error('Invalid token format');
        return null;
      }

      const parts = token.split('.');
      if (parts.length !== 3) {
        console.error('Token does not have 3 parts');
        return null;
      }

      // Décoder le token JWT (partie payload en base64)
      let payload = parts[1];
      
      // Ajouter du padding si nécessaire pour base64
      while (payload.length % 4) {
        payload += '=';
      }

      const decodedPayload = atob(payload);
      return JSON.parse(decodedPayload);
    } catch (error) {
      console.error('Error decoding token:', error);
      console.error('Token:', token);
      return null;
    }
  }

  private getTokenPayload(): any {
    const token = this.getToken();
    if (token) {
      return this.decodeToken(token);
    }
    return null;
  }

  isLoggedIn(): boolean {
    try {
      const token = this.getToken();
      if (!token) {
        return false;
      }
      
      const payload = this.getTokenPayload();
      if (!payload) {
        // Si on ne peut pas décoder le token, le supprimer
        localStorage.removeItem('token');
        return false;
      }
      
      // Vérifier si le token n'est pas expiré
      const currentTime = Math.floor(Date.now() / 1000);
      const isValid = payload.exp > currentTime;
      
      if (!isValid) {
        // Token expiré, le supprimer
        localStorage.removeItem('token');
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error checking login status:', error);
      localStorage.removeItem('token');
      return false;
    }
  }

  getCurrentUserId(): number | null {
    try {
      const payload = this.getTokenPayload();
      return payload ? payload.userId : null;
    } catch (error) {
      console.error('Error getting user ID:', error);
      return null;
    }
  }

  getCurrentUserRole(): string | null {
    try {
      const payload = this.getTokenPayload();
      return payload ? payload.role : null;
    } catch (error) {
      console.error('Error getting user role:', error);
      return null;
    }
  }

  getCurrentUserEmail(): string | null {
    try {
      const payload = this.getTokenPayload();
      return payload ? payload.sub : null;
    } catch (error) {
      console.error('Error getting user email:', error);
      return null;
    }
  }

  getCurrentUser(): any {
    try {
      const payload = this.getTokenPayload();
      if (payload) {
        return {
          id: payload.userId,
          email: payload.sub,
          role: payload.role
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  // Méthode de débogage pour vérifier le token
  debugToken(): void {
    const token = this.getToken();
    console.log('Raw token:', token);
    
    if (token) {
      const parts = token.split('.');
      console.log('Token parts count:', parts.length);
      console.log('Header:', parts[0]);
      console.log('Payload:', parts[1]);
      console.log('Signature:', parts[2]);
      
      const payload = this.getTokenPayload();
      console.log('Decoded payload:', payload);
    }
  }

  // Méthode de test pour créer un token JWT valide (à des fins de test uniquement)
  createTestToken(role: string = 'CLIENT'): void {
    const header = {
      "alg": "HS256",
      "typ": "JWT"
    };
    
    const payload = {
      "role": role,
      "sub": role === 'ADMIN' ? "admin@test.com" : "client@test.com",
      "userId": role === 'ADMIN' ? 1 : 123,
      "iat": Math.floor(Date.now() / 1000),
      "exp": Math.floor(Date.now() / 1000) + (60 * 60) // 1 heure
    };
    
    // Encoder en base64 (simulation simple pour les tests)
    const encodedHeader = btoa(JSON.stringify(header));
    const encodedPayload = btoa(JSON.stringify(payload));
    const signature = "test-signature";
    
    const testToken = `${encodedHeader}.${encodedPayload}.${signature}`;
    localStorage.setItem('token', testToken);
    
    console.log('Test token created with role:', role);
    console.log('Test token:', testToken);
    this.debugToken();
  }
}
