import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './history.html',
  styleUrls: ['./history.css']
})
export class History implements OnInit {

  history: any[] = [];

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.loadHistory();
  }

  // ================= LOAD HISTORY =================
  loadHistory() {
    

    const token = localStorage.getItem('token');
    

    fetch('http://127.0.0.1:5000/booking-history', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(res => {
      if (!res.ok) {
        throw new Error("Unauthorized");
      }
      return res.json();
    })
    .then(data => {
      this.history = data;
    })
    .catch(err => {
      console.error("History Load Error:", err);
      alert("Failed to load history");
    });
  }

  // ================= DOWNLOAD TICKET =================
 downloadTicket(pnr: string) {
this.router.navigate(['/ticket', pnr]);
}

  // ================= CANCEL BOOKING =================
  cancelBooking(pnr: string) {

  const token = localStorage.getItem('token');

  fetch(`http://127.0.0.1:5000/cancel-booking/${pnr}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  .then(res => res.json())
  .then(data => {
    alert(data.message || "Booking Cancelled");
    this.loadHistory();
  })
  .catch(err => {
    console.error("Cancel Error:", err);
    alert("Cancel failed");
  });
}
}