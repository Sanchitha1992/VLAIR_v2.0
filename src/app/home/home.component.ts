import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
declare const fabric: any;
declare var recordedEvents;
import * as XLSX from 'xlsx';
declare const math: any;
@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  file: File;
  arrayBuffer: any;
  arrayList: any;
  columns: any;
  rowData: any;
  datatypes: any = ['string', 'integer', 'float', 'date', 'boolean'];
  csvstring: any;
  transform: boolean = false;
  nrows: string;

  constructor(private router: Router) { }

  ngOnInit(): void {
    this.rowData = JSON.parse(sessionStorage.getItem('rowdata'));
    this.validationdata = JSON.parse(sessionStorage.getItem('validationdata'));
    this.selectedlabel = sessionStorage.getItem("selectedlabel") ;
    //this.dataService.rowdata = JSON.parse(JSON.stringify(this.rowData))
    if (this.rowData != null) {
      this.loaddata();
    }
  }

  computationFormula: string;
  computeName: string;



  addComputed() {
    this.rowData = null;
    this.rowData = JSON.parse(sessionStorage.getItem('rowdata'));
    for (let i = 0; i < this.rowData.length; i++) {
      this.rowData[i][this.computeName] = 0.1;
    }
    this.rowData.forEach(element => {
      Object.keys(element).forEach((key) => {
        if (this.computationFormula.indexOf(key) > -1) {
          element[key] = parseFloat(element[key]);
        }
      })
      element[this.computeName] = math.eval(this.computationFormula, element);
    });
    //this.dataService.rowdata = JSON.parse(JSON.stringify(this.rowData))

    this.loaddata();
    console.log(this.rowData);
    this.computationFormula = "";
    this.computeName = "";
  }

  makeTextBoxFocus(cell: any) {
    setTimeout(() => {
      cell.focus();
    }, 100)
  }

  addfile(input) {

    this.file = input.files[0];
    let fileReader = new FileReader();
    let reader = new FileReader();
    reader.readAsText(this.file);
    reader.onload = (e) => {
      this.csvstring = reader.result as string;
      console.log(this.csvstring);
    }
    fileReader.readAsArrayBuffer(this.file);

    fileReader.onload = (e) => {
      this.arrayBuffer = fileReader.result;
      var data = new Uint8Array(this.arrayBuffer);
      var arr = new Array();
      for (var i = 0; i != data.length; ++i) arr[i] = String.fromCharCode(data[i]);
      var bstr = arr.join("");
      var workbook = XLSX.read(bstr, { type: "binary" });
      var first_sheet_name = workbook.SheetNames[0];
      var worksheet = workbook.Sheets[first_sheet_name];
      console.log(worksheet)
      console.log(XLSX.utils.sheet_to_json(worksheet, { raw: false, defval: "" }));
      this.rowData = XLSX.utils.sheet_to_json(worksheet, { raw: false, defval: "" });
      //this.dataService.rowdata = JSON.parse(JSON.stringify(this.rowData));
      this.loaddata();
      this.backuprowdata = this.rowData;
      this.changeValidation();
    }
  }

  loaddata() {
    this.columns = Object.keys(this.rowData[0]).map(x => { return { headerName: x, finaltype: null, invalid: null, types: { string: 0, integer: 0, float: 0, date: 0, boolean: 0 } } });
    console.log(this.rowData)
    let tempColumns = this.columns;
    this.rowData.forEach(row => {
      tempColumns = this.columns.filter(x => x.invalid == null);
      tempColumns.forEach((column) => {
        if (row[column.headerName] == '') {
          this.columns.find(x => x.headerName == column.headerName).invalid = true;
        }
      });
    });
    //do validation
    this.validation();
    //select first 10 rows      
    this.nrows = 'f10';
    this.backuprowdata = JSON.parse(JSON.stringify(this.rowData));
    this.selectrows(this.nrows);
    sessionStorage.setItem('rowdata', JSON.stringify(this.rowData));
  }

  fieldSelected: string;
  fieldAction: string;

  removeReplace() {
    if (this.fieldAction == "Remove entire row") {
      this.rowData.forEach((element, index) => {
        if (element[this.fieldSelected] == "") { this.rowData.splice(index, 1); }
      });
    }
    else if (this.fieldAction == "Replace with Mean") {
      let rowsNonEmpty = this.rowData.filter(x => x[this.fieldSelected] != "");
      let value = 0;
      rowsNonEmpty.forEach(element => {
        value += parseFloat(element[this.fieldSelected]);
      });
      value = value / rowsNonEmpty.length;
      this.rowData.filter(x => x[this.fieldSelected] == "").forEach(element => {
        element[this.fieldSelected] = value.toFixed(2);
      });
    }
    else if (this.fieldAction == "Replace with Mode") {
      let rowsNonEmpty = this.rowData.filter(x => x[this.fieldSelected] != "").map(x => x[this.fieldSelected]);
      console.log(rowsNonEmpty);

      rowsNonEmpty.sort(function (a, b) {
        return a - b;
      });

      var half = Math.floor(rowsNonEmpty.length / 2);
      let value = 0
      if (rowsNonEmpty.length % 2)
        value = rowsNonEmpty[half];
      else
        value = (rowsNonEmpty[half - 1] + rowsNonEmpty[half]) / 2.0;

      this.rowData.filter(x => x[this.fieldSelected] == "").forEach(element => { element[this.fieldSelected] = value });

    }
  }

  validation() {
    let numberpattern = /^\d+$/;
    let floatpattern = /^\d+\.\d+?$/;
    this.rowData.forEach(row => {
      this.columns.forEach(column => {
        if (floatpattern.test(row[column.headerName])) {
          column['types']['float'] += 1;
          row[column.headerName + 'type'] = 'float';
        }
        else if (numberpattern.test(row[column.headerName])) {
          column['types']['integer'] += 1;
          row[column.headerName + 'type'] = 'integer';
        }
        else if (!isNaN((Date.parse(row[column.headerName])))) {
          column['types']['date'] += 1;
          row[column.headerName + 'type'] = 'date';
        }
        else if (typeof (row[column.headerName]) == "boolean") {
          column['types']['boolean'] += 1;
          row[column.headerName + 'type'] = 'boolean';
        }
        else {
          column['types']['string'] += 1;
          row[column.headerName + 'type'] = 'string';
        }
      });
    });
    this.columns.forEach(column => {
      let max = 0;
      Object.keys(column.types).forEach(type => {
        if (column['types'][type] > max) {
          max = column['types'][type];
          column.finaltype = type;
        }
      });
    });
    console.log(this.rowData)
    let tempColumns;
    this.columns.forEach(element => {
      element.invalid = null;
    });
    this.rowData.forEach(row => {
      tempColumns = this.columns.filter(x => x.invalid == null);
      tempColumns.forEach((column) => {
        if (row[column.headerName] == '') {
          this.columns.find(x => x.headerName == column.headerName).invalid = true;
        }
        if (column.finaltype != row[column.headerName + 'type']) {
          this.columns.find(x => x.headerName == column.headerName).invalid = true;
        }
      });
    });
  }

  validationdata: any[];
  applyChanges() {
    
    
    this.rowData.forEach(ele => {
      Object.keys(ele).forEach(key => {
        if (key.indexOf('type') > -1) {
          delete ele[key];
        }
      })
    })
    this.validationdata.forEach(ele => {
      Object.keys(ele).forEach(key => {
        if (key.indexOf('type') > -1) {
          delete ele[key];
        }
        delete ele['validation']
      })
    })
    sessionStorage.setItem('rowdata', JSON.stringify(this.rowData));
    sessionStorage.setItem('validationdata', JSON.stringify(this.validationdata));
    sessionStorage.setItem('selectedlabel', this.selectedlabel);
    this.router.navigate(["/drawVisual"]);
    //this.router.navigate(['/drawViz']);
  }
  selectedlabel: string;
  sort(column) {
    if (column.sort == null || column.sort == 'desc') {
      this.rowData.sort(function (a, b) {
        if (a[column.headerName] < b[column.headerName]) return -1;
        if (a[column.headerName] > b[column.headerName]) return 1;
        return 0;
      });
      column.sort = 'asc';

    }
    else {
      this.rowData.sort(function (a, b) {
        if (a[column.headerName] > b[column.headerName]) return -1;
        if (a[column.headerName] < b[column.headerName]) return 1;
        return 0;
      });
      column.sort = 'desc';
    }
    this.columns.filter(x => x.headerName != column.headerName).forEach(element => {
      element.sort = null;
    });
  }
  validationPercent: any="";
  backuprowdata: any;
  visible: boolean[];
  selectrows(nrows) {
    this.visible = [];
    this.rowData.forEach((a, i) => { this.visible.push(false); })
  
    if (nrows == 'f10') {
      this.rowData.forEach((ele, index) => { if (index < 10) { this.visible[index] = true; } });
    }
    else if (nrows == 'l10') {
      this.rowData.forEach((ele, index) => { if (this.rowData.length - index <= 10) { this.visible[index] = true; } });
    }
    else if (nrows == 'r10') {
      while (this.rowData.filter(x => x.visible == true).length < 10) {
        let randomnumber = Math.floor(Math.random() * this.rowData.length);
        this.visible[randomnumber] = true;
        randomnumber = Math.floor(Math.random() * this.rowData.length);
      }
    }
    else {
      this.rowData.forEach((a, index) => { this.visible[index] = true; })
    }
  }

  changeValidation() {
    this.rowData = JSON.parse(sessionStorage.getItem('rowdata'));
    this.rowData.forEach(a => { a.validation = false; })
    while (this.rowData.filter(x => x.validation == true).length < Math.floor(this.rowData.length * this.validationPercent / 100)) {
      let randomnumber = Math.floor(Math.random() * this.rowData.length);
      this.rowData[randomnumber].validation = true;
      randomnumber = Math.floor(Math.random() * this.rowData.length);
    }
    this.validationdata = []
    this.validationdata = this.rowData.filter(x => x.validation == true);
    for (let i = 0; i < this.rowData.length; i++) {
      if (this.rowData[i]['validation'] == true)
        this.rowData.splice(i, 1);
    }
    this.rowData.forEach(ele => {
      delete ele['validation']
    })

  }
}
