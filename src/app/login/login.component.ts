import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  title = 'VLAIR';
  name:string;
  password:string;
  data:any;
  ngOnInit(){
    this.data=[{name:'sanchitha',password:'abc123'}];
  }

  constructor(private router:Router){

  }


  login(e: any) {
    if ((e != null && e.keyCode === 13)|| e.keyCode==null) {
      let passwordStored = this.data.find(x => x.name == this.name).password;
      if (passwordStored == this.password) {
        this.router.navigate(['/home']);
      }
      else {
        alert('Please enter correct credentials');
      }
    }
  }
}
