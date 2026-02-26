import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { TrainService } from '../services/train.service';

@Component({
  selector: 'app-train-status',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './train-status.html',
  styleUrls: ['./train-status.css']
})
export class TrainStatus {

  trainData = {
    Train_Type: '',
    Distance_km: 0,
    Seats_Available: 0,
    Diff_Alt_Train_Hrs: 0
  };

  result = '';
  loading = false;

  constructor(
    private trainService: TrainService,
    private router: Router
  ) {

    const selectedTrain = history.state.selectedTrain;

    if (selectedTrain) {
      this.trainData.Train_Type = selectedTrain.Train_Type || '';
      this.trainData.Seats_Available = selectedTrain.Seats_Available || 0;
      this.trainData.Distance_km = selectedTrain.Distance_km ?? 100;
      this.trainData.Diff_Alt_Train_Hrs = 1;
    }

  }

  // 🚦 Seat Prediction
  checkSeat() {

    this.loading = true;
    this.result = '';

    this.trainService.predictSeat(this.trainData).subscribe({
      next: (res: any) => {

        this.result = res.seat_allocated;
        this.loading = false;

        // ✅ Redirect to Seat Allocation page
        this.router.navigate(['/seat-allocation'], {
          state: {
            selectedTrain: history.state.selectedTrain, 
            result: res.seat_allocated
          }
        });

      },
      error: () => {
        this.result = 'Error connecting to server';
        this.loading = false;
      }
    });

  }

  // 🔐 Logout
  logout() {
    localStorage.removeItem('loggedIn');
    this.router.navigate(['/']);
  }
}