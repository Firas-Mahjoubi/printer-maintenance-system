import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private apiUrl = 'http://localhost:8081'; // adjust this to your backend URL

  constructor(private http: HttpClient) {}

  login(email: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, { email:email, motDePasse: password });
  }

  logout() {
  localStorage.removeItem('token');
}

getToken(): string | null {
  return localStorage.getItem('token');
}

  isLoggedIn(): boolean {
    return !!this.getToken();
  }
}
