import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { DataService } from '../services/dataservice/data.service';

@Component({
  selector: 'app-compare',
  templateUrl: './compare.component.html',
  styleUrls: ['./compare.component.css']
})
export class CompareComponent implements OnInit {
  trainColumnCheck: any=[];
    testColumnCheck: any=[];
    trainRowCheck: any=[];
    testRowCheck: any=[];
  zoomPercentage: number=50;
    imgHeight: any;
    imgWidth: any;

  loadImage(e) {
    this.imgHeight = e.path[0].naturalHeight;
    this.imgWidth = e.path[0].naturalWidth;
  }
  constructor(private dataService: DataService, private activatedRoute: ActivatedRoute, private title: Title) { }

  trainlogs: any;
  testlogs: any;
  sectionSelected: any;
  section4 = [];
  section3 = [];
  section2 = [];
  section1 = [];
  section1set: string;
  section2set: string;
  section3set: string;
  section4set: string;
  uniquelabels: any;
  comparetab: number = 0;
  ngOnInit(): void {
    this.dataService.canvasCollection = JSON.parse(sessionStorage.getItem("canvasCollection&e" + this.activatedRoute.snapshot.queryParams['etab']))
    this.trainlogs = JSON.parse(sessionStorage.getItem("trainlogs&e" + this.activatedRoute.snapshot.queryParams['etab'] + "&c" + this.activatedRoute.snapshot.queryParams['ctab']))
    this.testlogs = JSON.parse(sessionStorage.getItem("testlogs&e" + this.activatedRoute.snapshot.queryParams['etab'] + "&c" + this.activatedRoute.snapshot.queryParams['ctab']))
    this.uniquelabels = JSON.parse(sessionStorage.getItem("uniquelabels&e" + this.activatedRoute.snapshot.queryParams['etab'] + "&c" + this.activatedRoute.snapshot.queryParams['ctab']))
    for (let i = 0; i < this.uniquelabels.length; i++) {
      this.trainColumnCheck.push([false, false, false, false])
      this.testColumnCheck.push([false, false, false, false]);
      this.trainRowCheck.push([false, false, false, false])
      this.testRowCheck.push([false, false, false, false]);
    }
    if (this.activatedRoute.snapshot.queryParams['etab'] != null) {
      this.title.setTitle("Compare" + this.activatedRoute.snapshot.queryParams['etab']+"."+ this.activatedRoute.snapshot.queryParams['ctab']);
    }
  }
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
  sectionColor = ["red", "green", "blue"];
  renderSection(sectionSelected, set, index, secondindex, ischecked) {
    if (sectionSelected == 1) {
      this.section1set = set
      if (ischecked) {
        if (set == 'train') {
          this.section1 = this.section1.concat(this.dataService.canvasCollection.filter(x => x.datasetSelection == 'train' && x.label == this.uniquelabels[index]).map(x => { return { 'data': x.data, 'typename': set + index + ':' + secondindex, 'type': set,'label':x.label,'pass':true } }))
          this.trainlogs.cm[index][secondindex].ischecked[sectionSelected] = ischecked
        }
        else {
          let unique = [...new Set(this.testlogs.testlabels)];
          for (let k = 0; k < this.testlogs.testlabels.length; k++) {
            if (this.testlogs.testlabels[k] == unique[index] && this.testlogs.predictedlabels[k] == unique[secondindex]) {
              this.section1.push({ 'data': this.testlogs.data[k], 'typename': set + index + ':' + secondindex, 'type': set, 'label': this.testlogs.label[k], 'pass': index == secondindex });
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
          this.section2 = this.section2.concat(this.dataService.canvasCollection.filter(x => x.datasetSelection == 'train' && x.label == this.uniquelabels[index]).map(x => { return { 'data': x.data, 'typename': set + index + ':' + secondindex, 'type': set, 'label': x.label, 'pass': true } }))
          this.trainlogs.cm[index][secondindex].ischecked[sectionSelected] = ischecked
        }
        else {
          let unique = [...new Set(this.testlogs.testlabels)];

          for (let k = 0; k < this.testlogs.testlabels.length; k++) {
            if (this.testlogs.testlabels[k] == unique[index] && this.testlogs.predictedlabels[k] == unique[secondindex]) {
              this.section2.push({ 'data': this.testlogs.data[k], 'typename': set + index + ':' + secondindex, 'type': set, 'label': this.testlogs.label[k], 'pass': index == secondindex });
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
          this.section3 = this.section3.concat(this.dataService.canvasCollection.filter(x => x.datasetSelection == 'train' && x.label == this.uniquelabels[index]).map(x => { return { 'data': x.data, 'typename': set + index + ':' + secondindex, 'type': set, 'label': x.label, 'pass': true} }))
          this.trainlogs.cm[index][secondindex].ischecked[sectionSelected] = ischecked
        }
        else {
          let unique = [...new Set(this.testlogs.testlabels)];

          for (let k = 0; k < this.testlogs.testlabels.length; k++) {
            if (this.testlogs.testlabels[k] == unique[index] && this.testlogs.predictedlabels[k] == unique[secondindex]) {
              this.section3.push({ 'data': this.testlogs.data[k], 'typename': set + index + ':' + secondindex, 'type': set, 'label': this.testlogs.label[k], 'pass': index == secondindex  });
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
          this.section4 = this.section4.concat(this.dataService.canvasCollection.filter(x => x.datasetSelection == 'train' && x.label == this.uniquelabels[index]).map(x => { return { 'data': x.data, 'typename': set + index + ':' + secondindex, 'type': set, 'label': x.label, 'pass': true} }))
          this.trainlogs.cm[index][secondindex].ischecked[sectionSelected] = ischecked
        }
        else {
          let unique = [...new Set(this.testlogs.testlabels)];

          for (let k = 0; k < this.testlogs.testlabels.length; k++) {
            if (this.testlogs.testlabels[k] == unique[index] && this.testlogs.predictedlabels[k] == unique[secondindex]) {
              this.section4.push({ 'data': this.testlogs.data[k], 'typename': set + index + ':' + secondindex, 'type': set, 'label': this.testlogs.label[k], 'pass': index == secondindex });
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
}
