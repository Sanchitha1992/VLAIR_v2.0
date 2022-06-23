import { Component, OnInit } from '@angular/core';
import { Local } from 'protractor/built/driverProviders';
import { DataService } from '../services/dataservice/data.service';
import { HttpClient, HttpHeaders } from '@angular/common/http'


@Component({
  selector: 'app-experiment',
  templateUrl: './experiment.component.html',
  styleUrls: ['./experiment.component.css']
})
export class ExperimentComponent implements OnInit {

  constructor(private dataService: DataService, private httpClient: HttpClient) { }

  canvasCollection: any;
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
    this.trainPercent = parseFloat((this.canvasCollection.filter(x => x.datasetSelection == 'train').length*100 / this.canvasCollection.length).toFixed(2))
    this.testPercent = parseFloat((this.canvasCollection.filter(x => x.datasetSelection == 'test').length*100 / this.canvasCollection.length).toFixed(2))
  }

  trainChange(e) {
    this.testPercent = 100 - e;
    this.canvasCollection.forEach(e => e.datasetSelection = 'test');
    while (this.canvasCollection.filter(x => x.datasetSelection == 'train').length < Math.floor(this.canvasCollection.length * e / 100)) {
      let randomnumber = Math.floor(Math.random() * this.canvasCollection.length);
      this.canvasCollection[randomnumber].datasetSelection = 'train';
      randomnumber = Math.floor(Math.random() * this.canvasCollection.length);
    }
    console.log(this.canvasCollection)
  }
  showTrain: boolean = true;
  showTest: boolean = true;
  showModal: boolean = false;
  ngOnInit(): void {
    if (this.dataService.canvasCollection != null) {
      this.canvasCollection = this.dataService.canvasCollection
      localStorage.setItem("canvasCollection", JSON.stringify(this.canvasCollection));
    }
    else if (localStorage.getItem("canvasCollection") != null) {
      this.canvasCollection = JSON.parse(localStorage.getItem("canvasCollection"));
    }
    this.distinctlabel = [...new Set(this.canvasCollection.map(x => x.label))]
    this.selectedLabel = this.distinctlabel[0];
    this.trainChange(this.trainPercent);
  }
  distinctlabel: any[];
  trainComplete: boolean = null;
  url: string = 'http://vlairml.australiaeast.cloudapp.azure.com:5000/';
  trainlogs: string = '';
  compareResults: boolean = false;
  train() {
    const headers = new HttpHeaders().set('Access-Control-Allow-Origin', '*');
    let interval = setInterval(() => {
      this.httpClient.get(this.url + 'getlogs', { 'headers': headers }).subscribe((data: any) => {
        this.trainlogs = JSON.parse(data.replace(/\'/g, '"'));
      });
    }, 5000);
    this.trainComplete = false;
    this.httpClient.post(this.url + 'train', { data: this.canvasCollection.filter(x => x.datasetSelection == 'train') }).subscribe((data: any) => {
      this.trainlogs = JSON.parse(data.replace(/\'/g, '"'));
      clearInterval(interval);
      this.trainComplete = true;
    });
  }

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
  trainlogcm: any;
  test() {
    const headers = new HttpHeaders().set('Access-Control-Allow-Origin', '*');
    this.testComplete = false;
    this.canvasCollection.forEach((element, index) => {
      element.name = 'test' + index;
    });
    this.httpClient.post(this.url + 'test', { data: this.canvasCollection.filter(x => x.datasetSelection == 'test') }).subscribe((data: any) => {
      this.testComplete = true;
      this.testlogs = data;
      this.testlogs.data = [];
      this.trainlogcm = [];
      this.testlogs.testfilenames.forEach((element, index) => {
        this.testlogs.data.push(this.canvasCollection.find(x => x.name == element.replace('.png', '')).data);
      });
      console.log(this.testlogs)
      let unique = [...new Set(this.testlogs.testlabels)];

      for (let i = 0; i < unique.length; i++) {
        for (let j = 0; j < unique.length; j++) {
          this.testlogs.cm[i][j] = 0;
          for (let k = 0; k < this.testlogs.testlabels.length; k++) {
            if (this.testlogs.testlabels[k] == unique[i] && this.testlogs.predictedlabels[k] == unique[j]) {
              this.testlogs.cm[i][j]++;
            }
          }
        }
      }

      this.uniquelabels = unique.map((x: string) => x.replace('Test\\', ''));
      for (let i = 0; i < unique.length; i++) {
        this.trainlogcm.push([]);
        for (let j = 0; j < unique.length; j++) {
          this.trainlogcm[i].push(0)
        }
        this.trainlogcm[i][i] = this.canvasCollection.filter(x => x.datasetSelection == 'train' && x.label == this.uniquelabels[i]).length;
      }
    });
  }

  renderSection(sectionSelected, set, index, secondindex) {
    if (sectionSelected == 1) {
      this.section1 = [];
      this.section1set=set
      if (set == 'train') {
        this.section1 = this.canvasCollection.filter(x => x.datasetSelection == 'train' && x.label == this.uniquelabels[index]).map(x => x.data)

      }
      else {
        let unique = [...new Set(this.testlogs.testlabels)];

        for (let k = 0; k < this.testlogs.testlabels.length; k++) {
          if (this.testlogs.testlabels[k] == unique[index] && this.testlogs.predictedlabels[k] == unique[secondindex]) {
            this.section1.push(this.testlogs.data[k]);
          }
        }
      }
    }
    else if (sectionSelected == 2) {
      this.section2 = [];
      this.section2set = set
      if (set == 'train') {
        this.section2 = this.canvasCollection.filter(x => x.datasetSelection == 'train' && x.label == this.uniquelabels[index]).map(x => x.data)
      }
      else {
        let unique = [...new Set(this.testlogs.testlabels)];

        for (let k = 0; k < this.testlogs.testlabels.length; k++) {
          if (this.testlogs.testlabels[k] == unique[index] && this.testlogs.predictedlabels[k] == unique[secondindex]) {
            this.section2.push(this.testlogs.data[k]);
          }
        }
      }
    }
    else if (sectionSelected == 3) {
      this.section3 = [];
      this.section3set = set
      if (set == 'train') {
        this.section3 = this.canvasCollection.filter(x => x.datasetSelection == 'train' && x.label == this.uniquelabels[index]).map(x => x.data)
      }
      else {
        let unique = [...new Set(this.testlogs.testlabels)];

        for (let k = 0; k < this.testlogs.testlabels.length; k++) {
          if (this.testlogs.testlabels[k] == unique[index] && this.testlogs.predictedlabels[k] == unique[secondindex]) {
            this.section3.push(this.testlogs.data[k]);
          }
        }
      }
    }
    else if (sectionSelected == 4) {
      this.section4 = [];
      this.section4set = set
      if (set == 'train') {
        this.section4 = this.canvasCollection.filter(x => x.datasetSelection == 'train' && x.label == this.uniquelabels[index]).map(x => x.data)
      }
      else {
        let unique = [...new Set(this.testlogs.testlabels)];

        for (let k = 0; k < this.testlogs.testlabels.length; k++) {
          if (this.testlogs.testlabels[k] == unique[index] && this.testlogs.predictedlabels[k] == unique[secondindex]) {
            this.section4.push(this.testlogs.data[k]);
          }
        }
      }
    }
    this.sectionSelected = 0;
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
}

