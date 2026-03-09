import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';


@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class Login {
   email: string = '';
  password: string = '';

  constructor(private http: HttpClient, private router: Router) {}

  login() {

    fetch('http://127.0.0.1:5000/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: this.email,
        password: this.password
      })
    })
    .then(res => res.json())
    .then(data => {
      if (data.token) {

        localStorage.setItem('token', data.token);

        alert("Login Successful");
        this.router.navigate(['/home']);

      } else {
        alert("Invalid Credentials");
      }
    });
  }
}

