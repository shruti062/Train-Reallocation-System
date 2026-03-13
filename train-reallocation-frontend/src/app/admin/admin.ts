import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin.html',
  styleUrl: './admin.css',
})
export class Admin {
  username = '';
  password = '';
  error = '';

  constructor(private router: Router) {}

  login() {

    if (this.username === 'admin' && this.password === 'admin123') {

      localStorage.setItem('adminLoggedIn', 'true');
      this.router.navigate(['/tt-panel']);

    } else {
      this.error = 'Invalid Admin Credentials';
    }

  }
}
