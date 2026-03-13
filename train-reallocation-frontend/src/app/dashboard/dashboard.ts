import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart } from 'chart.js/auto';
import { TrainService } from '../services/train.service';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class Dashboard implements OnInit, OnDestroy {

  seatChart: any;

  constructor(private trainService: TrainService, private router: Router) {}

  ngOnInit(): void {
    this.loadSeatChart();
  }

  loadSeatChart() {
    this.trainService.getAnalytics().subscribe(res => {

      if (this.seatChart) {
        this.seatChart.destroy();
      }

      this.seatChart = new Chart('seatChart', {
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

  ngOnDestroy(): void {
    if (this.seatChart) {
      this.seatChart.destroy();
    }
  }
  logout() {
    localStorage.clear();   // agar login data save hai
    this.router.navigate(['/login']); // login page pe redirect
  }
}