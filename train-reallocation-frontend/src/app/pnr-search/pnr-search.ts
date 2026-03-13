import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

declare var google:any;

@Component({
selector:'app-pnr-search',
standalone:true,
imports:[CommonModule,FormsModule,RouterModule],
templateUrl:'./pnr-search.html',
styleUrls:['./pnr-search.css']
})

export class PnrSearch{

pnr:string='';
ticket:any=null;

constructor(private router:Router){}

searchPNR(){

fetch(`http://127.0.0.1:5000/pnr-status/${this.pnr}`)
.then(res=>res.json())
.then(data=>{

if(data.error){
alert("PNR not found");
}

else{

this.ticket=data;

const source=data.Source;
const destination=data.Destination;

/* CALL MAP */

setTimeout(()=>{
this.showMap(source,destination);
},500);

}

})

.catch(()=>{
alert("Server error");
});

}

/* MAP FUNCTION */

showMap(source:string,destination:string){

const map=new google.maps.Map(
document.getElementById("map"),
{
zoom:6,
center:{lat:22.9734,lng:78.6569}
}
);

const directionsService=new google.maps.DirectionsService();
const directionsRenderer=new google.maps.DirectionsRenderer();

directionsRenderer.setMap(map);

directionsService.route(
{
origin:source,
destination:destination,
travelMode:'DRIVING'
},
(result:any,status:any)=>{

if(status==="OK"){

directionsRenderer.setDirections(result);

const route=result.routes[0].overview_path;

this.animateTrain(route,map);

}

});

}

/* TRAIN ANIMATION */

animateTrain(route:any,map:any){

let index=0;

const trainIcon={
url:'https://maps.google.com/mapfiles/kml/shapes/rail.png',
scaledSize:new google.maps.Size(40,40)
};

const marker=new google.maps.Marker({
position:route[0],
map:map,
icon:trainIcon
});

setInterval(()=>{

index++;

if(index>=route.length){
index=0;
}

marker.setPosition(route[index]);

},2000);

}

logout(){

localStorage.clear();

this.router.navigate(['/login']);

}

}