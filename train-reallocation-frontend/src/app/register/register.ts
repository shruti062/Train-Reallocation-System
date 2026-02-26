import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RecaptchaModule } from 'ng-recaptcha';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RecaptchaModule],
  templateUrl: './register.html',
  styleUrls: ['./register.css']
})
export class Register {

  // ==========================
  // VARIABLES
  // ==========================
  step = 1;
  phone: string = '';
  otp: string = '';
  name: string = '';
  email: string = '';
  password: string = '';

  // ✅ STRICT MODE FIX
  captchaToken: string | null = null;

  constructor(private http: HttpClient, private router: Router) {}

  // ==========================
  // SEND OTP
  // ==========================
  sendOtp() {

    if (!this.phone) {
      alert("Please enter phone number");
      return;
    }

    this.http.post('http://127.0.0.1:5000/send-otp', {
      phone: this.phone
    }).subscribe(() => {

      alert("OTP Sent!");
      this.step = 2;

    }, error => {
      alert("Failed to send OTP ❌");
    });
  }

  // ==========================
  // VERIFY OTP
  // ==========================
  verifyOtp() {

    if (!this.otp) {
      alert("Enter OTP");
      return;
    }

    this.http.post('http://127.0.0.1:5000/verify-otp', {
      phone: this.phone,
      otp: this.otp
    }).subscribe((res: any) => {

      if (res.success) {
        alert("OTP Verified! ✅");
        this.step = 3;
      } else {
        alert("Invalid OTP ❌");
      }

    }, error => {
      alert("OTP verification failed");
    });
  }

  // ==========================
  // CAPTCHA RESOLVED
  // ==========================
  onCaptchaResolved(token: string | null) {
    this.captchaToken = token;
  }

  // ==========================
  // REGISTER USER
  // ==========================
  register() {

    if (!this.name || !this.email || !this.password) {
      alert("Fill all fields");
      return;
    }

    if (!this.captchaToken) {
      alert("Please verify you are not a robot!");
      return;
    }

    this.http.post('http://127.0.0.1:5000/register', {
      phone: this.phone,
      name: this.name,
      email: this.email,
      password: this.password,
      captcha: this.captchaToken
    }).subscribe((res: any) => {

      alert("Registered Successfully! 🎉");

      // Redirect after success
      this.router.navigate(['/login']);

    }, error => {
      alert("Registration Failed ❌");
    });
  }
}
