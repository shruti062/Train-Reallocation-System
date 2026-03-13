import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-tt-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './tt-panel.html',
  styleUrls: ['./tt-panel.css']
})
export class TtPanel {

  pnr: string = '';
  train: any;
  trainNo: string = '';

  constructor(private http: HttpClient, private router: Router) {}

 checkAlternative(){

this.http.get(`http://127.0.0.1:5000/find-alternative/${this.pnr}`)
.subscribe((data:any)=>{
  this.train = data.alternative_trains[0];
},
error=>{
  alert("No alternative train found");
});

};
  

  allocateSeat(){

if(!this.train){
  alert("First check alternative train");
  return;
}

this.http.post('http://127.0.0.1:5000/tt-reallocate',{
  PNR: this.pnr,
  TrainNo: this.train.TrainNo
}).subscribe((res:any)=>{

  alert(res.message);

},
error=>{
  alert("Seat allocation failed");
  
});

}
cancelTrain(){

if(!this.trainNo){
  alert("Enter Train Number");
  return;
}

this.http.post(`http://127.0.0.1:5000/cancel-train/${this.trainNo}`,{})
.subscribe((res:any)=>{

alert(res.message);

},
error=>{
alert("Train cancel failed");
});

}
logout() {
    localStorage.clear();   // agar login data save hai
    this.router.navigate(['/login']); // login page pe redirect
  }
}