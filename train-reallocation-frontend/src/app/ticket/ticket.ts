import { Component, OnInit, AfterViewInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';

@Component({
  selector: 'app-ticket',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ticket.html',
  styleUrls: ['./ticket.css']
})
export class Ticket implements OnInit, AfterViewInit {

  ticket: any = null;
  pnr!: string;

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {

    this.pnr = this.route.snapshot.paramMap.get('pnr')!;
    const token = localStorage.getItem('token');

    fetch(`http://127.0.0.1:5000/ticket/${this.pnr}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(res => res.json())
    .then(data => {
      this.ticket = data;

      // Wait for DOM
      setTimeout(() => {
        this.generateBarcode();
        this.generateQR();
      }, 200);
    });
  }

  ngAfterViewInit(): void {}

  generateBarcode(): void {
    const barcodeElement = document.getElementById('barcode');
    if (barcodeElement && this.ticket?.PNR) {
      JsBarcode(barcodeElement, this.ticket.PNR, {
        format: "CODE128",
        width: 2,
        height: 70,
        displayValue: false
      });
    }
  }

  generateQR(): void {
    const canvas = document.getElementById('qr-canvas') as HTMLCanvasElement;
    if (canvas && this.ticket?.PNR) {
      QRCode.toCanvas(canvas, this.ticket.PNR, {
        width: 100
      });
    }
  }

  printTicket(): void {
    window.print();
  }
}