import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {

  trains: any[] = [];
  searchText: string = '';

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit() {
    this.loadTrains();
  }

  loadTrains() {
    this.http.get<any[]>('http://127.0.0.1:5000/available-trains')
      .subscribe(data => {
        this.trains = data;
      });
  }

  get filteredTrains() {
    return this.trains.filter(train =>
      (train.trainName || '').toLowerCase().includes(this.searchText.toLowerCase()) ||
      (train.source || '').toLowerCase().includes(this.searchText.toLowerCase()) ||
      (train.destination || '').toLowerCase().includes(this.searchText.toLowerCase())
    );
  }

  selectTrain(train: any) {
    this.router.navigate(['/seat-allocation'], {
      state: { selectedTrain: train }
    });
  }
}