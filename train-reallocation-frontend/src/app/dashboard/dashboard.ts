import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart } from 'chart.js/auto';
import { TrainService } from '../services/train.service';
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class Dashboard implements OnInit {

constructor(private trainService: TrainService) {}
  ngOnInit(): void {
    this.loadSeatChart();
    this.loadTrainTypeChart();
  }

  loadSeatChart() {
  this.trainService.getAnalytics().subscribe(res => {
    new Chart('seatChart', {
      type: 'pie',
      data: {
        labels: ['Allocated', 'Not Allocated'],
        datasets: [{
          data: [res.allocated, res.not_allocated],
          backgroundColor: ['#2e7d32', '#c62828']
        }]
      }
    });
  });
  }

  loadTrainTypeChart() {
    new Chart('trainChart', {
      type: 'bar',
      data: {
        labels: ['Express', 'Passenger', 'Intercity'],
        datasets: [{
          label: 'Predictions',
          data: [30, 50, 20],
          backgroundColor: '#1976d2'
        }]
      }
    });
  }
}
