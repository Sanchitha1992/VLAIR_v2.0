import { Component, OnInit } from '@angular/core';
import { Local } from 'protractor/built/driverProviders';
import { DataService } from '../services/dataservice/data.service';
import { HttpClient, HttpHeaders } from '@angular/common/http'
import { ActivatedRoute, Router } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { Session } from 'protractor';


@Component({
  selector: 'app-experiment',
  templateUrl: './experiment.component.html',
  styleUrls: ['./experiment.component.css']
})
export class ExperimentComponent implements OnInit {

  constructor(private dataService: DataService, private httpClient: HttpClient, private router: Router, private title: Title, private activatedRoute: ActivatedRoute) { }

  thumbnailCollection: any;
  selectedLabel: string;
  imgWidth: number;
  imgHeight: number;
  trainPercent: number = 70;
  testPercent: number = 30;
  loadImage(e) {
    this.imgHeight = e.path[0].naturalHeight;
    this.imgWidth = e.path[0].naturalWidth;
  }

  revertDataSelection(col) {
    col.datasetSelection = col.datasetSelection == 'train' ? 'test' : 'train'
    this.trainPercent = parseFloat((this.dataService.canvasCollection.filter(x => x.datasetSelection == 'train').length*100 / this.dataService.canvasCollection.length).toFixed(2))
    this.testPercent = parseFloat((this.dataService.canvasCollection.filter(x => x.datasetSelection == 'test').length*100 / this.dataService.canvasCollection.length).toFixed(2))
  }

  trainChange(e) {
    this.testPercent = 100 - e;
    this.dataService.canvasCollection.forEach(e => e.datasetSelection = 'test');
    while (this.dataService.canvasCollection.filter(x => x.datasetSelection == 'train').length < Math.floor(this.dataService.canvasCollection.length * e / 100)) {
      let randomnumber = Math.floor(Math.random() * this.dataService.canvasCollection.length);
      this.dataService.canvasCollection[randomnumber].datasetSelection = 'train';
      randomnumber = Math.floor(Math.random() * this.dataService.canvasCollection.length);
    }
    console.log(this.dataService.canvasCollection)
  }
  showTrain: boolean = true;
  showTest: boolean = true;
  showModal: boolean = false;
  ngOnInit(): void {
    this.dataService.canvasCollection = this.dataService.canvasCollection = JSON.parse(sessionStorage.getItem("canvasCollection&e" + this.activatedRoute.snapshot.queryParams['etab']));
     this.dataService.validationCollection=JSON.parse(localStorage.getItem("validationCollection"));
    this.distinctlabel = [...new Set(this.dataService.canvasCollection.map(x => x.label))]
    this.selectedLabel = this.distinctlabel[0];
    this.trainChange(this.trainPercent);
  }
  distinctlabel: any[];
  trainComplete: boolean = null;
  url: string = 'http://localhost:5000/';
  trainlogs: any ;
  compareResults: boolean = false;
  train() {
    const headers = new HttpHeaders().set('Access-Control-Allow-Origin', '*');
    let interval = setInterval(() => {
      this.httpClient.get(this.url + 'getlogs', { 'headers': headers }).subscribe((data: any) => {
        this.trainlogs = JSON.parse(data.replace(/\'/g, '"'));
      });
    }, 5000);
    this.trainComplete = false;
    this.httpClient.post(this.url + 'train', { data: this.dataService.canvasCollection.filter(x => x.datasetSelection == 'train') }).subscribe((data: any) => {
      this.trainlogs = JSON.parse(data.replace(/\'/g, '"'));
      clearInterval(interval);
      this.trainComplete = true;
    });
  }

  validateComplete: boolean;
  validationlogs: any;
  showValResults: boolean=false;
  validate() {
    if (!confirm("Do you want to proceed with validation?")) {
      return;
    }
    const headers = new HttpHeaders().set('Access-Control-Allow-Origin', '*');
    //this.validateComplete = false;
    this.dataService.validationCollection.forEach((element, index) => {
      element.name = 'validate' + index;
    });
    this.httpClient.post(this.url + 'validate', { data: this.dataService.validationCollection }).subscribe((data: any) => {
      this.validateComplete = true;
      this.validationlogs = data;
      this.validationlogs.data = [];

      this.validationlogs.valfilenames.forEach((element, index) => {
        this.validationlogs.data.push(this.dataService.validationCollection.find(x => x.name == element.replace('.png', '')).data);
      });
      console.log(this.validationlogs)
      let unique = [...new Set(this.validationlogs.vallabels)];

      for (let i = 0; i < unique.length; i++) {
        for (let j = 0; j < unique.length; j++) {
          this.validationlogs.cm[i][j] = { 'count': 0, 'ischecked': [false,false,false,false] };
          for (let k = 0; k < this.validationlogs.vallabels.length; k++) {
            if (this.validationlogs.vallabels[k] == unique[i] && this.validationlogs.predictedlabels[k] == unique[j]) {
              this.validationlogs.cm[i][j].count++;
            }
          }
        }
      }
      this.dataService.validationlogs = this.validationlogs
      localStorage.setItem("uniquelabels", JSON.stringify(this.uniquelabels));
      localStorage.setItem("validationlogs", JSON.stringify(this.validationlogs));
      window.open("/validate?etab=" + this.activatedRoute.snapshot.queryParams["etab"] + "&vtab=" + ++this.validatetab);
    });
  }
  comparetab: number = 0
  validatetab: number = 0
  selectedResultAnalysisName: string;
  predictedResultAnalysisName: string;
  predictedImageNamesCrct: number[] = [];
  predictedImageNamesFault: number[] = [];
  selectedPredictedFaultImage: string;
  selectedPredictedCrctImage: string;
  notselectedUniqueLabels: string[];

  showResultAnalysis(name) {
    this.selectedResultAnalysisName = name;
    this.showResultAnalysisPopup = true;

    this.notselectedUniqueLabels = [];
    for (let i = 0; i < this.uniquelabels.length; i++) {
      if (this.uniquelabels[i] != name) {
        this.notselectedUniqueLabels.push(this.uniquelabels[i])
      }
    }
    this.showpredictedResults(this.notselectedUniqueLabels[0]);
  }

  showpredictedResults(name) {
    this.predictedImageNamesCrct = [];
    this.predictedImageNamesFault = [];
    for (let k = 0; k < this.testlogs.testlabels.length; k++) {
      if (this.testlogs.testlabels[k].indexOf(this.selectedResultAnalysisName) > -1
        && this.testlogs.predictedlabels[k].indexOf(this.selectedResultAnalysisName) > -1) {
        this.predictedImageNamesCrct.push(k);
      }
      if (this.testlogs.testlabels[k].indexOf(this.selectedResultAnalysisName) > -1
        && this.testlogs.predictedlabels[k].indexOf(name) > -1) {
        this.predictedImageNamesFault.push(k);
      }
    }
    if (this.predictedImageNamesCrct.length > 0) {
      this.selectedPredictedCrctImage = this.testlogs.data[this.predictedImageNamesCrct[0]];
    }
    this.selectedPredictedFaultImage = this.testlogs.data[this.predictedImageNamesFault[0]];
  }
  showResultAnalysisPopup: boolean = false;
  testlogs: any;
  testComplete: boolean;
  test() {
    const headers = new HttpHeaders().set('Access-Control-Allow-Origin', '*');
    this.testComplete = false;
    this.dataService.canvasCollection.forEach((element, index) => {
      element.name = 'test' + index;
    });
    this.httpClient.post(this.url + 'test', { data: this.dataService.canvasCollection.filter(x => x.datasetSelection == 'test') }).subscribe((data: any) => {
      this.testComplete = true;
      this.testlogs = data;
      this.testlogs.data = [];
      this.trainlogs.cm = [];
      this.testlogs.label = [];
      this.testlogs.testfilenames.forEach((element, index) => {
        this.testlogs.data.push(this.dataService.canvasCollection.find(x => x.name == element.replace('.png', '')).data);
        this.testlogs.label.push(this.dataService.canvasCollection.find(x => x.name == element.replace('.png', '')).label);
      });
      console.log(this.testlogs)
      let unique = [...new Set(this.testlogs.testlabels)];

      for (let i = 0; i < unique.length; i++) {
        for (let j = 0; j < unique.length; j++) {
          this.testlogs.cm[i][j] = {'count': 0,'ischecked':[false,false,false,false]};
          for (let k = 0; k < this.testlogs.testlabels.length; k++) {
            if (this.testlogs.testlabels[k] == unique[i] && this.testlogs.predictedlabels[k] == unique[j]) {
              this.testlogs.cm[i][j].count++;
            }
          }
        }
      }

      this.uniquelabels = unique.map((x: string) => x.replace('Test\\', ''));
      for (let i = 0; i < this.uniquelabels.length; i++) {
        this.trainColumnCheck.push([false,false,false,false])
        this.testColumnCheck.push([false, false, false, false]);
        this.trainRowCheck.push([false, false, false, false])
        this.testRowCheck.push([false, false, false, false]);
      }
      for (let i = 0; i < unique.length; i++) {
        this.trainlogs.cm.push([]);
        for (let j = 0; j < unique.length; j++) {
          this.trainlogs.cm[i].push({'count': 0,'ischecked':[false,false,false,false]})
        }
        this.trainlogs.cm[i][i] = { 'count': this.dataService.canvasCollection.filter(x => x.datasetSelection == 'train' && x.label == this.uniquelabels[i]).length, 'ischecked': [false,false,false,false] };
      }
    });
  }
  trainColumnCheck = []
  trainRowCheck = [];
  testColumnCheck = []
  testRowCheck=[]
  multiplerenderColumn(sectionSelected, set, index, ischecked) {
    if (set == 'train') {
      this.renderSection(sectionSelected, set, index, 0, ischecked)
      for (let i = 0; i < this.uniquelabels.length; i++) {
        this.trainlogs.cm[i][index].ischecked[sectionSelected] = ischecked
      }
      this.trainColumnCheck[index][sectionSelected] = ischecked
    } else {
      for (let i = 0; i < this.uniquelabels.length; i++) {
        this.renderSection(sectionSelected, set, i, index, ischecked)
        this.testlogs.cm[i][index].ischecked[sectionSelected] = ischecked
      }
      this.testColumnCheck[index][sectionSelected] = ischecked
    }
  }

  multiplerenderRow(sectionSelected, set, index, ischecked) {
    if (set == 'train') {
      this.renderSection(sectionSelected, set, 0, index, ischecked)
      for (let i = 0; i < this.uniquelabels.length; i++) {
        this.trainlogs.cm[index][i].ischecked[sectionSelected] = ischecked
      }
      this.trainRowCheck[index][sectionSelected] = ischecked
    } else {
      for (let i = 0; i < this.uniquelabels.length; i++) {
        this.renderSection(sectionSelected, set, index, i, ischecked)
        this.testlogs.cm[index][i].ischecked[sectionSelected] = ischecked
      }
      this.testRowCheck[index][sectionSelected] = ischecked
    }
  }

  renderSection(sectionSelected, set, index, secondindex, ischecked) {
    if (sectionSelected == 1) {
      this.section1set = set
      if (ischecked) {
        if (set == 'train') {
          this.section1 = this.section1.concat(this.dataService.canvasCollection.filter(x => x.datasetSelection == 'train' && x.label == this.uniquelabels[index]).map(x => { return { 'data': x.data, 'typename': set + index + ':' + secondindex, 'type': set,'label':x.data } }))
          this.trainlogs.cm[index][secondindex].ischecked[sectionSelected] = ischecked
        }
        else {
          let unique = [...new Set(this.testlogs.testlabels)];
          for (let k = 0; k < this.testlogs.testlabels.length; k++) {
            if (this.testlogs.testlabels[k] == unique[index] && this.testlogs.predictedlabels[k] == unique[secondindex]) {
              this.section1.push({ 'data': this.testlogs.data[k], 'typename': set + index + ':' + secondindex, 'type': set});
            }
          }
          this.testlogs.cm[index][secondindex].ischecked[sectionSelected] = ischecked
        }
      } else {
        this.section1 = this.section1.filter(x => x['typename'] != set + index + ':' + secondindex)

      }
    }
    else if (sectionSelected == 2) {
      this.section2set = set
      if (ischecked) {
        if (set == 'train') {
          this.section2 = this.section2.concat(this.dataService.canvasCollection.filter(x => x.datasetSelection == 'train' && x.label == this.uniquelabels[index]).map(x => { return { 'data': x.data, 'typename': set + index + ':' + secondindex, 'type': set } }))
          this.trainlogs.cm[index][secondindex].ischecked[sectionSelected] = ischecked
        }
        else {
          let unique = [...new Set(this.testlogs.testlabels)];

          for (let k = 0; k < this.testlogs.testlabels.length; k++) {
            if (this.testlogs.testlabels[k] == unique[index] && this.testlogs.predictedlabels[k] == unique[secondindex]) {
              this.section2.push({ 'data': this.testlogs.data[k], 'typename': set + index + ':' + secondindex, 'type': set });
            }
          }
          this.testlogs.cm[index][secondindex].ischecked[sectionSelected] = ischecked
        }
      }
      else {
        this.section2 = this.section2.filter(x => x['typename'] != set + index + ':' + secondindex)
      }
    }
    else if (sectionSelected == 3) {
      this.section3set = set
      if (ischecked) {
        if (set == 'train') {
          this.section3 = this.section3.concat(this.dataService.canvasCollection.filter(x => x.datasetSelection == 'train' && x.label == this.uniquelabels[index]).map(x => { return { 'data': x.data, 'typename': set + index + ':' + secondindex, 'type': set } }))
          this.trainlogs.cm[index][secondindex].ischecked[sectionSelected] = ischecked
        }
        else {
          let unique = [...new Set(this.testlogs.testlabels)];

          for (let k = 0; k < this.testlogs.testlabels.length; k++) {
            if (this.testlogs.testlabels[k] == unique[index] && this.testlogs.predictedlabels[k] == unique[secondindex]) {
              this.section3.push({ 'data': this.testlogs.data[k], 'typename': set + index + ':' + secondindex, 'type': set });
            }
          }
          this.testlogs.cm[index][secondindex].ischecked[sectionSelected] = ischecked
        }
      }
      else {
        this.section3 = this.section3.filter(x => x['typename'] != set + index + ':' + secondindex)
      }
    }
    else if (sectionSelected == 4) {
      this.section4set = set
      if (ischecked) {
        if (set == 'train') {
          this.section4 = this.section4.concat(this.dataService.canvasCollection.filter(x => x.datasetSelection == 'train' && x.label == this.uniquelabels[index]).map(x => { return { 'data': x.data, 'typename': set + index + ':' + secondindex, 'type': set } }))
          this.trainlogs.cm[index][secondindex].ischecked[sectionSelected] = ischecked
        }
        else {
          let unique = [...new Set(this.testlogs.testlabels)];

          for (let k = 0; k < this.testlogs.testlabels.length; k++) {
            if (this.testlogs.testlabels[k] == unique[index] && this.testlogs.predictedlabels[k] == unique[secondindex]) {
              this.section4.push({ 'data': this.testlogs.data[k], 'typename': set + index + ':' + secondindex, 'type': set });
            }
          }
          this.testlogs.cm[index][secondindex].ischecked[sectionSelected] = ischecked
        }
      }
      else {
        this.section4 = this.section4.filter(x => x['typename'] != set + index + ':' + secondindex)
      }
    }
  }
  section4 = [];
  section3 = [];
  section2 = [];
  section1 = [];
  section1set: string;
  section2set: string;
  section3set: string;
  section4set: string;
  uniquelabels: any;
  zoomPercentage: number = 100;
  sectionSelected: number;

  navigateToCompare() {
    ++this.comparetab;

    sessionStorage.setItem("testlogs&e" + this.activatedRoute.snapshot.queryParams["etab"] + '&c' + this.comparetab, JSON.stringify(this.testlogs));
    sessionStorage.setItem("trainlogs&e" + this.activatedRoute.snapshot.queryParams["etab"] + '&c' + this.comparetab, JSON.stringify(this.trainlogs));
    sessionStorage.setItem('uniquelabels&e' + this.activatedRoute.snapshot.queryParams["etab"] + '&c' + this.comparetab, JSON.stringify(this.uniquelabels))
    window.open("/compare?etab=" + this.activatedRoute.snapshot.queryParams["etab"] + "&ctab=" + this.comparetab);
  }
}

