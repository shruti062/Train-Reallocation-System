import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './register.html',
  styleUrls: ['./register.css']
})
export class Register {

  step: number = 1;

  phone: string = '';
  otp: string = '';
  name: string = '';
  email: string = '';
  password: string = '';

  captchaToken: string = '';

  constructor(private http: HttpClient, private router: Router) {

    // ✅ Listen for captcha success
    window.addEventListener('captchaResolved', (event: any) => {
      this.captchaToken = event.detail;
    });

  }

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

    }, () => {
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
        alert("OTP Verified ✅");
        this.step = 3;
      } else {
        alert("Invalid OTP ❌");
      }

    });
  }

  // ==========================
  // REGISTER
  // ==========================
  register() {

    if (!this.name || !this.email || !this.password) {
      alert("Fill all fields");
      return;
    }

    // ✅ Check captcha
    if (!this.captchaToken) {
      alert("Please verify 'I am not a robot'");
      return;
    }

    this.http.post('http://127.0.0.1:5000/register', {
      phone: this.phone,
      name: this.name,
      email: this.email,
      password: this.password,
      captcha_token: this.captchaToken
    }).subscribe(() => {

      alert("Registered Successfully 🎉");

      this.captchaToken = '';
      this.router.navigate(['/login']);

    }, () => {

      alert("Registration Failed ❌");

    });
  }
}

// ==========================
// reCAPTCHA Callback Function
// ==========================
(window as any).onCaptchaSuccess = (token: string) => {
  const event = new CustomEvent('captchaResolved', { detail: token });
  window.dispatchEvent(event);
};