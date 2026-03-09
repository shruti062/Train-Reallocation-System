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
  passengerData: any;
  result: boolean = false;

  // 🔔 Notification variable
  notification: string = "";

  constructor(private router: Router) {}

  ngOnInit(): void {

    const state = history.state;

    this.train = state.selectedTrain;
    this.passengerData = state.passengerData;

    if (!this.train || !this.passengerData) {
      this.router.navigate(['/home']);
      return;
    }

    // 🤖 AI Smart Coach Logic
    if (this.train.Seats_Available < 20 && this.train.Train_Status !== 'Cancelled') {
      this.smartCoachAdd();
    }

    if (
      this.train.Seats_Available > 0 &&
      this.train.Train_Status !== 'Cancelled'
    ) {
      this.result = true;
    } else {
      this.result = false;
    }
  }

  // 🤖 Smart Coach Function
  smartCoachAdd() {

    // 1 coach = 72 seats
    this.train.Seats_Available += 72;

    this.notification =
      "🚆 AI System automatically added a new coach due to high passenger demand!";
  }

  confirmBooking() {

    const token = localStorage.getItem('token');

    fetch('http://127.0.0.1:5000/save-booking', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        TrainNo: this.train.TrainNo,
        TrainName: this.train.TrainName,
        Source: this.train.Source,
        Destination: this.train.Destination,
        Journey_Date: this.passengerData.Journey_Date,
        Departure_Time: this.train.Departure_Time,
        Arrival_Time: this.train.Arrival_Time,
        Passenger_Name: this.passengerData.Passenger_Name,
        Age: this.passengerData.Age,
        Gender: this.passengerData.Gender,
        Email: localStorage.getItem('email')
      })
    })
    .then(res => res.json())
    .then(data => {

      if (data.error) {
        alert(data.error);
      } else {

        alert("Seat Status: " + data.status);

        // 🔔 Smart coach notification
        if(this.notification){
          alert(this.notification);
        }

        this.router.navigate(['/ticket', data.PNR]);
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