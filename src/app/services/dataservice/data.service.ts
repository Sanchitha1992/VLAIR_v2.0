import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DataService {

  rowdata: any;
  canvasCollection: any;
  validationCollection: any;
  constructor() { }
  validationlogs: any;
}
