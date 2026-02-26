import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TrainService {

  private baseUrl = 'http://127.0.0.1:5000';

  constructor(private http: HttpClient) {}

  // 🔐 LOGIN API
  login(credentials: { username: string; password: string }): Observable<any> {
    return this.http.post(`${this.baseUrl}/login`, credentials);
  }

  // 🚆 SEAT PREDICTION API
  predictSeat(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/predict`, data);
  }

  // 📊 ANALYTICS API  ✅ ADD THIS
  getAnalytics(): Observable<any> {
    return this.http.get(`${this.baseUrl}/analytics`);
  }
  getHistory() {
  return this.http.get<any[]>(`${this.baseUrl}/history`);
}

}
