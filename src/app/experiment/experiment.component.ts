import { Component, OnInit } from '@angular/core';
import { Local } from 'protractor/built/driverProviders';
import { DataService } from '../services/dataservice/data.service';
import {  HttpClient, HttpHeaders } from '@angular/common/http'


@Component({
  selector: 'app-experiment',
  templateUrl: './experiment.component.html',
  styleUrls: ['./experiment.component.css']
})
export class ExperimentComponent implements OnInit {

  constructor(private dataService: DataService,private httpClient:HttpClient) { }

  canvasCollection: any;
  thumbnailCollection: any;
  selectedLabel: string;
  imgWidth: number;
  imgHeight: number;
  trainPercent: number=70;
  testPercent: number = 30;
  loadImage(e) {
    this.imgHeight = e.path[0].naturalHeight;
    this.imgWidth = e.path[0].naturalWidth;
  }

  revertDataSelection(col){
    col.datasetSelection=col.datasetSelection=='train'?'test':'train'
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
  showTrain:boolean=true;
  showTest:boolean=true;
  showModal:boolean=false;
  ngOnInit(): void {
    if (this.dataService.canvasCollection != null) {
      this.canvasCollection = this.dataService.canvasCollection
      localStorage.setItem("canvasCollection", JSON.stringify(this.canvasCollection));
    }
    else if (localStorage.getItem("canvasCollection") != null) {
      this.canvasCollection = JSON.parse(localStorage.getItem("canvasCollection"));
    }
    this.distinctlabel=[...new Set(this.canvasCollection.map(x=>x.label))]
    this.selectedLabel = this.distinctlabel[0];
    this.trainChange(this.trainPercent);
  }
  distinctlabel:any[];
  trainComplete:boolean=null;
  url:string='http://127.0.0.1:5000/';
  trainlogs:string='';
  train(){
    const headers= new HttpHeaders().set('Access-Control-Allow-Origin', '*');
   let interval= setInterval(() => {
    this.httpClient.get(this.url+'getlogs',{'headers':headers}).subscribe((data:any)=>{
      this.trainlogs=JSON.parse(data.replace(/\'/g, '"'));
    });
   }, 5000); 
   this.trainComplete=false;
   this.httpClient.post(this.url+'train',{data:this.canvasCollection.filter(x=>x.datasetSelection=='train')}).subscribe((data:any)=>{
    this.trainlogs=JSON.parse(data.replace(/\'/g, '"'));
    clearInterval(interval);
    this.trainComplete=true;
  });
  }

  selectedResultAnalysisName:string;
  predictedResultAnalysisName:string;
  predictedImageNamesCrct:number[]=[];
  predictedImageNamesFault:number[]=[];
  selectedPredictedFaultImage:string;
  selectedPredictedCrctImage:string;
  notselectedUniqueLabels:string[];

  showResultAnalysis(name){
    this.selectedResultAnalysisName=name;
    this.showResultAnalysisPopup=true;

    this.notselectedUniqueLabels=[];
    for(let i=0;i<this.uniquelabels.length;i++){
      if(this.uniquelabels[i]!=name){
        this.notselectedUniqueLabels.push(this.uniquelabels[i])
      }
    }
    this.showpredictedResults(this.notselectedUniqueLabels[0]);
  }

  showpredictedResults(name){
    this.predictedImageNamesCrct=[];
    this.predictedImageNamesFault=[];
    for(let k=0;k<this.testlogs.testlabels.length;k++)
    {
      if(this.testlogs.testlabels[k].indexOf(this.selectedResultAnalysisName)>-1 
      && this.testlogs.predictedlabels[k].indexOf(this.selectedResultAnalysisName)>-1){
        this.predictedImageNamesCrct.push(k);
      }
      if(this.testlogs.testlabels[k].indexOf(this.selectedResultAnalysisName)>-1 
      && this.testlogs.predictedlabels[k].indexOf(name)>-1){
        this.predictedImageNamesFault.push(k);
      }
    }
    if(this.predictedImageNamesCrct.length>0){
      this.selectedPredictedCrctImage=this.testlogs.data[this.predictedImageNamesCrct[0]];
    }
      this.selectedPredictedFaultImage=this.testlogs.data[this.predictedImageNamesFault[0]];
  }
  showResultAnalysisPopup:boolean=false;
  testlogs:any;
  testComplete:boolean;
  test(){
    const headers= new HttpHeaders().set('Access-Control-Allow-Origin', '*');
    this.testComplete=false;
    this.canvasCollection.forEach((element,index) => {
      element.name='test'+index;
    });
    this.httpClient.post(this.url+'test',{data:this.canvasCollection.filter(x=>x.datasetSelection=='test')}).subscribe((data:any)=>{
    this.testComplete=true;
    this.testlogs=data;
    this.testlogs.data=[];
    this.testlogs.testfilenames.forEach((element,index) => {
      this.testlogs.data.push(this.canvasCollection.find(x=>x.name==element.replace('.png','')).data);
    });
    console.log(this.testlogs)
    let unique = [...new Set(this.testlogs.testlabels)];
    
    for(let i=0;i<unique.length;i++){
      for(let j=0;j<unique.length;j++){
        this.testlogs.cm[i][j]=0;
        for(let k=0;k<this.testlogs.testlabels.length;k++){
          if(this.testlogs.testlabels[k]==unique[i] && this.testlogs.predictedlabels[k]==unique[j]){
            this.testlogs.cm[i][j]++;
          }
        }
      }
    }
    this.uniquelabels=unique.map((x:string)=>x.replace('Test\\',''));
  });
  }
  uniquelabels:any;
  zoomPercentage:number=100;
}

