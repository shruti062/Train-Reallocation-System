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
      this.history = data.reverse();
    })
    .catch(err => {
      console.error("History Load Error:", err);
      alert("Failed to load history");
    });
  }

  // ================= DOWNLOAD TICKET =================
  downloadTicket(trainName: string) {

    const token = localStorage.getItem('token');

    fetch(`http://127.0.0.1:5000/download-ticket/${encodeURIComponent(trainName)}`, {
      method: "GET",
      headers: {
        "Authorization": "Bearer " + token
      }
    })
    .then(response => {
      if (!response.ok) {
        throw new Error("Download failed");
      }
      return response.blob();
    })
    .then(blob => {

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");

      a.href = url;
      a.download = "ticket.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();

    })
    .catch(err => {
      console.error("Download Error:", err);
      alert("Ticket download failed");
    });
  }

  // ================= CANCEL BOOKING =================
  cancelBooking(trainNo: string) {

    const token = localStorage.getItem('token');

    fetch(`http://127.0.0.1:5000/cancel-booking/${encodeURIComponent(trainNo)}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(res => res.json())
    .then(data => {
      alert(data.message || "Booking Cancelled");
      this.loadHistory();  // reload after cancel
    })
    .catch(err => {
      console.error("Cancel Error:", err);
      alert("Cancel failed");
    });
  }
}