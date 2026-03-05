import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';

@Component({
  selector: 'app-train-status',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './train-status.html',
  styleUrls: ['./train-status.css']
})
export class TrainStatus {

  passengerData = {
    Passenger_Name: '',
    Age: null,
    Gender: '',
    Journey_Date: ''
  };

  selectedTrain: any;

  constructor(private router: Router) {

    const state = history.state;

    if (!state.selectedTrain) {
      this.router.navigate(['/home']);
      return;
    }

    this.selectedTrain = state.selectedTrain;
  }

  continueBooking() {

    if (!this.passengerData.Passenger_Name ||
        !this.passengerData.Age ||
        !this.passengerData.Gender ||
        !this.passengerData.Journey_Date) {

      alert("Please fill all passenger details");
      return;
    }

    this.router.navigate(['/seat-allocation'], {
      state: {
        selectedTrain: this.selectedTrain,
        passengerData: this.passengerData
      }
    });
  }

  logout() {
    localStorage.removeItem('loggedIn');
    this.router.navigate(['/']);
  }
}