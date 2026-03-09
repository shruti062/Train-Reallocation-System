import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-pnr-search',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pnr-search.html',
  styleUrls: ['./pnr-search.css']
})
export class PnrSearch {

  pnr: string = '';
  ticket: any = null;

  searchPNR(){

    fetch(`http://127.0.0.1:5000/pnr-status/${this.pnr}`)
    .then(res => res.json())
    .then(data => {

      if(data.error){
        alert("PNR not found");
      }else{
        this.ticket = data;
      }

    })
    .catch(()=>{
      alert("Server error");
    });

  }

}