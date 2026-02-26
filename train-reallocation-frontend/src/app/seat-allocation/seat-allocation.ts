import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-seat-allocation',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './seat-allocation.html',
  styleUrls: ['./seat-allocation.css']
})
export class SeatAllocation implements OnInit {

  train: any;
  result: boolean = false;   // ✅ must be boolean

  constructor(private router: Router) {}

  ngOnInit(): void {
  this.train = history.state.selectedTrain;

  if (!this.train) {
    this.router.navigate(['/home']);
    return;
  }

  console.log("Selected Train:", this.train);

  // ✅ MongoDB field names use karo
  if (
  this.train.Seats_Available > 0 &&
  this.train.Train_Status !== 'Cancelled'
) {
    this.result = true;
  } else {
    this.result = false;
  }
}

  confirmBooking() {

    const token = localStorage.getItem('token');

    if (!this.train?.TrainNo) {
      alert("Train number missing");
      return;
    }

    fetch('http://127.0.0.1:5000/save-booking', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        TrainNo: this.train.TrainNo   // ✅ correct field
      })
    })
    .then(res => res.json())
    .then(data => {

      if (data.error) {
        alert(data.error);
      } else {
        alert("Seat Status: " + data.status);
        this.router.navigate(['/history']);
      }

    })
    .catch(() => {
      alert("Booking failed");
    });
  }

  goBack() {
    this.router.navigate(['/home']);
  }
}