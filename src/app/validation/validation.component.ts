import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-validation',
  templateUrl: './validation.component.html',
  styleUrls: ['./validation.component.css']
})
export class ValidationComponent implements OnInit {
  validationlogs: any;
    uniquelabels: any;

  constructor() { }

  ngOnInit(): void {
    if (sessionStorage.getItem("validationlog") == null) {
      sessionStorage.setItem("validationlogs", localStorage.getItem("validationlogs"))
    }
    if (sessionStorage.getItem("uniquelabels") == null) {
      sessionStorage.setItem("uniquelabels", localStorage.getItem("uniquelabels"))
    }
    this.uniquelabels = JSON.parse(sessionStorage.getItem("uniquelabels"));
    this.validationlogs = JSON.parse(sessionStorage.getItem("validationlogs"));
  }

}
