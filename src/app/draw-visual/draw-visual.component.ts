import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DataService } from '../services/dataservice/data.service';
import * as d3 from 'd3';
import { Title } from '@angular/platform-browser';
import { Session } from 'inspector';

declare const fabric: any;
declare const $;
declare var canvas: any;
declare const onDataFileReadComplete: Function;

@Component({
  selector: 'app-draw-visual',
  templateUrl: './draw-visual.component.html',
  styleUrls: ['./draw-visual.component.css']
})
export class DrawVisualComponent implements OnInit, AfterViewInit {

  keybg: any = [];
  rotation: any;
  midScroll: boolean;

  lengthOperator: any = '*';
  lengthOperand: any = 10;
  widthOperator: any = '*';
  widthOperand: any = 10;
  lratio: any = 2;
  wratio: any = 1;

  side: any;
  sideOperator: any = '*';
  sideOperand: any = 10;

  radiusx: any;
  radiusy: any;
  radiusOperator: string = '*';
  radiusOperand: number = 10;

  radiusxOperator: string = '*';
  radiusxOperand: any = '10';
  radiusyOperator: string = '*';
  radiusyOperand: any = '10';
  rxRatio: any = 2;
  ryRatio: any = 1;

  xposition: number;
  yposition: number;
  xPositionOperator: string = '*';
  xPositionOperand: number = 1;
  yPositionOperator: string = '*';
  yPositionOperand: number = 1;

  bottomcanvasesStringfied: any = [];
  colorTitle: any;


  public selection: boolean;
  validationdata: any;
  mode: string = 'single';
  recordedEvents: any;
  public rowData: any;
  public showrows = true;
  highlight: boolean[] = [];
  keys: string[] = [];
  keyid: string[] = [];
  canvas: any;
  color: string;
  bottomcanvas: any;
  selectedLabel: string;
  rightcanvasarray = [];
  validationcanvasarray = []

  selectedObject: any;
  positionX: number;
  positionY: number;
  visibility: any;
  radius: any;
  rowIndex: number = 0;

  rotationTitle: string = ''
  bottomcanvases: any = [];
  @ViewChild('keytab', { read: ElementRef }) public keytab: ElementRef<any>;

  constructor(private route: ActivatedRoute, private dataService: DataService, private router: Router, private activatedRoute: ActivatedRoute, private title: Title) { }

  ngOnInit(): void {
    if (sessionStorage.getItem('rowdata') != null) {
      this.rowData = this.dataService.rowdata = JSON.parse(sessionStorage.getItem('rowdata'));
      this.selectedLabel = sessionStorage.getItem("selectedlabel");
      Object.keys(this.rowData[0]).forEach((element) => {
        this.keys.push(element);
        this.keyid.push(element);
        this.keybg.push('#460073')
      })
      this.rowData.forEach(a => { this.highlight.push(false) })
      this.rowData.forEach(a => { this.rightcanvasarray.push(true) })
    }
    this.canvas = new fabric.Canvas("maincanvas");
    this.canvas.setDimensions({ width: 850, height: 235 });
    this.canvas.typename = 'canvas'

    this.bottomcanvas = new fabric.Canvas("bottomcanvas");
    this.bottomcanvas.setDimensions({ width: 850, height: 315 });
    this.bottomcanvas.typename = 'bottomcanvas';

    this.drawgraph(this.canvas);

    //this.loaddata(0);
    this.loadUndoRedo();
    this.loadSelector();
    this.validationdata = JSON.parse(sessionStorage["validationdata"]);
    this.validationdata.forEach(a => { this.validationcanvasarray.push(true) })

    if (this.activatedRoute.snapshot.queryParams['experiment'] == 'true') {
      this.experimentVisible = true;
    }
    if (this.activatedRoute.snapshot.queryParams['etab'] != null) {
      this.title.setTitle("Experiment " + this.activatedRoute.snapshot.queryParams['etab']);
    }
  }

  goback() {
    this.router.navigate(["/home"]);
  }
  loadSelector() {
    let isDown, origX, origY, rect;
    this.canvas.on('mouse:down', o => {

      if (this.selection == true) {
        isDown = true;
        var pointer = this.canvas.getPointer(o.e);
        origX = pointer.x;
        origY = pointer.y;
        var pointer = this.canvas.getPointer(o.e);
        rect = new fabric.Rect({
          left: origX,
          top: origY,
          originX: 'left',
          originY: 'top',
          width: 0,
          height: 0,
          angle: 0,
          fill: 'rgba(0,0,0,0)',
          transparentCorners: false,
          selectable: false
        });

        this.canvas.add(rect);
        this.canvas.deactivateAll().renderAll();
        rect.typename = 'selectionrect';
      }
    });

    this.canvas.on('mouse:move', (o) => {
      if (this.selection == true) {
        if (!isDown) return;
        var pointer = this.canvas.getPointer(o.e);

        if (origX > pointer.x) {
          rect.set({ left: Math.abs(pointer.x) });
        }
        if (origY > pointer.y) {
          rect.set({ top: Math.abs(pointer.y) });
        }

        rect.set({ width: Math.abs(origX - pointer.x) });
        rect.set({ height: Math.abs(origY - pointer.y) });
        this.canvas.remove(rect);
        this.canvas.add(rect);

        this.canvas.renderAll();
        this.canvas.sendToBack(rect)
        this.canvas.deactivateAll().renderAll();

        //(document.getElementById('selectionWidth') as any).value = rect.width;
        //(#document.getElementById('selectionHeight') as any).value = rect.height;
      }
    });

    this.canvas.on('mouse:up', (o) => {
      if (this.selection == true) {
        isDown = false;
        this.selection = false;
        rect.selectable = true;
        this.canvas.deactivateAll().renderAll();
      }
    });
  }

  createCoordinate() {
    this.drawgraph(this.canvas, .7, true, 350, 50);
  }

  loadUndoRedo() {
    this.canvas.on('object:added', (event) => {
      this.undo_stack.push(JSON.stringify(this.canvas));
      this.redo_stack = [];
    });
    this.canvas.on('object:modified', (event) => {
      this.undo_stack.push(JSON.stringify(this.canvas));
      this.redo_stack = [];
    });
    this.canvas.on('object:removed', (event) => {
      this.undo_stack.push(JSON.stringify(this.canvas));
      this.redo_stack = [];
    });
  }

  pause_saving = false;

  undo_stack = []
  redo_stack = []

  ngAfterViewInit(): void {
    setTimeout(() => { this.draganddropFunction(); }, 1000)
  }

  undo() {
    //this.redo_stack.push(this.undo_stack.pop());
    //let previous_state = this.undo_stack[this.undo_stack.length - 1];
    //if (previous_state == null) {
    //  previous_state = '{}';
    //  this.drawgraph(this.canvas);
    //}
    //this.canvas.loadFromJSON(previous_state, () => {
    //  this.canvas.renderAll();
    //})
    this.canvas.remove(this.selectedObject)
  }

  clearAll(canvas) {
    if (canvas.typename == 'bottomcanvas') {
      //this.bottomcanvases.push(this.bottomcanvas)
      $('.computed').remove();
      for (let i = 0; i < this.canvas.getObjects().length; i++) {
        this.canvas.getObjects()[i].widthColumn = null;
        this.canvas.getObjects()[i].heightColumn = null;
        this.canvas.getObjects()[i].rotationColumn = null;
        this.canvas.getObjects()[i].xpositionColumn = null;
        this.canvas.getObjects()[i].ypositionColumn = null;
        this.canvas.getObjects()[i].radiusColumn = null;
        this.canvas.getObjects()[i].radiusxColumn = null;
        this.canvas.getObjects()[i].radiusyColumn = null;
        this.visibility = { 'position': false, 'color': false, 'length': false, 'width': false, 'side': false, 'radius': false, 'area': false, 'rotation': false, 'graph': false }
      }
    }
    for (let i = canvas.getObjects().length - 1; i >= 0; i--) {
      if (canvas.getObjects()[i].typename != 'Graph') {
        canvas.remove(canvas.getObjects()[i]);
      }
    }
    canvas.renderAll()
    //canvas.getObjects().forEach((obj) => {
    // canvas.remove(obj);
    //canvas.renderAll();
    //});

  }

  canvasMode: string = 'Single';
  onCanvasMode(val) {
    if (val == 'Collective') {
      this.canvas.getObjects().forEach((obj) => {
        let graph = this.selectedObject.graphname == null ? this.canvas.getObjects().find(x => x.ID == 'Graph 1') : this.canvas.getObjects().find(x => x.ID == obj.graphname);

        if (obj.typename == 'Rectangle') {
          for (let i = 0; i < this.rowData.length; i++) {
            let value = i;
            let rect = new fabric.Rect({
              originX: 'left',
              originY: 'top',
              width: obj.areaColumn != null ? ((Math.sqrt(eval(obj.areaColumn) / (obj.lratio * obj.wratio))) * obj.wratio) : obj.widthColumn != null ? eval(obj.widthColumn) : obj.width,
              height: obj.areaColumn != null ? ((Math.sqrt(eval(obj.areaColumn) / (obj.lratio * obj.wratio))) * obj.lratio) : obj.heightColumn != null ? eval(obj.heightColumn) : obj.height,
              fill: '#460073',
              stroke: '#460073',
              opacity: .4,
              transparentCorners: false,
              typename: 'duplicate',
              angle: obj.rotateColumn != null ? eval(obj.rotateColumn) : obj.angle,
            });
            this.canvas.add(rect);
            rect.set('left', obj.xpositionColumn != null ? (graph.left + eval(obj.xpositionColumn)) : obj.left)
            rect.set('top', obj.ypositionColumn != null ? (graph.top + (graph.height * graph.scaleY) - eval(obj.ypositionColumn) - rect.height) : obj.top);
          }
        }
        else if (obj.typename == 'Square') {
          for (let i = 0; i < this.rowData.length; i++) {
            let value = i;
            let square = new fabric.Rect({
              width: obj.areaColumn != null ? Math.sqrt(eval(obj.areaColumn)) : obj.sideColumn != null ? eval(obj.sideColumn) : obj.width,
              height: obj.areaColumn != null ? Math.sqrt(eval(obj.areaColumn)) : obj.sideColumn != null ? eval(obj.sideColumn) : obj.height,
              fill: '#460073',
              stroke: '#460073',
              opacity: .4,
              transparentCorners: false,
              typename: 'duplicate',
              angle: obj.rotateColumn != null ? eval(obj.rotateColumn) : obj.angle
            });
            this.canvas.add(square);
            square.set('left', obj.xpositionColumn != null ? (graph.left + eval(obj.xpositionColumn)) : obj.left)
            square.set('top', obj.ypositionColumn != null ? (graph.top + (graph.height * graph.scaleY) - eval(obj.ypositionColumn) - square.height) : obj.top)
          }
        }
        else if (obj.typename == 'Circle') {
          for (let i = 0; i < this.rowData.length; i++) {
            let value = i;
            let circle = new fabric.Circle({
              originX: 'left',
              originY: 'top',
              radius: obj.areaColumn != null ? Math.sqrt(eval(obj.areaColumn) / 3.14) : obj.radiusColumn != null ? eval(obj.radiusColumn) : obj.radius,
              angle: 0,
              fill: '#460073',
              stroke: '#460073',
              opacity: .4,
              transparentCorners: false,
              typename: 'duplicate'
            });
            this.canvas.add(circle);
            circle.set('left', obj.xpositionColumn != null ? (graph.left + eval(obj.xpositionColumn)) : obj.left)
            circle.set('top', obj.ypositionColumn != null ? (graph.top + (graph.height * graph.scaleY) - eval(obj.ypositionColumn) - circle.radius) : obj.top)
          }
        }
        else if (obj.typename == 'Line') {
          for (let i = 0; i < this.rowData.length; i++) {
            let value = i;
            let line = new fabric.Rect({
              left: obj.xpositionColumn != null ? eval(obj.xpositionColumn) : obj.left,
              top: obj.ypositionColumn != null ? eval(obj.ypositionColumn) : obj.top,
              height: eval(obj.heightColumn),
              width: 0,
              fill: '#460073',
              stroke: '#460073',
              opacity: .4,
              typename: 'duplicate',
              angle: obj.rotateColumn != null ? eval(obj.rotateColumn) : obj.angle,
            })
            this.canvas.add(line);
            line.set('left', obj.xpositionColumn != null ? (graph.left + eval(obj.xpositionColumn)) : obj.left)
            line.set('top', obj.ypositionColumn != null ? (graph.top + (graph.height * graph.scaleY) - eval(obj.ypositionColumn) - line.height) : obj.top);
          }
        }
        else if (obj.typename == 'Ellipse') {
          for (let i = 0; i < this.rowData.length; i++) {
            let value = i;
            let ellipse = new fabric.Ellipse({
              rx: obj.areaColumn != null ? ((Math.sqrt(eval(obj.areaColumn) / (obj.rxRatio * obj.ryRatio * 3.14))) * obj.rxRatio) : obj.radiusxColumn != null ? eval(obj.radiusxColumn) : obj.rx,
              ry: obj.areaColumn != null ? ((Math.sqrt(eval(obj.areaColumn) / (obj.rxRatio * obj.ryRatio * 3.14))) * obj.ryRatio) : obj.radiusyColumn != null ? eval(obj.radiusyColumn) : obj.ry,
              fill: '#460073',
              stroke: '#460073',
              opacity: .4,
              typename: 'duplicate',
              angle: obj.rotateColumn != null ? eval(obj.rotateColumn) : obj.angle,
            });
            this.canvas.add(ellipse);
            ellipse.set('left', obj.xpositionColumn != null ? (graph.left + eval(obj.xpositionColumn)) : obj.left)
            ellipse.set('top', obj.ypositionColumn != null ? (graph.top + (graph.height * graph.scaleY) - eval(obj.ypositionColumn) - ellipse.ry) : obj.top)
          }
        }
      });
    }
    else {
      let objects = this.canvas.getObjects();
      let length = objects.length;
      for (var i = length - 1; i >= 0; i--) {
        if (objects[i] != null && objects[i].typename == 'duplicate') {
          this.canvas.remove(objects[i]);
        }
      }
      this.canvas.renderAll();
    }

    this.canvas.renderAll();
  }
  rightcanvases: any[] = [];
  loading: boolean;

  apply() {
    let selectionrect = this.canvas.getObjects().find(a => a.typename == 'selectionrect')
    if (selectionrect == null) {
      alert('You have not made the selection. Please select.');
      return;
    }
    this.applyChanges(this.rowData, 'canvas')
    this.applyChanges(this.validationdata, 'valcanvas')
  }

  applyChanges(data, canvas) {
    let selectionrect = this.canvas.getObjects().find(a => a.typename == 'selectionrect')
    this.loading = true
    console.log(selectionrect.left)
    this.rightcanvasarray = null;
    this.validationcanvasarray = null;

    setTimeout(() => {
      this.rightcanvasarray = [];
      this.rowData.forEach(a => { this.rightcanvasarray.push(true) })
      this.validationcanvasarray = [];
      this.validationdata.forEach(a => { this.validationcanvasarray.push(true) })
    }, 100);
    setTimeout(() => {

      for (let i = 0; i < data.length; i++) {
        let rightcanvas = new fabric.Canvas(canvas + i);
        rightcanvas.setDimensions({ width: selectionrect.width * selectionrect.scaleX, height: (selectionrect.height * selectionrect.scaleY) + 10 });

        rightcanvas.renderAll();

        let canvasObjects = this.canvas.getObjects();
        let graph = this.selectedObject.graphname == null ? this.canvas.getObjects().find(x => x.ID == 'Graph 1') : this.canvas.getObjects().find(x => x.ID == canvasObjects.graphname);

        for (let j = 0; j < canvasObjects.length; j++) {
          let obj;
          if (canvasObjects[j].typename == 'Rectangle') {
            let height, width;
            if (canvasObjects[j].areaColumn != null) {
              let value = i
              if (canvas == 'valcanvas') {
                height = (Math.sqrt(eval(canvasObjects[j].areaColumn.replace('rowData', 'validationdata')) / (canvasObjects[j].lratio * canvasObjects[j].wratio))) * canvasObjects[j].lratio;
              } else {
                height = (Math.sqrt(eval(canvasObjects[j].areaColumn) / (canvasObjects[j].lratio * canvasObjects[j].wratio))) * canvasObjects[j].lratio;
              }
            }
            else if (canvasObjects[j].heightColumn != null) {
              let value = i
              if (canvas == 'valcanvas') {
                height = eval(canvasObjects[j].heightColumn.replace('rowData', 'validationdata'))
              } else {
                height = eval(canvasObjects[j].heightColumn)
              }
            }
            else {
              height = canvasObjects[j].height * canvasObjects[j].scaleY
            }

            if (canvasObjects[j].areaColumn != null) {
              let value = i
              if (canvas == 'valcanvas') {
                width = (Math.sqrt(eval(canvasObjects[j].areaColumn.replace('rowData', 'validationdata')) / (canvasObjects[j].lratio * canvasObjects[j].wratio))) * canvasObjects[j].wratio;
              } else {
                width = (Math.sqrt(eval(canvasObjects[j].areaColumn) / (canvasObjects[j].lratio * canvasObjects[j].wratio))) * canvasObjects[j].wratio;
              }
            }
            else if (canvasObjects[j].widthColumn != null) {
              let value = i
              if (canvas == 'valcanvas') {
                width = eval(canvasObjects[j].widthColumn.replace('rowData', 'validationdata'))
              } else {
                width = eval(canvasObjects[j].widthColumn)
              }
            }
            else {
              width = canvasObjects[j].width * canvasObjects[j].scaleX
            }
            obj = new fabric.Rect({
              left: canvasObjects[j].left - selectionrect.left, top: canvasObjects[j].top - selectionrect.top,
              originX: 'left', originY: 'top', width: width, height: height, fill: canvasObjects[j].fill, stroke: canvasObjects[j].stroke, angle: canvasObjects[j].angle
            })
            rightcanvas.add(obj);
          }
          if (canvasObjects[j].typename == 'Square') {
            let height, width;
            if (canvasObjects[j].areaColumn != null) {
              let value = i
              if (canvas == 'valcanvas') {
                height = Math.sqrt(eval(canvasObjects[j].areaColumn.replace('rowData', 'validationdata')));
              } else {
                height = Math.sqrt(eval(canvasObjects[j].areaColumn));
              }
            }
            else if (canvasObjects[j].sideColumn != null) {
              let value = i
              if (canvas == 'valcanvas') {
                height = eval(canvasObjects[j].sideColumn.replace('rowData', 'validationdata'))
              } else {
                height = eval(canvasObjects[j].sideColumn)
              }
            }
            else {
              height = canvasObjects[j].height * canvasObjects[j].scaleY
            }

            obj = new fabric.Rect({
              left: canvasObjects[j].left - selectionrect.left, top: canvasObjects[j].top - selectionrect.top,
              originX: 'left', originY: 'top', width: height, height: height, fill: canvasObjects[j].fill, stroke: canvasObjects[j].stroke, angle: canvasObjects[j].angle
            })
            rightcanvas.add(obj);
          }
          if (canvasObjects[j].typename == 'Line') {
            let height;
            if (canvasObjects[j].heightColumn == null) {
              height = canvasObjects[j].height * canvasObjects[j].scaleY
            }
            else {
              let value = i
              if (canvas == 'valcanvas') {
                height = eval(canvasObjects[j].heightColumn.replace('rowData', 'validationdata'))
              } else {
                height = eval(canvasObjects[j].heightColumn)
              }
            }

            obj = new fabric.Rect({
              left: canvasObjects[j].left - selectionrect.left, top: canvasObjects[j].top - selectionrect.top,
              originX: 'left', originY: 'top', width: 0, height: height, fill: canvasObjects[j].fill, stroke: canvasObjects[j].stroke, angle: canvasObjects[j].angle
            })
            rightcanvas.add(obj);
          }
          else if (canvasObjects[j].typename == 'Circle') {
            let radius;
            if (canvasObjects[j].areaColumn != null) {
              let value = i
              if (canvas == 'valcanvas') {
                radius = Math.sqrt(eval(canvasObjects[j].areaColumn.replace('rowData', 'validationdata')) / 3.14);
              } else {
                radius = Math.sqrt(eval(canvasObjects[j].areaColumn) / 3.14);
              }
            }
            else if (canvasObjects[j].radiusColumn != null) {
              let value = i
              if (canvas == 'valcanvas') {
                radius = eval(canvasObjects[j].radiusColumn.replace('rowData', 'validationdata'))
              } else {
                radius = eval(canvasObjects[j].radiusColumn)
              }
            }
            else {
              radius = canvasObjects[j].radius * canvasObjects[j].scaleX
            }
            obj = new fabric.Circle({
              left: canvasObjects[j].left - selectionrect.left, top: canvasObjects[j].top - selectionrect.top,
              originX: 'left', originY: 'top', radius: radius, fill: canvasObjects[j].fill, stroke: canvasObjects[j].stroke, angle: canvasObjects[j].angle
            })
            rightcanvas.add(obj);
            rightcanvas.renderAll();
          }
          else if (canvasObjects[j].typename == 'Ellipse') {
            let radiusx;
            let radiusy;
            if (canvasObjects[j].areaColumn != null) {
              let value = i
              if (canvas == 'valcanvas') {
                radiusx = (Math.sqrt(eval(canvasObjects[j].areaColumn.replace('rowData', 'validationdata')) / (canvasObjects[j].rxRatio * canvasObjects[j].ryRatio * 3.14))) * canvasObjects[j].rxRatio;
                radiusy = (Math.sqrt(eval(canvasObjects[j].areaColumn.replace('rowData', 'validationdata')) / (canvasObjects[j].rxRatio * canvasObjects[j].ryRatio * 3.14))) * canvasObjects[j].ryRatio;
              } else {
                radiusx = (Math.sqrt(eval(canvasObjects[j].areaColumn) / (3.14 * canvasObjects[j].rxRatio * canvasObjects[j].ryRatio))) * canvasObjects[j].rxRatio;
                radiusy = (Math.sqrt(eval(canvasObjects[j].areaColumn) / (3.14 * canvasObjects[j].rxRatio * canvasObjects[j].ryRatio))) * canvasObjects[j].ryRatio;
              }
            }
            else {
              if (canvasObjects[j].radiusxColumn != null) {
                let value = i
                if (canvas == 'valcanvas') {
                  radiusx = eval(canvasObjects[j].radiusxColumn.replace('rowData', 'validationdata'))
                } else {
                  radiusx = eval(canvasObjects[j].radiusxColumn)
                }
              }
              else {
                radiusx = canvasObjects[j].rx * canvasObjects[j].scaleX
              }
              if (canvasObjects[j].radiusyColumn != null) {
                let value = i
                if (canvas == 'valcanvas') {
                  radiusy = eval(canvasObjects[j].radiusyColumn.replace('rowData', 'validationdata'))
                } else {
                  radiusy = eval(canvasObjects[j].radiusyColumn)
                }
              }
              else {
                radiusy = canvasObjects[j].ry * canvasObjects[j].scaleY
              }
            }
            obj = new fabric.Ellipse({
              left: canvasObjects[j].left - selectionrect.left, top: canvasObjects[j].top - selectionrect.top,
              originX: 'left', originY: 'top', rx: radiusx, ry: radiusy, fill: canvasObjects[j].fill, stroke: canvasObjects[j].stroke, angle: canvasObjects[j].angle
            })
            rightcanvas.add(obj);
            rightcanvas.renderAll();
          }
          if (canvasObjects[j].xpositionColumn != null) {
            let evaluatable = canvasObjects[j].xpositionColumn;
            let value = i
            let xpos;
            if (canvas == 'valcanvas') {
              xpos = eval(canvasObjects[j].xpositionColumn.replace('rowData', 'validationdata'))
            } else {
              xpos = eval(canvasObjects[j].xpositionColumn)
            }
            obj.set('left', xpos - (selectionrect.left - graph.left));
            rightcanvas.renderAll();
          }
          if (canvasObjects[j].ypositionColumn != null) {
            let evaluatable = canvasObjects[j].ypositionColumn;
            let value = i
            let ypos;
            if (canvas == 'valcanvas') {
              ypos = eval(canvasObjects[j].ypositionColumn.replace('rowData', 'validationdata'))
            } else {
              ypos = eval(canvasObjects[j].ypositionColumn)
            }
            if (canvasObjects[j].typename == 'Ellipse')
              obj.set('top', (selectionrect.height * selectionrect.scaleY) - (ypos - (graph.top + (graph.height*graph.scaleY) - (selectionrect.top + (selectionrect.height * selectionrect.scaleY)))) - (obj.ry * 2));
            else if (canvasObjects[j].typename == 'Circle')
              obj.set('top', (selectionrect.height * selectionrect.scaleY) - (ypos - (graph.top + (graph.height*graph.scaleY) - (selectionrect.top + (selectionrect.height * selectionrect.scaleY)))) - (obj.radius * 2));
            else
              obj.set('top', (selectionrect.height * selectionrect.scaleY) - (ypos - (graph.top + (graph.height*graph.scaleY) - (selectionrect.top + (selectionrect.height * selectionrect.scaleY))))- obj.height);

            rightcanvas.renderAll();
          }
          if (canvasObjects[j].rotateColumn != null) {
            let evaluatable = canvasObjects[j].rotateColumn;
            let value = i
            let rotation;
            if (canvas == 'valcanvas') {
              rotation = eval(canvasObjects[j].rotateColumn.replace('rowData', 'validationdata'))
            } else {
              rotation = eval(canvasObjects[j].rotateColumn)
            }
            obj.set('angle', rotation);
            rightcanvas.renderAll();
          }
          if (canvasObjects[j].mappername != null) {
            let outputport = this.bottomcanvas.getObjects().find(x => x.belongsto == canvasObjects[j].mappername && x.typename == 'outputport')
            let leftitems = outputport.leftitems.map(a => parseInt(a.value));
            let rightitems = outputport.rightitems.map(a => a.value);
            let colVal = d3.scaleLinear().domain(leftitems).range(rightitems)
            let evaluatable = outputport.column;
            for (let i = 0; i < this.keys.length; i++) {
              evaluatable = evaluatable.replace(new RegExp(this.keys[i], 'g'), 'parseFloat(this.rowData[i]["' + this.keys[i] + '"])');
            }
            evaluatable = '(' + evaluatable + ')'

            let color = colVal(parseInt(eval(evaluatable)))
            color = '#' + color.match(/\d+/g).map(function (x) {
              x = parseInt(x).toString(16);
              return (x.length == 1) ? "0" + x : x;
            }).join("");
            obj.fill = color;
            obj.stroke = color;
            rightcanvas.renderAll();
          }
        }
        this.rightcanvases.push(rightcanvas)

        //rightcanvas.add(rect);
      }
      this.loading = false
    }, 1000);


  }

  changeColor(value) {
    this.selectedObject.fill = value
    this.selectedObject.stroke = value
    this.color = value
    this.canvas.renderAll();
  }

  lratioChange(val) {
    val = val.target.value;
    if (!val) { val = 1; }
    this.lratio = val;
    let value = this.rowIndex;
    this.length = (Math.sqrt(eval(this.selectedObject.areaColumn) / (this.lratio * this.wratio))) * this.lratio
    this.width = (Math.sqrt(eval(this.selectedObject.areaColumn) / (this.lratio * this.wratio))) * this.wratio
    this.selectedObject.set('height', this.length);
    this.selectedObject.set('width', this.width);
    this.selectedObject.lratio = val;
    this.canvas.renderAll();
  }

  wratioChange(val) {
    val = val.target.value;
    if (!val) { val = 1; }
    this.wratio = val;
    let value = this.rowIndex;
    this.length = (Math.sqrt(eval(this.selectedObject.areaColumn) / (this.lratio * this.wratio))) * this.lratio
    this.width = (Math.sqrt(eval(this.selectedObject.areaColumn) / (this.lratio * this.wratio))) * this.wratio
    this.selectedObject.set('height', this.length);
    this.selectedObject.set('width', this.width);
    this.selectedObject.wratio = val;
    this.canvas.renderAll();
  }

  changeLengthOperand(value) {
    this.selectedObject.set('height', eval(this.length + this.lengthOperator + value));
    if (this.selectedObject.heightColumn != null) {
      this.selectedObject.heightColumn = this.selectedObject.heightColumn.replace(this.lengthOperand, value)
    }
    this.lengthOperand = value;
    this.selectedObject.setCoords();
    this.canvas.renderAll();
    this.selectedObject.areaColumn = null;
    this.selectedObject.mappedarea = '';
    this.area = this.selectedObject.height * this.selectedObject.width;
  }

  changeLengthOperator(value) {
    this.selectedObject.set('height', eval(this.length + value + this.lengthOperand));
    if (this.selectedObject.heightColumn != null) {
      this.selectedObject.heightColumn = this.selectedObject.heightColumn.replace(this.lengthOperator, value)
    }
    this.lengthOperator = value;
    this.selectedObject.setCoords();
    this.canvas.renderAll();
    this.selectedObject.areaColumn = null;
    this.selectedObject.mappedarea = '';
    this.area = this.selectedObject.height * this.selectedObject.width;
  }

  changelength(value) {
    this.selectedObject.set('height', eval(parseFloat(value) + this.lengthOperator + this.lengthOperand));
    this.selectedObject.heightColumn = value + this.lengthOperator + this.lengthOperand;
    this.selectedObject.mappedheight = '';
    this.selectedObject.setCoords();
    this.canvas.renderAll();
    this.length = value;
    this.area = this.selectedObject.height * this.selectedObject.width
    this.selectedObject.areaColumn = null;
    this.selectedObject.mappedarea = '';
  }

  changewidth(value) {
    this.selectedObject.set('width', eval(parseFloat(value) + this.widthOperator + this.widthOperand));
    this.selectedObject.widthColumn = value + this.widthOperator + this.widthOperand;
    this.selectedObject.mappedwidth = '';
    this.selectedObject.setCoords();
    this.canvas.renderAll();
    this.width = value;
    this.area = this.selectedObject.height * this.selectedObject.width
    this.selectedObject.areaColumn = null;
    this.selectedObject.mappedarea = '';
  }

  changeWidthOperand(value) {
    this.selectedObject.set('width', eval(this.width + this.widthOperator + value));
    if (this.selectedObject.widthColumn != null) {
      this.selectedObject.widthColumn = this.selectedObject.widthColumn.replace(this.widthOperand, value)
    }
    this.widthOperand = value;
    this.selectedObject.setCoords();
    this.canvas.renderAll();
    this.selectedObject.areaColumn = null;
    this.selectedObject.mappedarea = '';
    this.area = this.selectedObject.height * this.selectedObject.width;

  }

  changeWidthOperator(value) {
    this.selectedObject.set('width', eval(this.width + value + this.widthOperand));
    if (this.selectedObject.widthColumn != null) {
      this.selectedObject.widthColumn = this.selectedObject.widthColumn.replace(this.widthOperator, value)
    }
    this.widthOperator = value;
    this.selectedObject.setCoords();
    this.canvas.renderAll();
    this.selectedObject.areaColumn = null;
    this.selectedObject.mappedarea = '';
    this.area = this.selectedObject.height * this.selectedObject.width;
  }

  changeSideOperand(value) {
    this.selectedObject.set('width', eval(this.side + this.sideOperator + value));
    this.selectedObject.set('height', eval(this.side + this.sideOperator + value));

    if (this.selectedObject.sideColumn != null) {
      this.selectedObject.sideColumn = this.selectedObject.sideColumn.replace(this.sideOperand, value)
    }
    this.sideOperand = value;
    this.selectedObject.setCoords();
    this.canvas.renderAll();
    this.selectedObject.areaColumn = null;
    this.selectedObject.mappedarea = '';
    this.area = this.selectedObject.height * this.selectedObject.width;
  }

  changeSideOperator(value) {
    this.selectedObject.set('width', eval(this.side + value + this.sideOperand));
    this.selectedObject.set('height', eval(this.side + value + this.sideOperand));
    if (this.selectedObject.sideColumn != null) {
      this.selectedObject.sideColumn = this.selectedObject.sideColumn.replace(this.sideOperator, value)
    }
    this.sideOperator = value;
    this.selectedObject.setCoords();
    this.canvas.renderAll();
    this.selectedObject.areaColumn = null;
    this.selectedObject.mappedarea = '';
    this.area = this.selectedObject.height * this.selectedObject.width;
  }

  changeside(value) {
    this.selectedObject.set('width', eval(parseFloat(value) + this.sideOperator + this.sideOperand))
    this.selectedObject.set('height', eval(parseFloat(value) + this.sideOperator + this.sideOperand))
    this.selectedObject.widthColumn = null;
    this.selectedObject.heightColumn = null;
    this.selectedObject.mappedside = ''
    this.area = this.selectedObject.height * this.selectedObject.width
    this.selectedObject.setCoords();
    this.canvas.renderAll();
    this.selectedObject.areaColumn = null;
    this.selectedObject.mappedarea = '';
    this.side = value;
  }

  changeRadiusOperator(value) {
    this.selectedObject.set('radius', eval(this.radius + value + this.radiusOperand))
    if (this.selectedObject.radiusColumn != null) {
      this.selectedObject.radiusColumn = this.selectedObject.radiusColumn.replace(this.radiusOperator, value)
    }
    this.radiusOperator = value;
    this.selectedObject.setCoords();
    this.canvas.renderAll();
    this.selectedObject.areaColumn = null;
    this.selectedObject.mappedarea = '';
    this.area = 3.14 * this.radius * this.radius;
  }

  changeRadiusOperand(value) {
    this.selectedObject.set('radius', eval(this.radius + this.radiusOperator + value));
    if (this.selectedObject.radiusColumn != null) {
      this.selectedObject.radiusColumn = this.selectedObject.radiusColumn.replace(this.radiusOperand, value)
    }
    this.radiusOperand = value;
    this.area = 3.14 * this.radius * this.radius;
    this.selectedObject.setCoords();
    this.canvas.renderAll();
    this.selectedObject.areaColumn = null;
    this.selectedObject.mappedarea = '';
  }

  changeradius(value) {
    this.selectedObject.set('radius', eval(parseFloat(value) + this.radiusOperator + this.radiusOperand));
    this.selectedObject.radiusColumn = null;
    this.selectedObject.mappedradius = ''
    this.area = 3.14 * this.selectedObject.radius * this.selectedObject.radius
    this.selectedObject.setCoords();
    this.canvas.renderAll();
    this.selectedObject.areaColumn = null;
    this.selectedObject.mappedarea = '';
    this.radius = value;
  }

  changeRadiusxOperator(value) {
    this.selectedObject.set('rx', eval(this.radiusx + value + this.radiusxOperand))
    if (this.selectedObject.radiusxColumn != null) {
      this.selectedObject.radiusxColumn = this.selectedObject.radiusxColumn.replace(this.radiusxOperator, value)
    }
    this.radiusxOperator = value;
    this.area = 3.14 * this.radiusx * this.radiusy;
    this.selectedObject.setCoords();
    this.canvas.renderAll();
    this.selectedObject.areaColumn = null;
    this.selectedObject.mappedarea = '';
  }

  changeRadiusxOperand(value) {
    this.selectedObject.set('rx', eval(this.radiusx + this.radiusxOperator + value));
    if (this.selectedObject.radiusxColumn != null) {
      this.selectedObject.radiusxColumn = this.selectedObject.radiusxColumn.replace(this.radiusxOperand, value)
    }
    this.radiusxOperand = value;
    this.area = 3.14 * this.radiusx * this.radiusy;
    this.selectedObject.setCoords();
    this.canvas.renderAll();
    this.selectedObject.areaColumn = null;
    this.selectedObject.mappedarea = '';
  }

  changeRadiusyOperator(value) {
    this.selectedObject.set('ry', eval(this.radiusy + value + this.radiusyOperand))
    if (this.selectedObject.radiusyColumn != null) {
      this.selectedObject.radiusyColumn = this.selectedObject.radiusyColumn.replace(this.radiusyOperator, value)
    }
    this.radiusyOperator = value;
    this.area = 3.14 * this.radiusx * this.radiusy;
    this.selectedObject.setCoords();
    this.canvas.renderAll();
    this.selectedObject.areaColumn = null;
    this.selectedObject.mappedarea = '';
  }

  changeRadiusyOperand(value) {
    this.selectedObject.set('ry', eval(this.radiusy + this.radiusyOperator + value));
    if (this.selectedObject.radiusyColumn != null) {
      this.selectedObject.radiusyColumn = this.selectedObject.radiusyColumn.replace(this.radiusyOperand, value)
    }
    this.radiusyOperand = value;
    this.area = 3.14 * this.radiusx * this.radiusy;
    this.selectedObject.setCoords();
    this.canvas.renderAll();
    this.selectedObject.areaColumn = null;
    this.selectedObject.mappedarea = '';
  }

  rxRatioChange(val) {
    val = val.target.value;
    if (!val) { val = 1; }
    this.rxRatio = val;
    let value = this.rowIndex;
    this.radiusx = (Math.sqrt(eval(this.selectedObject.areaColumn) / (3.14 * this.rxRatio * this.ryRatio))) * this.rxRatio
    this.radiusy = (Math.sqrt(eval(this.selectedObject.areaColumn) / (3.14 * this.rxRatio * this.ryRatio))) * this.ryRatio
    this.selectedObject.set('rx', this.radiusx);
    this.selectedObject.set('ry', this.radiusy);
    this.selectedObject.rxRatio = val;
    this.canvas.renderAll();
  }

  ryRatioChange(val) {
    val = val.target.value;
    if (!val) { val = 1; }
    this.ryRatio = val;
    let value = this.rowIndex;
    this.radiusx = (Math.sqrt(eval(this.selectedObject.areaColumn) / (3.14 * this.rxRatio * this.ryRatio))) * this.rxRatio
    this.radiusy = (Math.sqrt(eval(this.selectedObject.areaColumn) / (3.14 * this.rxRatio * this.ryRatio))) * this.ryRatio
    this.selectedObject.set('rx', this.radiusx);
    this.selectedObject.set('ry', this.radiusy);
    this.selectedObject.ryRatio = val;
    this.canvas.renderAll();
  }

  changeradiusx(value) {
    this.selectedObject.set('rx', eval(parseFloat(value) + this.radiusxOperator + this.radiusxOperand));
    this.selectedObject.radiusxColumn = null;
    this.selectedObject.mappedradiusx = ''
    this.area = 3.14 * this.selectedObject.rx * this.selectedObject.ry
    this.selectedObject.setCoords();
    this.canvas.renderAll();
    this.selectedObject.areaColumn = null;
    this.selectedObject.mappedarea = '';
    this.radiusx = value;
  }

  changeradiusy(value) {
    this.selectedObject.set('ry', eval(parseFloat(value) + this.radiusyOperator + this.radiusyOperand));
    this.selectedObject.radiusyColumn = null;
    this.selectedObject.mappedradiusy = ''
    this.area = 3.14 * this.selectedObject.rx * this.selectedObject.ry
    this.selectedObject.setCoords();
    this.canvas.renderAll();
    this.selectedObject.areaColumn = null;
    this.selectedObject.mappedarea = '';
  }

  changeRotation(value) {
    this.selectedObject.set('angle', value);
    this.rotation = value;
    this.selectedObject.setCoords();
    this.canvas.renderAll();
  }

  changex(value) {
    this.selectedObject.set('left', eval(parseFloat(value) + this.xPositionOperator + this.xPositionOperand) + this.graph.left);
    this.selectedObject.setCoords();
    this.selectedObject.xpositionColumn = null;
    this.selectedObject.mappedxposition = '';
    this.canvas.renderAll();
    this.xposition = value;
  }

  changexOperator(value) {
    this.selectedObject.set('left', eval(this.xposition + value + this.xPositionOperand) + this.graph.left);
    if (this.selectedObject.xpositionColumn != null) {
      this.selectedObject.xpositionColumn = this.selectedObject.xpositionColumn.replace(this.xPositionOperator, value)
    }
    this.selectedObject.setCoords();
    this.canvas.renderAll();
    this.xPositionOperator = value;
  }

  changexOperand(value) {
    this.selectedObject.set('left', eval(this.xposition + this.xPositionOperator + value) + this.graph.left);
    if (this.selectedObject.xpositionColumn != null) {
      this.selectedObject.xpositionColumn = this.selectedObject.xpositionColumn.replace(this.xPositionOperand, value)
    }
    this.selectedObject.setCoords();
    this.canvas.renderAll();
    this.xPositionOperand = value;
  }

  changey(value) {
    this.selectedObject.set('top', this.graph.top + (this.graph.height * this.graph.scaleY) - eval(parseFloat(value) + this.yPositionOperator + this.yPositionOperand) - this.selectedObject.height);
    this.selectedObject.ypositionColumn = null
    this.selectedObject.setCoords();
    this.selectedObject.mappedyposition = '';
    this.canvas.renderAll();
    this.yposition = value;
  }

  changeyOperator(value) {
    this.selectedObject.set('top', this.graph.top + (this.graph.height * this.graph.scaleY) - eval(this.yposition + value + this.yPositionOperand) - this.selectedObject.height);
    if (this.selectedObject.ypositionColumn != null) {
      this.selectedObject.ypositionColumn = this.selectedObject.ypositionColumn.replace(this.yPositionOperator, value)
    }
    this.selectedObject.setCoords();
    this.canvas.renderAll();
    this.yPositionOperator = value;
  }

  changeyOperand(value) {
    this.selectedObject.set('top', this.graph.top + (this.graph.height * this.graph.scaleY) - eval(this.yposition + this.yPositionOperator + value) - this.selectedObject.height);
    if (this.selectedObject.ypositionColumn != null) {
      this.selectedObject.ypositionColumn = this.selectedObject.ypositionColumn.replace(this.yPositionOperand, value)
    }
    this.selectedObject.setCoords();
    this.canvas.renderAll();
    this.yPositionOperand = value;
  }

  changeRow(value) {
    this.rowIndex = value;
    this.canvas.getObjects().forEach(obj => {
      let graph = this.selectedObject.graphname == null ? this.canvas.getObjects().find(x => x.ID == 'Graph 1') : this.canvas.getObjects().find(x => x.ID == obj.graphname);

      if (obj.heightColumn != null) {
        obj.set('height', eval(obj.heightColumn));
        this.length = eval(obj.heightColumn.split(/\*\d/)[0].split(/\/\d/)[0])
      }
      if (obj.widthColumn != null) {
        obj.set('width', eval(obj.widthColumn));
        this.width = eval(obj.widthColumn.split(/\*\d/)[0].split(/\/\d/)[0])
      }
      if (obj.radiusColumn != null) {
        obj.set('radius', eval(obj.radiusColumn));
        this.radius = eval(obj.radiusColumn.split(/\*\d/)[0].split(/\/\d/)[0])
      }
      if (obj.radiusxColumn != null) {
        obj.set('rx', eval(obj.radiusxColumn));
        this.radiusx = eval(obj.radiusxColumn.split(/\*\d/)[0].split(/\/\d/)[0])
      }
      if (obj.radiusyColumn != null) {
        obj.set('ry', eval(obj.radiusyColumn));
        this.radiusy = eval(obj.radiusyColumn.split(/\*\d/)[0].split(/\/\d/)[0])
      }
      if (obj.rotateColumn != null) {
        obj.set('angle', eval(obj.rotateColumn));
        this.rotation = eval(obj.rotateColumn)
      }
      if (obj.sideColumn != null) {
        obj.set('height', eval(obj.sideColumn))
        obj.set('width', eval(obj.sideColumn))
        this.side = eval(obj.sideColumn.split(/\*\d/)[0].split(/\/\d/)[0])
      }
      if (obj.xpositionColumn != null) {
        obj.set('left', graph.left + eval(obj.xpositionColumn))
        this.xposition = eval(obj.xpositionColumn.split(/\*\d/)[0].split(/\/\d/)[0])
      }
      if (obj.ypositionColumn != null) {
        obj.set('top', graph.top + (graph.height * graph.scaleY) - eval(obj.ypositionColumn) - obj.height)
        this.yposition = eval(obj.ypositionColumn.split(/\*\d/)[0].split(/\/\d/)[0])
      }
      if (obj.areaColumn != null) {
        this.area = eval(this.selectedObject.areaColumn);
        if (obj.typename == 'Rectangle') {
          obj.set('height', (Math.sqrt(eval(this.selectedObject.areaColumn) / (this.selectedObject.lratio * this.selectedObject.wratio))) * this.selectedObject.lratio)
          obj.set('width', (Math.sqrt(eval(this.selectedObject.areaColumn) / (this.selectedObject.lratio * this.selectedObject.wratio))) * this.selectedObject.wratio);
        }
        else if (obj.typename == 'Square') {
          obj.set('height', Math.sqrt(eval(this.selectedObject.areaColumn)));
          obj.set('width', Math.sqrt(eval(this.selectedObject.areaColumn)));
        }
        else if (obj.typename == 'Circle') {
          obj.set('radius', Math.sqrt(eval(this.selectedObject.areaColumn) / 3.14));
        }
        else if (obj.typename == 'Ellipse') {
          obj.set('rx', (Math.sqrt(eval(this.selectedObject.areaColumn) / (this.selectedObject.rxRatio * this.selectedObject.ryRatio))) * this.selectedObject.ryRatio)
          obj.set('ry', (Math.sqrt(eval(this.selectedObject.areaColumn) / (this.selectedObject.rxRatio * this.selectedObject.ryRatio))) * this.selectedObject.ryRatio);
        }
      }

      if (obj['mappername'] != null) {
        let outputport = this.bottomcanvas.getObjects().find(x => x.belongsto == obj['mappername'] && x.typename == 'outputport')

        let leftitems = outputport.leftitems.map(a => parseInt(a.value));
        let rightitems = outputport.rightitems.map(a => a.value);
        let colVal = d3.scaleLinear().domain(leftitems).range(rightitems)
        let evaluatable = outputport.column;
        for (let i = 0; i < this.keys.length; i++) {
          evaluatable = evaluatable.replace(new RegExp(this.keys[i], 'g'), 'parseFloat(this.rowData[value]["' + this.keys[i] + '"])');
        }
        evaluatable = '(' + evaluatable + ')'

        let color = colVal(parseInt(eval(evaluatable)))
        color = '#' + color.match(/\d+/g).map(function (x) {
          x = parseInt(x).toString(16);
          return (x.length == 1) ? "0" + x : x;
        }).join("");
        obj.fill = color;
        obj.stroke = color;
        this.color = color;
      }

      this.canvas.renderAll()
    })
  }

  changeGraph(val) {
    this.graph = this.canvas.getObjects().find(x => x.ID == val);
    this.selectedObject.graphname = val;
    let value = this.rowIndex
    if (this.selectedObject.xpositionColumn != null) {
      this.xposition = eval(this.selectedObject.xpositionColumn) ;
      this.selectedObject.set('left', eval(this.selectedObject.xpositionColumn) + this.graph.left);
    }
    else {
      this.xposition = this.selectedObject.left - this.graph.left;
    }
    if (this.selectedObject.ypositionColumn != null) {
        this.yposition = eval(this.selectedObject.ypositionColumn)
        this.selectedObject.set('top', this.graph.top + (this.graph.height * this.graph.scaleY) - eval(this.selectedObject.ypositionColumn) - (this.selectedObject.height * this.selectedObject.scaleY))
      }
      else {
        this.yposition = this.graph.top + (this.graph.height * this.graph.scaleY) - this.selectedObject.top - (this.selectedObject.height * this.selectedObject.scaleY);
    }
    this.selectedObject.setCoords();
    this.canvas.renderAll()
  }

  public scrollLeft(): void {
    this.keytab.nativeElement.scrollTo({ left: (this.keytab.nativeElement.scrollLeft - 20), behavior: 'smooth' });
  }

  public scrollRight(): void {
    this.keytab.nativeElement.scrollTo({ left: (this.keytab.nativeElement.scrollLeft + 20), behavior: 'smooth' });
  }

  draganddropFunction() {

    for (let i = 0; i < this.keys.length; i++) {
      $("#id" + this.keys[i]).draggable({
        cursorAt: { top: 18.5, left: 60 },
        cursor: 'none',
        scroll: false,
        helper: (event) => {
          return $("<div style='z-index: 100; margin-top: -1px; margin-left: 38px;'>" + this.keys[i] + "</div>");
        }
      });
    }
    let keys = '';
    for (let i = 0; i < this.keys.length; i++) {
      keys += this.keys.length - 1 > i ? "#id" + this.keys[i] + "," : "#id" + this.keys[i];
    }

    this.canvas.on({
      'object:selected': (e) => {
        this.selectedObject = e.target;

        this.graph = this.selectedObject.graphname == null ? this.canvas.getObjects().find(x => x.ID == 'Graph 1') : this.canvas.getObjects().find(x => x.ID == this.selectedObject.graphname);
        this.rotation = (e.target.angle);
        this.selectedObject.graphname = this.graph.ID;

        if (this.selectedObject.fill.indexOf('#') > -1) {
          this.color = this.selectedObject.fill
        }
        else {
          this.color = '#' + this.selectedObject.fill.match(/\d+/g).map(function (x) {
            x = parseInt(x).toString(16);
            return (x.length == 1) ? "0" + x : x;
          }).join("");
        }

        this.colorTitle = this.selectedObject.colorColumn != null ? this.selectedObject.colorColumn : '';
        if (this.selectedObject.mappedrotate == null) {
          this.selectedObject.mappedrotate = '';
        }

        let value = this.rowIndex;

        if (this.selectedObject.xpositionColumn != null) {
          if (this.selectedObject.xpositionColumn.indexOf('*') > -1) {
            this.xposition = eval(this.selectedObject.xpositionColumn.split(/\*\d/)[0])
            this.xPositionOperator = '*';
            this.xPositionOperand = this.selectedObject.xpositionColumn.split('*')[1]
          }
          else {
            this.xposition = eval(this.selectedObject.xpositionColumn.split(/\/\d/)[0])
            this.xPositionOperator = '/';
            this.xPositionOperand = this.selectedObject.xpositionColumn.split('/')[1]
          }
        }
        else {
          this.xposition = this.selectedObject.left - this.graph.left
          this.selectedObject.mappedxposition = ''
        }
        if (this.selectedObject.ypositionColumn != null) {
          if (this.selectedObject.ypositionColumn.indexOf('*') > -1) {
            this.yposition = eval(this.selectedObject.ypositionColumn.split(/\*\d/)[0])
            this.yPositionOperator = '*';
            this.yPositionOperand = this.selectedObject.ypositionColumn.split('*')[1]
          }
          else {
            this.yposition = eval(this.selectedObject.ypositionColumn.split(/\/\d/)[0])
            this.yPositionOperator = '/';
            this.yPositionOperand = this.selectedObject.ypositionColumn.split('/')[1]
          }
        }
        else {
          this.yposition = this.graph.top + (this.graph.height * this.graph.scaleY) - this.selectedObject.top - this.selectedObject.height;
          this.selectedObject.mappedyposition = ''
        }

        if (this.selectedObject.typename == 'Rectangle' || this.selectedObject.typename == 'Line') {
          if (this.selectedObject.areaColumn != null) {
            this.length = (Math.sqrt(eval(this.selectedObject.areaColumn) / (this.selectedObject.lratio * this.selectedObject.wratio))) * this.selectedObject.lratio
            this.width = (Math.sqrt(eval(this.selectedObject.areaColumn) / (this.selectedObject.lratio * this.selectedObject.wratio))) * this.selectedObject.wratio
            this.area = eval(this.selectedObject.areaColumn)
            this.lengthOperator = '*';
            this.lengthOperand = '1';
            this.widthOperator = '*';
            this.widthOperand = '1';
          }
          else {
            if (this.selectedObject.heightColumn != null) {
              if (this.selectedObject.heightColumn.indexOf('*') > -1) {
                this.length = eval(this.selectedObject.heightColumn.split(/\*\d/)[0])
                this.lengthOperator = '*';
                this.lengthOperand = this.selectedObject.heightColumn.split('*')[1]
              }
              else {
                this.length = eval(this.selectedObject.heightColumn.split(/\/\d/)[0])
                this.lengthOperator = '/';
                this.lengthOperand = this.selectedObject.heightColumn.split('/')[1]
              }
            }
            else {
              this.lengthOperand = 10;
              this.lengthOperator = '*';
              if (this.lengthOperator == '*') {
                this.length = this.selectedObject.height / this.lengthOperand;
              }
              else if (this.lengthOperator == '/') {
                this.length = this.selectedObject.height * this.lengthOperand;
              }
              this.selectedObject.heightColumn = this.length + this.lengthOperator + this.lengthOperand;
              this.selectedObject.mappedheight = ''
              this.selectedObject.mappedarea = ''
            }
            if (this.selectedObject.widthColumn != null) {
              if (this.selectedObject.widthColumn.indexOf('*') > -1) {
                this.width = eval(this.selectedObject.widthColumn.split(/\*\d/)[0])
                this.widthOperator = '*';
                this.widthOperand = this.selectedObject.widthColumn.split('*')[1]
              }
              else {
                this.width = eval(this.selectedObject.widthColumn.split(/\/\d/)[0])
                this.widthOperator = '/';
                this.widthOperand = this.selectedObject.widthColumn.split('/')[1]
              }
            }
            else {
              this.widthOperand = 10;
              this.widthOperator = '*';
              if (this.widthOperator == '*') {
                this.width = this.selectedObject.width / this.widthOperand;
              }
              else if (this.widthOperator == '/') {
                this.width = this.selectedObject.width * this.widthOperand;
              }
              this.selectedObject.widthColumn = this.width + this.widthOperator + this.widthOperand;
              this.selectedObject.mappedwidth = ''
              this.selectedObject.mappedarea = ''
            }
            this.area = this.width * this.length;
          }

          this.visibility = { 'position': true, 'color': true, 'length': true, 'width': true, 'side': false, 'radius': false, 'area': true, 'rotation': true, 'graph': true }
        }
        else if (this.selectedObject.typename == 'Line') {

          this.visibility = { 'position': true, 'color': true, 'length': true, 'width': false, 'side': false, 'radius': false, 'area': false, 'rotation': true, 'graph': true }
        }
        else if (this.selectedObject.typename == 'Graph') {
          this.xposition = this.selectedObject.left;
          this.yposition = this.selectedObject.top;
          this.visibility = { 'position': true, 'color': false, 'length': false, 'width': false, 'side': false, 'radius': false, 'area': false, 'rotation': false }
        }
        else if (this.selectedObject.typename == 'Square') {

          let value = this.rowIndex;
          if (this.selectedObject.areaColumn != null) {
            this.side = (Math.sqrt(eval(this.selectedObject.areaColumn)))
            this.selectedObject.mappedside = ''
            this.area = this.side * this.side
            this.sideOperator = '*';
            this.sideOperand = '1';
          }
          else if (this.selectedObject.sideColumn != null) {
            if (this.selectedObject.sideColumn.indexOf('*') > -1) {
              this.side = eval(this.selectedObject.sideColumn.split(/\*\d/)[0])
              this.sideOperator = '*';
              this.sideOperand = this.selectedObject.sideColumn.split('*')[1]
            }
            else {
              this.side = eval(this.selectedObject.sideColumn.split(/\/\d/)[0])
              this.sideOperator = '/';
              this.sideOperand = this.selectedObject.sideColumn.split('/')[1]
            }
          }
          else {
            this.sideOperand = 10;
            this.sideOperator = '*';
            if (this.sideOperator == '*') {
              this.side = this.selectedObject.width / this.sideOperand;
            }
            else if (this.sideOperator == '/') {
              this.side = this.selectedObject.width * this.sideOperand;
            }
            this.selectedObject.sideColumn = this.side + this.sideOperator + this.sideOperand;
            this.selectedObject.mappedside = ''
            this.selectedObject.mappedarea = ''
          }
          this.area = this.side * this.side;
          this.visibility = { 'position': true, 'color': true, 'length': false, 'width': false, 'side': true, 'radius': false, 'area': true, 'rotation': true, 'graph': true }
        }
        else if (this.selectedObject.typename == 'Circle') {

          let value = this.rowIndex;
          if (this.selectedObject.areaColumn != null) {
            this.radius = Math.sqrt(eval(this.selectedObject.areaColumn) / 3.14)
            this.area = eval(this.selectedObject.areaColumn)
            this.radiusOperator = '*';
            this.radiusOperand = 1;
          }
          else {
            if (this.selectedObject.radiusColumn != null) {
              if (this.selectedObject.radiusColumn.indexOf('*') > -1) {
                this.radius = eval(this.selectedObject.radiusColumn.split(/\*\d/)[0])
                this.radiusOperator = '*';
                this.radiusOperand = this.selectedObject.radiusColumn.split('*')[1]
              }
              else {
                this.radius = eval(this.selectedObject.radiusColumn.split(/\/\d/)[0])
                this.radiusOperator = '/';
                this.radiusOperand = this.selectedObject.radiusColumn.split('/')[1]
              }
            }
            else {
              this.radiusOperand = 10;
              this.radiusOperator = '*';
              if (this.radiusOperator == '*') {
                this.radius = this.selectedObject.radius / this.radiusOperand;
              }
              else if (this.radiusOperator == '/') {
                this.radius = this.selectedObject.radius * this.radiusOperand;
              }
              this.selectedObject.radiusColumn = this.radius + this.radiusOperator + this.radiusOperand;
              this.selectedObject.mappedradius = ''
              this.selectedObject.mappedarea = ''
            }
            this.area = this.width * this.length;
            this.area = 3.14 * this.radius * this.radius;
          }

          this.visibility = { 'position': true, 'color': true, 'length': false, 'width': false, 'side': false, 'radius': true, 'area': true, 'rotation': false, 'graph': true }
        }
        else if (this.selectedObject.typename == 'Ellipse') {
          if (this.selectedObject.areaColumn != null) {
            this.radiusx = (Math.sqrt(eval(this.selectedObject.areaColumn) / (3.14 * this.selectedObject.rxRatio * this.selectedObject.ryRatio))) * this.selectedObject.rxRatio;
            this.radiusy = (Math.sqrt(eval(this.selectedObject.areaColumn) / (3.14 * this.selectedObject.rxRatio * this.selectedObject.ryRatio))) * this.selectedObject.ryRatio;
            this.area = eval(this.selectedObject.areaColumn)
            this.radiusxOperator = '*';
            this.radiusxOperand = '1';
            this.radiusyOperator = '*';
            this.radiusyOperand = '1';
          }
          else {
            if (this.selectedObject.radiusxColumn != null) {
              if (this.selectedObject.radiusxColumn.indexOf('*') > -1) {
                this.radiusx = eval(this.selectedObject.radiusxColumn.split(/\*\d/)[0])
                this.radiusxOperator = '*';
                this.radiusxOperand = this.selectedObject.radiusxColumn.split('*')[1]
              }
              else {
                this.radiusx = eval(this.selectedObject.radiusxColumn.split(/\/\d/)[0])
                this.radiusxOperator = '/';
                this.radiusxOperand = this.selectedObject.radiusxColumn.split('/')[1]
              }
            }
            else {
              this.radiusxOperand = 10;
              this.radiusxOperator = '*';
              if (this.radiusxOperator == '*') {
                this.radiusx = this.selectedObject.rx / this.radiusxOperand;
              }
              else if (this.radiusxOperator == '/') {
                this.radiusx = this.selectedObject.rx * this.radiusxOperand;
              }
              this.selectedObject.radiusxColumn = this.radiusx + this.radiusxOperator + this.radiusxOperand;
              this.selectedObject.mappedradiusx = ''
              this.selectedObject.mappedarea = ''
            }
            if (this.selectedObject.radiusyColumn != null) {
              if (this.selectedObject.radiusyColumn.indexOf('*') > -1) {
                this.radiusy = eval(this.selectedObject.radiusyColumn.split(/\*\d/)[0])
                this.radiusyOperator = '*';
                this.radiusyOperand = this.selectedObject.radiusyColumn.split('*')[1]
              }
              else {
                this.radiusy = eval(this.selectedObject.radiusyColumn.split(/\/\d/)[0])
                this.radiusyOperator = '/';
                this.radiusyOperand = this.selectedObject.radiusyColumn.split('/')[1]
              }
            }
            else {
              this.radiusyOperand = 10;
              this.radiusyOperator = '*';
              if (this.radiusyOperator == '*') {
                this.radiusy = this.selectedObject.ry / this.radiusyOperand;
              }
              else if (this.radiusyOperator == '/') {
                this.radiusy = this.selectedObject.ry * this.radiusyOperand;
              }
              this.selectedObject.radiusyColumn = this.radiusy + this.radiusyOperator + this.radiusyOperand;
              this.selectedObject.mappedradiusy = ''
              this.selectedObject.mappedarea = ''
            }
            this.area = 3.14 * this.radiusx * this.radiusy;
          }

          this.visibility = { 'position': true, 'color': true, 'length': false, 'width': false, 'side': false, 'radiusx': true, 'radiusy': true, 'area': true, 'rotation': true, 'graph': true }
        }
        else if (this.selectedObject.typename == 'selectionrect') {
          this.visibility = { 'position': false, 'color': false, 'length': false, 'width': false, 'side': false, 'radius': false, 'area': false, 'rotation': false, 'graph': false }
        }
        //setTimeout(() => { this.draganddropFunction(); }, 1000)

      },
      'object:rotating': (e) => {
        this.rotation = (e.target.angle);
      }

    });

    let val = 0
    let source;
    let isoperatorselected;
    let ismidmapperselected;
    let ismidoperatorselected;
    this.bottomcanvas.on("mouse:down", (event) => {
      let pointer = this.bottomcanvas.getPointer(event.e);
      this.positionX = pointer.x;
      this.positionY = pointer.y;

      if (event.target != null && event.target.typename == 'outputport') {
        isoperatorselected = true;
        ismidmapperselected = false;
        ismidoperatorselected = false;
        source = event.target
      }
      else {
        isoperatorselected = false;
        ismidmapperselected = false;
        ismidoperatorselected = false;
        source = event.target
      }
    });

    $("#mapperPopup").focusout(function () {
      $('#mapperPopup').css('display', 'none')
    })

    document.addEventListener("mousedown", (evnt: any) => {
      if ($(evnt.srcElement).siblings() != null && $(evnt.srcElement).siblings()[0] != null && $(evnt.srcElement).siblings()[0].value != null && $(evnt.srcElement).siblings()[0].value.indexOf('mapper') > -1) {
        ismidmapperselected = true;
        isoperatorselected = false;
        ismidoperatorselected = false;
        source = evnt;
      }
      else if ($(evnt.srcElement).siblings() != null && $(evnt.srcElement).siblings()[0] != null && $(evnt.srcElement).siblings()[0].value != null && $(evnt.srcElement).siblings()[0].value.indexOf('operator') > -1) {
        ismidmapperselected = false;
        isoperatorselected = false;
        ismidoperatorselected = true;
        source = evnt;
      }
      else if (evnt.srcElement.className.indexOf('keys') > -1) {
        source = evnt.srcElement;
      }
    })

    document.addEventListener("mouseup", evnt => {
      let target: any = evnt.target;

      if (target?.previousSibling?.id == 'maincanvas') {
        let obj = this.canvas.getActiveObject();
        if (obj == null) {
          this.visibility = { 'position': false, 'color': false, 'length': false, 'width': false, 'side': false, 'radius': false, 'area': false, 'rotation': false }
        }
      }

      if (isoperatorselected && target.id == 'keytab') {
        let key = "idkey" + ($('#keytab')[0].children.length)
        let textkey = "idtextkey" + ($('#keytab')[0].children.length)
        let keyelement = $("<span class='computed' id='" + key + "' ><label id='" + textkey + "' style='width:100px;display:inline-block;font-size: 14px;cursor:default;user-select:none;padding: 5px 10px;margin: 2px;display: inline - flex;color: #fff;background-color:#460073;font-weight:500' >" + source.belongsto + "</label><input type='hidden' value='" + source.belongsto + "'/><input type='hidden' value='" + (this.bottomcanvases.length) + "'/></span>");
        $('#keytab').append(keyelement);

        if (source.belongsto.indexOf('operator') > -1) {

          let line = new fabric.Line([source.left, source.top + source.radius, source.left + 50, source.top + source.radius], { stroke: 'black', selectable: false, groupto: source.belongsto });
          let rect = new fabric.Rect({
            left: line.left + line.width,
            top: line.top - 15,
            originX: 'left',
            originY: 'top',
            width: 90,
            height: 30,
            fill: '#460073',
            transparentCorners: false, selectable: false,
            belongsto: source.belongsto,
            groupto: source.belongsto
          })
          let text = new fabric.IText(source.belongsto, {
            left: rect.left + 23,
            top: line.top - 7,
            originX: 'left',
            originY: 'top',
            fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
            fill: 'white',
            fontSize: 13,
            selectable: false,
            typename: 'text',
            belongsto: source.belongsto,
            groupto: source.belongsto
          })
          this.bottomcanvas.add(line)
          this.bottomcanvas.add(rect)
          this.bottomcanvas.add(text)

          this.bottomcanvases.push(this.bottomcanvas)
        }
        if (source.belongsto.indexOf('mapper') > -1) {
          let outputport = this.bottomcanvas.getObjects().find(x => x.belongsto == source.belongsto && x.typename == 'outputport')
          let a = new fabric.Rect({
            left: outputport.left + 60,
            top: outputport.top,
            originX: 'left',
            originY: 'top',
            width: 100,
            height: 30,
            fill: '#460073',
            transparentCorners: false,
            selectable: false,
            groupto: source.belongsto
          })
          let b = new fabric.IText(source.belongsto, {
            left: outputport.left + 75,
            top: outputport.top + 5,
            originX: 'left',
            originY: 'top',
            fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
            fill: 'white',
            fontSize: 13,
            selectable: false,
            groupto: source.belongsto
          })

          let line = new fabric.Line([outputport.left + 20, outputport.top + 5, a.left, a.top + 5], { stroke: 'black', selectable: false, groupto: source.belongsto });
          this.bottomcanvas.add(line);
          this.bottomcanvas.add(a)
          this.bottomcanvas.add(b)

        }

        setTimeout(() => {
          if (document.getElementById('keytab').scrollWidth > 920) {
            this.midScroll = true
          }
        }, 500);
      }
      else if (ismidmapperselected && this.selectedObject != null && target.id == 'colorPanel') {
        this.selectedObject.mappername = $(source.srcElement).siblings()[0].value;

        let outputport = this.bottomcanvas.getObjects().find(a => a.typename == 'outputport' && a.belongsto == $(source.srcElement).siblings()[0].value)

        let leftitems = outputport.leftitems.map(a => parseInt(a.value));
        let rightitems = outputport.rightitems.map(a => a.value);
        let colVal = d3.scaleLinear().domain(leftitems).range(rightitems)
        let evaluatable = outputport.column;
        for (let i = 0; i < this.keys.length; i++) {
          evaluatable = evaluatable.replace(new RegExp(this.keys[i], 'g'), 'parseFloat(this.rowData[i]["' + this.keys[i] + '"])');
        }
        evaluatable = '(' + evaluatable + ')'
        let i = this.rowIndex;
        let color = colVal(parseInt(eval(evaluatable)))
        color = '#' + color.match(/\d+/g).map(function (x) {
          x = parseInt(x).toString(16);
          return (x.length == 1) ? "0" + x : x;
        }).join("");
        this.selectedObject.fill = color
        this.selectedObject.stroke = color
        this.selectedObject.colorColumn = outputport.column
        this.colorTitle = outputport.column
        this.color = color;
        this.canvas.renderAll()
      }
      else if (ismidoperatorselected && this.selectedObject != null) {
        let evaluatable = this.bottomcanvas.getObjects().find(x => x.typename == 'outputport' && x.belongsto == $(source.srcElement).siblings()[0].value).fieldName.replace("\n", "");
        if (target.id == 'length') {
          let value = this.rowIndex;
          this.selectedObject.mappedheight = evaluatable
          for (let i = 0; i < this.keys.length; i++) {
            evaluatable = evaluatable.replace(new RegExp(this.keys[i], 'g'), 'parseFloat(this.rowData[value]["' + this.keys[i] + '"])');
          }
          evaluatable = '(' + evaluatable + ')'

          this.length = eval(evaluatable)
          target.value = this.length
          this.selectedObject.heightColumn = evaluatable + this.lengthOperator + this.lengthOperand;
          this.selectedObject.set('height', eval(evaluatable + this.lengthOperator + this.lengthOperand))
          this.selectedObject.setCoords();
          this.canvas.renderAll()
        }
        else if (target.id == 'width') {
          let evaluatable = this.bottomcanvas.getObjects().find(x => x.typename == 'outputport' && x.belongsto == $(source.srcElement).siblings()[0].value).fieldName.replace("\n", "");
          this.selectedObject.mappedwidth = evaluatable
          let value = this.rowIndex;

          for (let i = 0; i < this.keys.length; i++) {
            evaluatable = evaluatable.replace(new RegExp(this.keys[i], 'g'), 'parseFloat(this.rowData[value]["' + this.keys[i] + '"])');
          }
          evaluatable = '(' + evaluatable + ')'
          this.width = eval(evaluatable)
          target.value = this.width
          this.selectedObject.widthColumn = evaluatable + this.widthOperator + this.widthOperand
          this.selectedObject.set('width', eval(evaluatable + this.widthOperator + this.widthOperand))
          this.selectedObject.setCoords();
          this.canvas.renderAll()
        }
        else if (target.id == 'side') {
          let evaluatable = this.bottomcanvas.getObjects().find(x => x.typename == 'outputport' && x.belongsto == $(source.srcElement).siblings()[0].value).fieldName.replace("\n", "");
          this.selectedObject.mappedside = evaluatable
          let value = this.rowIndex;

          for (let i = 0; i < this.keys.length; i++) {
            evaluatable = evaluatable.replace(new RegExp(this.keys[i], 'g'), 'parseFloat(this.rowData[value]["' + this.keys[i] + '"])');
          }
          evaluatable = '(' + evaluatable + ')'
          this.side = eval(evaluatable)
          target.value = this.side
          this.selectedObject.sideColumn = evaluatable + this.widthOperator + this.widthOperand
          this.selectedObject.set('width', eval(evaluatable + this.widthOperator + this.widthOperand))
          this.selectedObject.set('height', eval(evaluatable + this.widthOperator + this.widthOperand))
          this.selectedObject.setCoords();
          this.canvas.renderAll()
        }
        else if (target.id == 'radius') {
          let evaluatable = this.bottomcanvas.getObjects().find(x => x.typename == 'outputport' && x.belongsto == $(source.srcElement).siblings()[0].value).fieldName.replace("\n", "");
          this.selectedObject.mappedradius = evaluatable
          let value = this.rowIndex;

          for (let i = 0; i < this.keys.length; i++) {
            evaluatable = evaluatable.replace(new RegExp(this.keys[i], 'g'), 'parseFloat(this.rowData[value]["' + this.keys[i] + '"])');
          }
          evaluatable = '(' + evaluatable + ')'
          this.radius = eval(evaluatable)
          target.value = this.radius
          this.selectedObject.radiusColumn = evaluatable + this.radiusOperator + this.radiusOperand
          this.selectedObject.set('radius', eval(evaluatable + this.radiusOperator + this.radiusOperand))
          this.selectedObject.setCoords();
          this.canvas.renderAll()
        }
        else if (target.id == 'radiusx') {
          let evaluatable = this.bottomcanvas.getObjects().find(x => x.typename == 'outputport' && x.belongsto == $(source.srcElement).siblings()[0].value).fieldName.replace("\n", "");
          this.selectedObject.mappedradiusx = evaluatable
          let value = this.rowIndex;

          for (let i = 0; i < this.keys.length; i++) {
            evaluatable = evaluatable.replace(new RegExp(this.keys[i], 'g'), 'parseFloat(this.rowData[value]["' + this.keys[i] + '"])');
          }
          evaluatable = '(' + evaluatable + ')'
          this.radiusx = eval(evaluatable)
          target.value = this.radiusx
          this.selectedObject.radiusxColumn = evaluatable + this.radiusxOperator + this.radiusxOperand
          this.selectedObject.set('rx', eval(evaluatable + this.radiusxOperator + this.radiusxOperand))
          this.selectedObject.setCoords();
          this.canvas.renderAll()
        }
        else if (target.id == 'radiusy') {
          let evaluatable = this.bottomcanvas.getObjects().find(x => x.typename == 'outputport' && x.belongsto == $(source.srcElement).siblings()[0].value).fieldName.replace("\n", "");
          this.selectedObject.mappedradiusy = evaluatable
          let value = this.rowIndex;

          for (let i = 0; i < this.keys.length; i++) {
            evaluatable = evaluatable.replace(new RegExp(this.keys[i], 'g'), 'parseFloat(this.rowData[value]["' + this.keys[i] + '"])');
          }
          evaluatable = '(' + evaluatable + ')'
          this.radiusy = eval(evaluatable)
          target.value = this.radiusy
          this.selectedObject.radiusyColumn = evaluatable + this.radiusyOperator + this.radiusyOperand
          this.selectedObject.set('ry', eval(evaluatable + this.radiusyOperator + this.radiusyOperand))
          this.selectedObject.setCoords();
          this.canvas.renderAll()
        }
        else if (target.id == 'area') {
          if (this.selectedObject.typename == 'Rectangle') {
            let evaluatable = this.bottomcanvas.getObjects().find(x => x.typename == 'outputport' && x.belongsto == $(source.srcElement).siblings()[0].value).fieldName.replace("\n", "");
            this.selectedObject.mappedarea = evaluatable
            let value = this.rowIndex;

            for (let i = 0; i < this.keys.length; i++) {
              evaluatable = evaluatable.replace(new RegExp(this.keys[i], 'g'), 'parseFloat(this.rowData[value]["' + this.keys[i] + '"])');
            }
            this.selectedObject.areaColumn = evaluatable;
            evaluatable = '(' + evaluatable + ')'
            this.area = eval(evaluatable)
            this.lratio = this.selectedObject.lratio = 2;
            this.wratio = this.selectedObject.wratio = 1;
            this.length = (Math.sqrt(eval(this.selectedObject.areaColumn) / (this.selectedObject.lratio * this.selectedObject.wratio))) * this.selectedObject.lratio
            this.lengthOperator = '*'
            this.lengthOperand = 1;
            this.width = (Math.sqrt(eval(this.selectedObject.areaColumn) / (this.selectedObject.lratio * this.selectedObject.wratio))) * this.selectedObject.wratio
            this.widthOperator = '*'
            this.widthOperand = 1;

            this.selectedObject.set('height', this.length)
            this.selectedObject.set('width', this.width)
            this.selectedObject.setCoords();
            this.canvas.renderAll()
          }
          else if (this.selectedObject.typename == 'Square') {
            let evaluatable = this.bottomcanvas.getObjects().find(x => x.typename == 'outputport' && x.belongsto == $(source.srcElement).siblings()[0].value).fieldName.replace("\n", "");
            this.selectedObject.mappedarea = evaluatable
            let value = this.rowIndex;

            for (let i = 0; i < this.keys.length; i++) {
              evaluatable = evaluatable.replace(new RegExp(this.keys[i], 'g'), 'parseFloat(this.rowData[value]["' + this.keys[i] + '"])');
            }
            this.selectedObject.areaColumn = evaluatable;
            evaluatable = '(' + evaluatable + ')'
            this.area = eval(evaluatable)
            this.side = Math.sqrt(eval(this.selectedObject.areaColumn))
            this.sideOperator = '*'
            this.sideOperand = 1;

            this.selectedObject.set('height', this.side)
            this.selectedObject.set('width', this.side)
            this.selectedObject.setCoords();
            this.canvas.renderAll()
          }
          else if (this.selectedObject.typename == 'Circle') {
            let evaluatable = this.bottomcanvas.getObjects().find(x => x.typename == 'outputport' && x.belongsto == $(source.srcElement).siblings()[0].value).fieldName.replace("\n", "");
            this.selectedObject.mappedarea = evaluatable
            let value = this.rowIndex;

            for (let i = 0; i < this.keys.length; i++) {
              evaluatable = evaluatable.replace(new RegExp(this.keys[i], 'g'), 'parseFloat(this.rowData[value]["' + this.keys[i] + '"])');
            }
            this.selectedObject.areaColumn = evaluatable;
            evaluatable = '(' + evaluatable + ')'
            this.area = eval(evaluatable)
            this.radius = Math.sqrt(eval(this.selectedObject.areaColumn) / 3.14)
            this.radiusOperator = '*'
            this.radiusOperand = 1;

            this.selectedObject.set('radius', this.radius)
            this.selectedObject.setCoords();
            this.canvas.renderAll()
          }
          else if (this.selectedObject.typename == 'Ellipse') {
            let evaluatable = this.bottomcanvas.getObjects().find(x => x.typename == 'outputport' && x.belongsto == $(source.srcElement).siblings()[0].value).fieldName.replace("\n", "");
            this.selectedObject.mappedarea = evaluatable
            let value = this.rowIndex;

            for (let i = 0; i < this.keys.length; i++) {
              evaluatable = evaluatable.replace(new RegExp(this.keys[i], 'g'), 'parseFloat(this.rowData[value]["' + this.keys[i] + '"])');
            }
            this.selectedObject.areaColumn = evaluatable;
            evaluatable = '(' + evaluatable + ')'
            this.area = eval(evaluatable)
            this.rxRatio = this.selectedObject.rxRatio = 2;
            this.ryRatio = this.selectedObject.ryRatio = 1;
            this.radiusx = (Math.sqrt(eval(this.selectedObject.areaColumn) / (this.selectedObject.rxRatio * this.selectedObject.ryRatio * 3.14))) * this.selectedObject.rxRatio
            this.radiusxOperator = '*'
            this.radiusxOperand = 1;
            this.radiusy = (Math.sqrt(eval(this.selectedObject.areaColumn) / (this.selectedObject.rxRatio * this.selectedObject.ryRatio*3.14))) * this.selectedObject.ryRatio
            this.radiusyOperator = '*'
            this.radiusyOperand = 1;

            this.selectedObject.set('rx', this.radiusx)
            this.selectedObject.set('ry', this.radiusy)
            this.selectedObject.setCoords();
            this.canvas.renderAll()
          }
        }
        else if (target.id == 'rotationPanel') {
          let evaluatable = this.bottomcanvas.getObjects().find(x => x.typename == 'outputport' && x.belongsto == $(source.srcElement).siblings()[0].value).fieldName.replace("\n", "");
          this.selectedObject.mappedrotation = evaluatable
          let value = this.rowIndex;

          for (let i = 0; i < this.keys.length; i++) {
            evaluatable = evaluatable.replace(new RegExp(this.keys[i], 'g'), 'parseFloat(this.rowData[value]["' + this.keys[i] + '"])');
          }
          evaluatable = '(' + evaluatable + ')'
          this.rotation = eval(evaluatable)
          target.value = this.rotation
          this.selectedObject.angleColumn = evaluatable
          this.selectedObject.set('angle', eval(evaluatable))
          this.rotationTitle = evaluatable;
          this.selectedObject.setCoords();
          this.canvas.renderAll()
        }
      }

      ismidmapperselected = false;
      ismidoperatorselected = false;
      isoperatorselected = false;
    })

    this.bottomcanvas.on("mouse:up", (event) => {
      if (source != null && event.target != null && source.typename == event.target.typename && (source.belongsto.indexOf('mapper') > -1 || source.belongsto.indexOf('key') > -1 || source.belongsto.indexOf('operator') > -1 || source.belongsto.indexOf('isNumericData') > -1) && source.typename != 'isNumericData' && source.typename != 'isColorData' && source.typename != 'isStringData') {
        let objs = this.bottomcanvas.getObjects().filter(x => x.groupto == source.belongsto).map(function (o) {
          return o.set('active', true); //return objects that you want to select
        });

        let group = new fabric.Group(objs, { originX: 'center', originY: 'center' });

        this.bottomcanvas._activeObject = null;
        group.setCoords();
        this.bottomcanvas.setActiveGroup(group).renderAll();
      }
      if (source != null && source.typename == 'outputport' && source.belongsto != null && source.belongsto.indexOf('key') > -1 && (event.target == null || (event.target != null && event.target.typename != null && event.target.typename.indexOf('line') == 0))) {
        console.log(source)
        let pointer = this.bottomcanvas.getPointer(event.e);
        let inputport = new fabric.Circle({
          left: pointer.x,
          top: pointer.y,
          originX: 'left',
          originY: 'top',
          radius: 5,
          fill: 'black',
          typename: 'outputport',
          belongsto: 'isNumericData ' + this.bottomcanvas.getObjects().filter(x => x.typename == 'outputport' && x.belongsto == 'isNumericData').length,
          selectable: false
        });
        let rect = new fabric.Rect({
          left: inputport.left + (inputport.radius * 2),
          top: inputport.top - 10, originX: 'left', originY: 'top',
          width: 30, height: 30, fill: 'transparent', border: 'black',
          strokeWidth: .9, stroke: "black", selectable: false
        });
        let hash = new fabric.IText('#', {
          left: rect.left + 3,
          top: rect.top + 1,
          fontFamily: 'arial',
          fill: '#3c1361',
          fontSize: 30,
          typename: 'isNumericData',
          belongsto: 'isNumericData ' + this.bottomcanvas.getObjects().filter(x => x.typename == 'outputport' && x.belongsto == 'isNumericData').length, selectable: false
        });

        let outputport = new fabric.Circle({
          left: rect.left + rect.width,
          top: rect.top + (rect.height / 3),
          originX: 'left',
          originY: 'top',
          radius: 5,
          fill: 'black',
          typename: 'outputport',
          belongsto: 'isNumericData ' + this.bottomcanvas.getObjects().filter(x => x.typename == 'outputport' && x.belongsto == 'isNumericData').length, selectable: false
        });
        let line = new fabric.Line([source.left, source.top + 3, pointer.x + 2, pointer.y + 2], { stroke: 'black', selectable: false });
        this.bottomcanvas.add(inputport)
        this.bottomcanvas.add(rect);
        this.bottomcanvas.add(hash);
        this.bottomcanvas.add(outputport);
        this.bottomcanvas.add(line)

        let evaluatable = source.fieldName
        let value = this.rowIndex;
        for (let i = 0; i < this.keys.length; i++) {
          evaluatable = evaluatable.replace(new RegExp(this.keys[i], 'g'), 'parseFloat(this.rowData[value]["' + this.keys[i] + '"])');
        }
        evaluatable = '(' + evaluatable + ')'

        outputport.value = eval(evaluatable)
      }
      else if (source != null && source.typename == 'outputport' && source.belongsto != null && (source.belongsto.indexOf('isNumericData') > -1 || source.belongsto.indexOf('operator') > -1) && event.target != null && event.target.typename != 'firstleftitem' && event.target.belongsto != null && event.target.belongsto.indexOf('mapper') > -1) {
        let letter = new fabric.IText('#', {
          fontFamily: 'arial', fill: '#460073', fontSize: 35, typename: 'isNumericData', value: "", selectable: false, editable: false, belongsto: event.target.belongsto
        });
        let mapper = this.bottomcanvas.getObjects().find(x => x.typename != null && x.mainname == 'mapper')
        let leftinput = this.bottomcanvas.getObjects().find(x => x.typename == 'leftinput' && x.belongsto == event.target.belongsto)
        if (mapper.leftitems == null) { mapper.leftitems = [] }
        letter.left = leftinput.left + 10;
        letter.top = leftinput.top + (mapper.leftitems.length * letter.height);
        if (source.belongsto.indexOf('operator') > -1) {
          let evaluatable = source.fieldName;
          let value = this.rowIndex;
          for (let i = 0; i < this.keys.length; i++) {
            evaluatable = evaluatable.replace(new RegExp(this.keys[i], 'g'), 'parseFloat(this.rowData[value]["' + this.keys[i] + '"])');
          }
          evaluatable = '(' + evaluatable + ')'
          letter.value = eval(evaluatable)
        } else {
          letter.value = source.value;
        }
        for (let l = 0; l < mapper.leftitems.length; l++) {
          if (mapper.leftitems[l] == event.target) {
            this.bottomcanvas.remove(this.bottomcanvas.getObjects().find(x => x.typename == 'line' + l))
            break;
          }
        }
        let line = new fabric.Line([source.left, source.top + 2, letter.left, letter.top + 10], { stroke: 'black', selectable: false, typename: 'line' + mapper.leftitems.length });
        mapper.leftitems.push(letter)


        this.bottomcanvas.add(line)
        this.bottomcanvas.sendToBack(line)
        if (mapper.leftitems.length == 1) {
          let firstleftitem = this.cloneObject(letter)
          let firstleftitemContainer = this.bottomcanvas.getObjects().find(x => x.belongsto == mapper.belongsto && x.typename == 'firstleftitemContainer')
          firstleftitem.typename = 'firstleftitem'
          firstleftitem.left = firstleftitemContainer.left + 5
          firstleftitem.top = firstleftitemContainer.top;
          firstleftitem.belongsto = firstleftitemContainer.belongsto

          this.bottomcanvas.add(firstleftitem)
        }
        this.bottomcanvas.add(letter)
      }
      else if (source != null && (source.typename == 'key' || source.typename == 'outputport') && event.target != null && (event.target.typename == 'topline' || event.target.typename == 'bottomline')) {
        if (source.fieldName != null) {
          event.target.column = source.fieldName;
        }
        else if (source.value != null) {
          event.target.column = source.value
        }
        let pointer = this.bottomcanvas.getPointer(event.e);
        let line = new fabric.Line([this.positionX, this.positionY, pointer.x, pointer.y], { stroke: 'black', selectable: false, belongsto: event.target.belongsto });
        this.bottomcanvas.add(line);

        let outline = this.bottomcanvas.getObjects().find(x => x.belongsto == event.target.belongsto && x.typename == 'outline')
        let topline = this.bottomcanvas.getObjects().find(x => x.belongsto == event.target.belongsto && x.typename == 'topline')
        let bottomline = this.bottomcanvas.getObjects().find(x => x.belongsto == event.target.belongsto && x.typename == 'bottomline')
        let operator = this.bottomcanvas.getObjects().find(x => x.belongsto == event.target.belongsto && x.typename == 'operator')
        if (bottomline.column != null && topline.column != null) {

          let a = new fabric.Path('M360.342,216.266L219.373,113.882c-9.783-7.106-22.723-8.121-33.498-2.63c-10.771,5.49-17.556,16.559-17.556,28.65V344.67    c0,12.092,6.784,23.158,17.556,28.646c4.61,2.348,9.611,3.506,14.6,3.506c6.666,0,13.301-2.07,18.898-6.138l140.969-102.383    c8.33-6.047,13.256-15.719,13.256-26.018C373.598,231.988,368.672,222.312,360.342,216.266z M242.285,0C108.688,0,0.004,108.689,0.004,242.283c0,133.592,108.686,242.283,242.281,242.283    c133.594,0,242.278-108.691,242.278-242.283C484.562,108.689,375.881,0,242.285,0z M242.285,425.027    c-100.764,0-182.744-81.979-182.744-182.744c0-100.766,81.98-182.742,182.744-182.742s182.745,81.976,182.745,182.742    C425.029,343.049,343.049,425.027,242.285,425.027z', {
            scaleX: .05, scaleY: .05,
            left: operator.left + operator.width + 7,
            top: operator.top + (operator.height / 3),
            originX: 'left',
            originY: 'top',
            fill: '#black',
            selectable: false,
            editable: false,
            belongsto: event.target.belongsto,
          })

          //let b = new fabric.Path('M16,20V16H1V9H16V5l8,7Z', { left: a.left + (a.width * a.scaleX)-15, top: a.top + (a.height * a.scaleY / 4)-10, typename: 'outputline', belongsto: event.target.belongto });

          let b = new fabric.Line([outline.left + 15, outline.top + 5, outline.left + 30, outline.top + 5], { stroke: 'black', selectable: false, belongsto: event.target.belongsto });

          let c = new fabric.Circle({
            left: b.left + b.width, top: outline.top, originX: 'left', originY: 'top', radius: 5,
            fill: 'black', selectable: false, editable: false, belongsto: event.target.belongsto
          });

          let d = new fabric.Rect({
            left: c.left + (c.radius * 2),
            top: operator.top + 10,
            originX: 'left',
            originY: 'top',
            width: 30,
            height: 30,
            fill: 'white',
            transparentCorners: false, selectable: false,
            belongsto: event.target.belongsto,
          })
          let e = new fabric.IText('#', {
            left: d.left + 5,
            top: d.top + 2,
            originX: 'left',
            originY: 'top',
            fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
            fill: '#3c1361',
            fontSize: 30,
            selectable: false,
            typename: 'text',
            value: 'Operator ',
            fieldName: '(' + topline.column + operator.text + bottomline.column + ')',
            belongsto: event.target.belongsto,
          })
          let outputport = this.bottomcanvas.getObjects().filter(a => a.typename == 'outputport' && a.value != null && a.value.indexOf('Operator') > -1)
          let f = new fabric.Circle({
            left: d.left + d.width,
            top: d.top + (d.height / 3),
            originX: 'left',
            originY: 'top',
            radius: 5,
            fill: 'black',
            selectable: false, editable: false,
            typename: 'outputport',
            belongsto: event.target.belongsto,
            fieldName: '(' + topline.column + operator.text + bottomline.column + ')',
            value: event.target.belongsto,
          })

          //this.bottomcanvas.add(a)
          this.bottomcanvas.add(b)
          this.bottomcanvas.add(c)
          this.bottomcanvas.add(d)
          this.bottomcanvas.add(e)
          this.bottomcanvas.add(f)

        }
        this.bottomcanvas.getObjects().filter(x => x.belongsto == event.target.belongsto).forEach(x => x.groupto = event.target.belongsto);
        this.bottomcanvas.getObjects().filter(x => x.belongsto == source.belongsto).forEach(x => x.groupto = event.target.belongsto);
        this.bottomcanvas.getObjects().filter(x => x.groupto == source.belongsto).forEach(x => x.groupto = event.target.belongsto);
      }
      else if (source != null && (source.typename == 'outputport' || source.typename == 'key') && event.target != null && event.target.typename == 'firstleftitem') {
        let pointer = this.bottomcanvas.getPointer(event.e);
        let line = new fabric.Line([this.positionX, this.positionY, pointer.x, pointer.y], { stroke: 'black', selectable: false, belongsto: event.target.belongsto });

        this.bottomcanvas.add(line);

        let item = this.bottomcanvas.getObjects().find(x => x.belongsto == event.target.belongsto && x.typename == 'outputport')
        item.column = source.fieldName;

        this.bottomcanvas.getObjects().filter(x => x.belongsto == event.target.belongsto).forEach(x => x.groupto = event.target.belongsto);
        this.bottomcanvas.getObjects().filter(x => x.belongsto == source.belongsto).forEach(x => x.groupto = event.target.belongsto);
        this.bottomcanvas.getObjects().filter(x => x.groupto == source.belongsto).forEach(x => x.groupto = event.target.belongsto);

      }
      else if (source != null && (source.typename == 'outputport' || source.typename == 'key') && event.target != null && event.target.typename == 'isNumericData') {
        let mapper = this.bottomcanvas.getObjects().find(x => x.typename != null && x.mainname == 'mapper')
        let line = new fabric.Line([source.left, source.top + (source.radius / 2), event.target.left, event.target.top + (event.target.height / 2)], { stroke: 'black', selectable: false });
        event.target.value = this.rowData[this.rowIndex][source.fieldName];
        for (let l = 0; l < mapper.leftitems.length; l++) {
          if (mapper.leftitems[l] == event.target) {
            line.typename = 'line' + l;
            this.bottomcanvas.remove(this.bottomcanvas.getObjects().find(x => x.typename == 'line' + l))
            break;
          }
        }
        this.bottomcanvas.add(line)
      }


      if (source != null && source.typename != 'outputport' && event.target != null && event.target.typename != null && (event.target.typename.indexOf('Data') > -1)) {

        $('#mapperPopup').css('display', 'block')
        $('#mapperPopup').css('left', event.target.left + $('#leftpanel').width() + 30 + 'px')
        $('#mapperPopup').css('top', this.bottomcanvas._offset.top + event.target.top + 'px')
        if (event.target.typename == 'isColorData') {
          $('#mappedPopuptext').attr('type', 'color')
          $('#mappedPopuptext').val(event.target.value)
          $('#mappedPopuptext').attr('readonly', false);
        }
        else if (event.target.typename == 'isNumericData') {
          $('#mappedPopuptext').attr('type', 'text')
          $('#mappedPopuptext').attr('readonly', false);
          $('#mappedPopuptext').val(event.target.value)
          $('#mappedPopuptext').focus()
        }
        else if (event.target.typename == 'firstleftitem') {
          $('#mappedPopuptext').attr('type', 'text')
          $('#mappedPopuptext').attr('readonly', true);
          $('#mappedPopuptext').val(event.target.column)
        }
        selectedPopupElement = event.target;
      }
      isoperatorselected = false;
    });

    let selectedPopupElement;
    $("#mappedPopuptext").change(() => {
      selectedPopupElement.value = $('#mappedPopuptext').val()
      if (this.bottomcanvas.getObjects().find(x => x.typename == 'outputport' && x.belongsto == selectedPopupElement.belongsto) != null) {
        this.bottomcanvas.getObjects().find(x => x.typename == 'outputport' && x.belongsto == selectedPopupElement.belongsto).value = $('#mappedPopuptext').val()
      }
      if (selectedPopupElement.typename == 'isColorData') {
        selectedPopupElement.fill = selectedPopupElement.value;
        selectedPopupElement.stroke = selectedPopupElement.value;
      }
      this.bottomcanvas.renderAll();
    });

    $("#isNumericData").draggable({
      cursorAt: { top: 18.5, left: 60 },
      cursor: 'none',
      scroll: false,
      helper: (event) => {
        return $("<div style='z-index: 100; margin-top: -1px; margin-left: 38px;color: #460073'><i class='value-number'></i></div>");
      }
    });

    $("#isStringData").draggable({
      cursorAt: { top: 18.5, left: 60 },
      cursor: 'none',
      scroll: false,
      helper: (event) => {
        return $("<div style='z-index: 100; margin-top: -1px; margin-left: 38px;color: #460073'><i class='value-string'></i></div>");
      }
    });

    $("#isColorData").draggable({
      cursorAt: { top: 18.5, left: 60 },
      cursor: 'none',
      scroll: false,
      helper: (event) => {
        return $("<div style='z-index: 100; margin-top: -1px; margin-left: 38px;color: #460073'><i class='value-color'></i></div>");
      }
    });

    $("#divlength").droppable({
      tolerance: "pointer",
      drop: (ev, ui) => {
        console.log(ui.draggable[0])

        let evaluatable = ui.draggable[0].innerText;
        let value = this.rowIndex;
        for (let i = 0; i < this.keys.length; i++) {
          evaluatable = evaluatable.replace(new RegExp(this.keys[i], 'g'), 'parseFloat(this.rowData[value]["' + this.keys[i] + '"])');
        }
        evaluatable = '(' + evaluatable + ')'

        this.length = eval(evaluatable)
        this.selectedObject.set('height', eval(evaluatable + this.lengthOperator + this.lengthOperand));
        this.selectedObject.heightColumn = evaluatable + this.lengthOperator + this.lengthOperand;
        this.selectedObject.mappedheight = ui.draggable[0].innerText;
        this.selectedObject.setCoords();
        this.canvas.renderAll()
        this.area = this.length * this.width;
        this.selectedObject.areaColumn = null;
        this.selectedObject.mappedarea = '';
      }
    });

    $("#divxposition").droppable({
      tolerance: "pointer",
      drop: (ev, ui) => {
        let evaluatable = ui.draggable[0].innerText;
        let value = this.rowIndex;
        for (let i = 0; i < this.keys.length; i++) {
          evaluatable = evaluatable.replace(new RegExp(this.keys[i], 'g'), 'parseFloat(this.rowData[value]["' + this.keys[i] + '"])');
        }
        evaluatable = '(' + evaluatable + ')'

        this.xposition = eval(evaluatable)
        let graph = this.graphs.find(x => x.ID == this.selectedObject.graphname);
        this.selectedObject.set('left', eval(evaluatable + this.xPositionOperator + this.xPositionOperand) + graph.left);
        this.selectedObject.xpositionColumn = evaluatable + this.xPositionOperator + this.xPositionOperand;
        this.selectedObject.mappedxposition = ui.draggable[0].innerText;
        this.selectedObject.setCoords();

        this.canvas.renderAll();
      }
    });

    $("#divyposition").droppable({
      tolerance: "pointer",
      drop: (ev, ui) => {
        console.log(ui.draggable[0])

        let evaluatable = ui.draggable[0].innerText;
        let value = this.rowIndex;
        for (let i = 0; i < this.keys.length; i++) {
          evaluatable = evaluatable.replace(new RegExp(this.keys[i], 'g'), 'parseFloat(this.rowData[value]["' + this.keys[i] + '"])');
        }
        evaluatable = '(' + evaluatable + ')'

        this.yposition = eval(evaluatable)
        let graph = this.graphs.find(x => x.ID == this.selectedObject.graphname);
        this.selectedObject.set('top', graph.top + (graph.height * graph.scaleY) - eval(evaluatable + this.yPositionOperator + this.yPositionOperand) - this.selectedObject.height);
        this.selectedObject.ypositionColumn = evaluatable + this.yPositionOperator + this.yPositionOperand;
        this.selectedObject.mappedyposition = ui.draggable[0].innerText;

        this.selectedObject.setCoords();
        this.selectedObject.mappedyposition = ui.draggable[0].innerText;
        this.canvas.renderAll();
      }
    });

    $("#rotationPaneldiv").droppable({
      drop: (ev, ui) => {
        console.log(ui.draggable[0])

        let evaluatable = ui.draggable[0].innerText;
        let value = this.rowIndex;
        for (let i = 0; i < this.keys.length; i++) {
          evaluatable = evaluatable.replace(new RegExp(this.keys[i], 'g'), 'parseFloat(this.rowData[value]["' + this.keys[i] + '"])');
        }
        evaluatable = '(' + evaluatable + ')'
        this.rotation = eval(evaluatable)
        this.selectedObject.set('angle', eval(evaluatable));
        this.selectedObject.rotateColumn = evaluatable;
        this.selectedObject.mappedrotate = ui.draggable[0].innerText;
        this.rotationTitle = ui.draggable[0].innerText;
        this.canvas.renderAll()
      }
    });
    $("#divwidth").droppable({
      tolerance: "pointer",
      drop: (ev, ui) => {
        let evaluatable = ui.draggable[0].innerText;
        let value = this.rowIndex;
        for (let i = 0; i < this.keys.length; i++) {
          evaluatable = evaluatable.replace(new RegExp(this.keys[i], 'g'), 'parseFloat(this.rowData[value]["' + this.keys[i] + '"])');
        }
        evaluatable = '(' + evaluatable + ')'
        this.width = eval(evaluatable)
        this.selectedObject.set('width', eval(evaluatable + this.widthOperator + this.widthOperand));
        this.selectedObject.widthColumn = evaluatable + this.widthOperator + this.widthOperand;
        this.selectedObject.mappedwidth = ui.draggable[0].innerText;
        this.area = this.width * this.length;
        this.selectedObject.setCoords();
        this.canvas.renderAll();
        this.selectedObject.areaColumn = null;
        this.selectedObject.mappedarea = '';
      }
    });
    $("#divside").droppable({
      tolerance: "pointer",
      drop: (ev, ui) => {
        let evaluatable = ui.draggable[0].innerText;
        let value = this.rowIndex;
        for (let i = 0; i < this.keys.length; i++) {
          evaluatable = evaluatable.replace(new RegExp(this.keys[i], 'g'), 'parseFloat(this.rowData[value]["' + this.keys[i] + '"])');
        }
        evaluatable = '(' + evaluatable + ')'
        this.side = eval(evaluatable)
        this.selectedObject.set('width', eval(evaluatable + this.sideOperator + this.sideOperand));
        this.selectedObject.set('height', eval(evaluatable + this.sideOperator + this.sideOperand));
        this.selectedObject.sideColumn = evaluatable + this.sideOperator + this.sideOperand;
        this.selectedObject.mappedside = ui.draggable[0].innerText;
        this.area = this.side * this.side;
        this.canvas.renderAll()
        this.selectedObject.areaColumn = null;
        this.selectedObject.mappedarea = '';
        this.selectedObject.setCoords();
      }
    });
    $("#divradius").droppable({
      tolerance: "pointer",
      drop: (ev, ui) => {
        let evaluatable = ui.draggable[0].innerText;
        let value = this.rowIndex;
        for (let i = 0; i < this.keys.length; i++) {
          evaluatable = evaluatable.replace(new RegExp(this.keys[i], 'g'), 'parseFloat(this.rowData[value]["' + this.keys[i] + '"])');
        }
        evaluatable = '(' + evaluatable + ')'
        this.radius = eval(evaluatable)
        this.selectedObject.set('radius', eval(evaluatable + this.radiusOperator + this.radiusOperand));
        this.selectedObject.radiusColumn = evaluatable + this.radiusOperator + this.radiusOperand;
        this.selectedObject.mappedradius = ui.draggable[0].innerText;
        this.area = 3.14 * this.radius * this.radius;
        this.canvas.renderAll()
        this.selectedObject.areaColumn = null;
        this.selectedObject.mappedarea = '';
        this.selectedObject.setCoords();
      }
    });
    $("#divradiusx").droppable({
      tolerance: "pointer",
      drop: (ev, ui) => {
        let evaluatable = ui.draggable[0].innerText;
        let value = this.rowIndex;
        for (let i = 0; i < this.keys.length; i++) {
          evaluatable = evaluatable.replace(new RegExp(this.keys[i], 'g'), 'parseFloat(this.rowData[value]["' + this.keys[i] + '"])');
        }
        evaluatable = '(' + evaluatable + ')'
        this.radiusx = eval(evaluatable)
        this.selectedObject.set('rx', eval(evaluatable + this.radiusxOperator + this.radiusxOperand));
        this.selectedObject.radiusxColumn = evaluatable + this.radiusxOperator + this.radiusxOperand;
        this.selectedObject.mappedradiusx = ui.draggable[0].innerText;
        this.area = 3.14 * this.radiusx * this.radiusy;
        this.canvas.renderAll()
        this.selectedObject.areaColumn = null;
        this.selectedObject.mappedarea = '';
        this.selectedObject.setCoords();
      }
    });
    $("#divradiusy").droppable({
      tolerance: "pointer",
      drop: (ev, ui) => {
        let evaluatable = ui.draggable[0].innerText;
        let value = this.rowIndex;
        for (let i = 0; i < this.keys.length; i++) {
          evaluatable = evaluatable.replace(new RegExp(this.keys[i], 'g'), 'parseFloat(this.rowData[value]["' + this.keys[i] + '"])');
        }
        evaluatable = '(' + evaluatable + ')'
        this.radiusy = eval(evaluatable)
        this.selectedObject.set('ry', eval(evaluatable + this.radiusyOperator + this.radiusyOperand));
        this.selectedObject.radiusyColumn = evaluatable + this.radiusyOperator + this.radiusyOperand;
        this.selectedObject.mappedradiusy = ui.draggable[0].innerText;
        this.area = 3.14 * this.radiusx * this.radiusy;
        this.canvas.renderAll()
        this.selectedObject.areaColumn = null;
        this.selectedObject.mappedarea = '';
        this.selectedObject.setCoords();
      }
    });


    $("#divarea").droppable({
      drop: (ev, ui) => {
        console.log(ui.draggable[0])

        let evaluatable = ui.draggable[0].innerText;
        let value = this.rowIndex;
        for (let i = 0; i < this.keys.length; i++) {
          evaluatable = evaluatable.replace(new RegExp(this.keys[i], 'g'), 'parseFloat(this.rowData[value]["' + this.keys[i] + '"])');
        }
        evaluatable = '(' + evaluatable + ')'
        if (this.selectedObject.typename == 'Rectangle') {
          this.length = (Math.sqrt(eval(evaluatable) / (this.lratio * this.wratio))) * this.lratio
          this.width = (Math.sqrt(eval(evaluatable) / (this.lratio * this.wratio))) * this.wratio
          this.selectedObject.mappedwidth = ''
          this.selectedObject.mappedheight = ''
          this.area = eval(evaluatable)
          this.selectedObject.set('height', this.length);
          this.selectedObject.set('width', this.width);
          this.selectedObject.areaColumn = evaluatable;
          this.selectedObject.lratio = this.lratio;
          this.selectedObject.wratio = this.wratio;
          this.selectedObject.mappedarea = ui.draggable[0].innerText;
          this.canvas.renderAll()

          this.selectedObject.heightColumn = null;
          this.selectedObject.mappedheight = '';
          this.selectedObject.widthColumn = null;
          this.selectedObject.mappedwidth = '';
          this.lengthOperand = '1';
          this.widthOperand = '1';
        }
        else if (this.selectedObject.typename == 'Square') {
          this.side = Math.sqrt(eval(evaluatable));
          this.selectedObject.mappedside = '';
          this.area = eval(evaluatable);
          this.selectedObject.set('height', this.side);
          this.selectedObject.set('width', this.side);
          this.selectedObject.areaColumn = evaluatable;
          this.selectedObject.mappedarea = ui.draggable[0].innerText;
          this.canvas.renderAll()

          this.selectedObject.sideColumn = null;
          this.selectedObject.mappedside = '';
          this.sideOperand = '1';
        }
        else if (this.selectedObject.typename == 'Circle') {
          this.radius = Math.sqrt(eval(evaluatable) / 3.14);
          this.area = eval(evaluatable);
          this.selectedObject.set('radius', this.radius);
          this.selectedObject.areaColumn = evaluatable;
          this.selectedObject.mappedarea = ui.draggable[0].innerText;
          this.canvas.renderAll()

          this.selectedObject.radiusColumn = null;
          this.selectedObject.mappedradius = '';
          this.radiusOperand = 1;
        }
        else if (this.selectedObject.typename == 'Ellipse') {
          this.radiusx = (Math.sqrt(eval(evaluatable) / (this.rxRatio * this.ryRatio))) * this.rxRatio
          this.radiusy = (Math.sqrt(eval(evaluatable) / (this.lratio * this.wratio))) * this.ryRatio
          this.area = eval(evaluatable)
          this.selectedObject.set('rx', this.radiusx);
          this.selectedObject.set('ry', this.radiusy);
          this.selectedObject.areaColumn = evaluatable;
          this.selectedObject.rxRatio = this.rxRatio;
          this.selectedObject.ryRatio = this.ryRatio;
          this.selectedObject.mappedarea = ui.draggable[0].innerText;
          this.canvas.renderAll()

          this.selectedObject.ryRatioColumn = null;
          this.selectedObject.mappedradiusx = '';
          this.selectedObject.rxRatioColumn = null;
          this.selectedObject.mappedradiusy = '';
          this.radiusxOperand = '1';
          this.radiusyOperand = '1';
        }
      }
    });

    $("#rectanglePrototype").draggable({
      cursorAt: { top: 18.5, left: 60 },
      cursor: 'none',
      scroll: false,
      helper: (event) => {
        return $("<div style='z-index: 100; margin-top: -1px; margin-left: 38px;'><i class='mark-rectangle'></i></div>");
      }
    });
    $("#circlePrototype").draggable({
      cursorAt: { top: 18.5, left: 60 },
      cursor: 'none',
      scroll: false,
      helper: (event) => {
        return $("<div style='z-index: 100; margin-top: -1px; margin-left: 38px;'><i class='mark-circle'></i></div>");
      }
    });
    $("#mapperWidget").draggable({
      cursorAt: { top: 18.5, left: 80 },
      cursor: 'none',
      scroll: false,
      helper: (event) => {
        return $("<div style='z-index: 100; margin-top: -1px; margin-left: 38px;'><i class='collections-mapper'></i></div>");
      }
    });
    $("#squarePrototype").draggable({
      cursorAt: { top: 18.5, left: 60 },
      cursor: 'none',
      scroll: false,
      helper: (event) => {
        return $("<div style='z-index: 100; margin-top: -1px; margin-left: 38px;'><i class='mark-square'></i></div>");
      }
    });
    $("#ellipsePrototype").draggable({
      cursorAt: { top: 18.5, left: 60 },
      cursor: 'none',
      scroll: false,
      helper: (event) => {
        return $("<div style='z-index: 100; margin-top: -1px; margin-left: 38px;'><i class='mark-ellipse'></i></div>");
      }
    });

    $("#pathMarkPrototype").draggable({
      cursorAt: { top: 18.5, left: 60 },
      cursor: 'none',
      scroll: false,
      helper: (event) => {
        return $("<div style='z-index: 100; margin-top: -1px; margin-left: 38px;'><i class='mark-pathMark'></i></div>");
      }
    });
    $("#addition-operator").draggable({
      cursorAt: { top: 18.5, left: 60 },
      cursor: 'none',
      scroll: false,
      helper: (event) => {
        return $("<div style='z-index: 100; margin-top: -1px; margin-left: 38px;'><i class='operator-additionIcon'></i></div>");
      }
    });
    $("#subtraction-operator").draggable({
      cursorAt: { top: 18.5, left: 60 },
      cursor: 'none',
      scroll: false,
      helper: (event) => {
        return $("<div style='z-index: 100; margin-top: -1px; margin-left: 38px;'><i class='operator-subtractionIcon'></i></div>");
      }
    });
    $("#multiplication-operator").draggable({
      cursorAt: { top: 18.5, left: 60 },
      cursor: 'none',
      scroll: false,
      helper: (event) => {
        return $("<div style='z-index: 100; margin-top: -1px; margin-left: 38px;'><i class='operator-multiplicationIcon'></i></div>");
      }
    });
    $("#division-operator").draggable({
      cursorAt: { top: 18.5, left: 60 },
      cursor: 'none',
      scroll: false,
      helper: (event) => {
        return $("<div style='z-index: 100; margin-top: -1px; margin-left: 38px;'><i class='operator-divisionIcon'></i></div>");
      }
    });
    $("#bottomcanvas").droppable({
      drop: (ev, ui) => {
        if (ui.draggable[0].id == 'isNumericData' || ui.draggable[0].id == 'isColorData' || ui.draggable[0].id == 'isStringData') {

          let mappers = this.bottomcanvas.getObjects().filter(x => x.typename != null && x.mainname == 'mapper')
          let isInsideMapper = false;
          for (let i = 0; i < mappers.length; i++) {
            let mapper = mappers[i];
            let leftitem = this.bottomcanvas.getObjects().find(x => x.belongsto == mapper.belongsto && x.typename == 'leftinput')
            let rightitem = this.bottomcanvas.getObjects().find(x => x.belongsto == mapper.belongsto && x.typename == 'rightinput')

            if ((leftitem.left - (ui.offset.left - $('#leftpanel').width()) > 0 && leftitem.left - (ui.offset.left - $('#leftpanel').width()) < leftitem.width + 5) || (rightitem.left - (ui.offset.left - $('#leftpanel').width()) > 0 && rightitem.left - (ui.offset.left - $('#leftpanel').width()) < rightitem.width + 5)) {
              isInsideMapper = true;
              if (mapper.leftitems == null) {
                mapper.leftitems = [];
              }
              if (mapper.rightitems == null) {
                mapper.rightitems = [];
              }

              let letter;
              if (ui.draggable[0].id == 'isNumericData') {
                letter = new fabric.IText('#', {
                  fontFamily: 'arial', fill: '#460073', fontSize: 35, typename: ui.draggable[0].id, value: 0, selectable: false, editable: false, belongsto: mapper.belongsto, groupto: mapper.belongsto
                })
              }
              else if (ui.draggable[0].id == 'isColorData') {
                letter = new fabric.Path('m -1662.5927,2965.5148 c 1.9739,3.398 4.0351,6.4881 6,9.3438 1.965,2.8556 3.8358,5.4801 5.4688,7.9687 1.633,2.4885 3.022,4.8287 4,7.125 0.4891,1.148 0.8603,2.2733 1.125,3.4063 0.2647,1.1327 0.4062,2.2665 0.4062,3.4062 0,1.1395 -0.1483,2.2698 -0.375,3.3438 -0.2266,1.0737 -0.5383,2.1073 -0.9687,3.0937 -0.8608,1.9728 -2.0858,3.759 -3.625,5.25 -1.5392,1.4906 -3.3709,2.698 -5.4063,3.5313 -1.0176,0.4163 -2.1112,0.7807 -3.2187,1 -1.1076,0.2192 -2.2316,0.3125 -3.4063,0.3125 -1.1745,0 -2.3256,-0.093 -3.4375,-0.3125 -1.1118,-0.2193 -2.1941,-0.5835 -3.2187,-1 -2.0487,-0.8335 -3.8875,-2.0406 -5.4375,-3.5313 -1.55,-1.491 -2.8036,-3.2772 -3.6563,-5.25 -0.4261,-0.9864 -0.7541,-2.02 -0.9687,-3.0937 -0.2146,-1.074 -0.3032,-2.2044 -0.2813,-3.3438 0.029,-1.5282 0.2077,-2.8851 0.5,-4.2187 0.2923,-1.3339 0.6751,-2.6098 1.1875,-3.8125 1.0251,-2.4062 2.4464,-4.6096 4.0938,-6.875 1.6474,-2.2654 3.5123,-4.6158 5.4375,-7.25 1.925,-2.6344 3.9231,-5.5807 5.7812,-9.0938 z m -7.9375,23.625 c -0.4883,0.7747 -0.9597,1.5154 -1.3125,2.3438 -0.3093,0.7263 -0.5425,1.5382 -0.7187,2.3437 -0.1766,0.8052 -0.2637,1.6397 -0.2813,2.5625 -0.013,0.6879 0.027,1.3515 0.1563,2 0.1296,0.6485 0.3364,1.2482 0.5937,1.8438 0.5148,1.1911 1.283,2.256 2.2188,3.1562 0.9359,0.9002 2.0443,1.6219 3.2812,2.125 0.6187,0.2515 1.2348,0.524 1.9063,0.6563 0.6712,0.1322 1.3846,0.1562 2.0937,0.1562 0.7093,0 1.3627,-0.024 2.0313,-0.1562 0.6688,-0.1323 1.3542,-0.405 1.9687,-0.6563 1.229,-0.5031 2.3207,-1.2248 3.25,-2.125 0.9294,-0.9002 1.699,-1.9651 2.2188,-3.1562 0.2599,-0.5956 0.4569,-1.1953 0.5937,-1.8438 0.013,-0.037 -0.013,-0.088 0,-0.125 z', {
                  fontFamily: 'arial', fill: '#460073', typename: ui.draggable[0].id, value: "#460073", selectable: false
                  , belongsto: mapper.belongsto, groupto: mapper.belongsto
                })
                letter.set({ scaleY: .7, scaleX: .7 });
              }
              else if (ui.draggable[0].id == 'isStringData') {
                letter = new fabric.Path('m 112.375,55.0625 0,20.09375 8.6875,0 c 0,0 -0.0419,8.2293 -1.28125,11.625 -1.2391,3.3959 -2.6875,5.28125 -2.6875,5.28125 l 2.125,3.90625 c 0,0 6.7091,-5.4148 9.1875,-11.1875 2.4781,-5.773 2.89225,-13.3194 2.90625,-17.8125 l 0.0312,-11.90625 z m 24.96875,0 0,20.09375 8.6875,0 c 0,0 -0.0107,8.2293 -1.25,11.625 -1.2391,3.3959 -2.71875,5.28125 -2.71875,5.28125 l 2.15625,3.90625 c 0,0 6.7091,-5.4148 9.1875,-11.1875 2.4781,-5.773 2.89225,-13.3194 2.90625,-17.8125 l 0.0312,-11.90625 z', {
                  fontFamily: 'arial', fill: '#460073', width: 10, height: 10, typename: ui.draggable[0].id, value: null, selectable: false, belongsto: mapper.belongsto, groupto: mapper.belongsto
                })
              }
              if (leftitem.left - (ui.offset.left - $('#leftpanel').width()) > 0 && leftitem.left - (ui.offset.left - $('#leftpanel').width()) < leftitem.width + 5) {
                letter.left = leftitem.left + 10;
                letter.top = leftitem.top + (mapper.leftitems.length * letter.height);
                mapper.leftitems.push(letter)
                if (mapper.leftitems.length == 1) {
                  let firstleftitem = this.cloneObject(letter)
                  let firstleftitemContainer = this.bottomcanvas.getObjects().find(x => x.belongsto == mapper.belongsto && x.typename == 'firstleftitemContainer')
                  firstleftitem.typename = 'firstleftitem'
                  firstleftitem.left = firstleftitemContainer.left + 5
                  firstleftitem.top = firstleftitemContainer.top;
                  firstleftitem.belongsto = firstleftitemContainer.belongsto

                  mappers[i].firstleftitem = firstleftitem;
                  this.bottomcanvas.add(firstleftitem)
                }
              }
              if (rightitem.left - (ui.offset.left - $('#leftpanel').width()) > 0 && rightitem.left - (ui.offset.left - $('#leftpanel').width()) < rightitem.width + 5) {
                letter.left = rightitem.left + 10,
                  letter.top = rightitem.top + (mapper.rightitems.length * letter.height) + 10
                mapper.rightitems.push(letter)
                if (mapper.rightitems.length == 1) {
                  let firstrightitem = this.cloneObject(letter)
                  let firstrightitemContainer = this.bottomcanvas.getObjects().find(x => x.belongsto == mapper.belongsto && x.typename == 'outputport')
                  firstrightitemContainer.typename = 'firstrightitemContainer'
                  firstrightitem.leftitems = firstrightitemContainer.leftitems
                  firstrightitem.rightitems = firstrightitemContainer.rightitems
                  firstrightitem.typename = 'outputport'
                  firstrightitem.fill = '#460073'
                  firstrightitem.stroke = 'black'
                  firstrightitem.left = firstrightitemContainer.left + 10
                  firstrightitem.top = firstrightitemContainer.top;
                  firstrightitem.belongsto = firstrightitemContainer.belongsto
                  firstrightitem.value = 'Mapper ' + this.bottomcanvas.getObjects().filter(x => x.typename == 'mapper').length

                  mappers[i].firstrightitem = firstrightitem;
                  this.bottomcanvas.add(firstrightitem)
                }
              }
              this.bottomcanvas.add(letter);

            }
          }
          if (isInsideMapper == false) {
            let hash = new fabric.IText('#', {
              left: ui.offset.left - $('#leftpanel').width() + 3,
              top: ui.offset.top - this.bottomcanvas._offset.top,
              fontFamily: 'arial',
              fill: '#3c1361',
              fontSize: 30,
              typename: 'isNumericData',
              belongsto: 'isNumericData ' + this.bottomcanvas.getObjects().filter(x => x.typename == 'outputport' && x.belongsto.indexOf('isNumericData') > -1).length,
              groupto: 'isNumericData ' + this.bottomcanvas.getObjects().filter(x => x.typename == 'outputport' && x.belongsto.indexOf('isNumericData') > -1).length
              , selectable: false, editable: false
            });
            let rect = new fabric.Rect({
              left: ui.offset.left - $('#leftpanel').width(),
              top: ui.offset.top - this.bottomcanvas._offset.top, originX: 'left', originY: 'top',
              width: 30, height: 30, fill: 'transparent', border: 'black',
              strokeWidth: .9, stroke: "black", belongsto: 'isNumericData ' + this.bottomcanvas.getObjects().filter(x => x.typename == 'outputport' && x.belongsto.indexOf('isNumericData') > -1).length,
              groupto: 'isNumericData ' + this.bottomcanvas.getObjects().filter(x => x.typename == 'outputport' && x.belongsto.indexOf('isNumericData') > -1).length,
              selectable: false
            });
            let outputport = new fabric.Circle({
              left: rect.left + rect.width,
              top: rect.top + (rect.height / 3),
              originX: 'left',
              originY: 'top',
              radius: 5,
              fill: 'black',
              typename: 'outputport',
              belongsto: 'isNumericData ' + this.bottomcanvas.getObjects().filter(x => x.typename == 'outputport' && x.belongsto.indexOf('isNumericData') > -1).length,
              groupto: 'isNumericData ' + this.bottomcanvas.getObjects().filter(x => x.typename == 'outputport' && x.belongsto.indexOf('isNumericData') > -1).length, selectable: false
            });
            this.bottomcanvas.add(rect);
            this.bottomcanvas.add(hash);
            this.bottomcanvas.add(outputport)
          }
        }
        else if (ui.draggable[0].id == 'mapperWidget') {
          let mapperheight = 150
          let belongto = 'mapper ' + (this.bottomcanvas.getObjects().filter(x => x.mainname != null && x.mainname == 'mapper').length + 1);

          let leftinput = new fabric.Circle({
            left: ui.offset.left - $('#leftpanel').width(),
            top: ui.offset.top - this.bottomcanvas._offset.top + (mapperheight / 3),
            originX: 'left',
            originY: 'top',
            radius: 20,
            fill: 'transparent',
            belongsto: belongto,
            groupto: belongto,
            typename: 'firstleftitemContainer', selectable: false
          });
          let shape = new fabric.Rect({
            left: leftinput.left + (leftinput.radius * 3),
            top: ui.offset.top - this.bottomcanvas._offset.top,
            originX: 'left',
            originY: 'top',
            width: 50,
            height: mapperheight,
            fill: 'transparent',
            transparentCorners: false,
            belongsto: belongto,
            groupto: belongto,
            typename: 'leftinput', selectable: false
          });
          let rightshape = new fabric.Rect({
            left: shape.left + (shape.width * 1.5),
            top: ui.offset.top - this.bottomcanvas._offset.top,
            originX: 'left',
            originY: 'top',
            width: 50,
            height: mapperheight,
            fill: 'transparent',
            transparentCorners: false,
            belongsto: belongto,
            groupto: belongto,
            typename: 'rightinput', selectable: false
          });

          let outershape = new fabric.Rect({
            left: shape.left - 10,
            top: ui.offset.top - this.bottomcanvas._offset.top - 10,
            originX: 'left',
            originY: 'top',
            width: (shape.width + rightshape.width) * 1.5,
            height: mapperheight + 20,
            fill: 'transparent',
            transparentCorners: false,
            belongsto: belongto,
            groupto: belongto, selectable: false
          });
          let rightoutput = new fabric.Circle({
            left: outershape.left + outershape.width + 10,
            top: ui.offset.top - this.bottomcanvas._offset.top + (shape.height / 3),
            originX: 'left',
            originY: 'top',
            radius: 20,
            fill: 'transparent',
            belongsto: belongto,
            groupto: belongto,
            typename: 'outputport',
            mainname: 'mapper', selectable: false
          });


          this.bottomcanvas.add(leftinput)
          this.bottomcanvas.add(shape)
          this.bottomcanvas.add(rightshape)
          this.bottomcanvas.add(rightoutput)
          this.bottomcanvas.add(outershape)
        }
        else if (ui.draggable[0].id == 'addition-operator' || ui.draggable[0].id == 'subtraction-operator' || ui.draggable[0].id == 'multiplication-operator' || ui.draggable[0].id == 'division-operator') {

          let belongto = 'operator ' + (this.bottomcanvas.getObjects().filter(x => x.typename == 'operator').length + 1);
          let topline = new fabric.Path('M360.342,216.266L219.373,113.882c-9.783-7.106-22.723-8.121-33.498-2.63c-10.771,5.49-17.556,16.559-17.556,28.65V344.67    c0,12.092,6.784,23.158,17.556,28.646c4.61,2.348,9.611,3.506,14.6,3.506c6.666,0,13.301-2.07,18.898-6.138l140.969-102.383    c8.33-6.047,13.256-15.719,13.256-26.018C373.598,231.988,368.672,222.312,360.342,216.266z M242.285,0C108.688,0,0.004,108.689,0.004,242.283c0,133.592,108.686,242.283,242.281,242.283    c133.594,0,242.278-108.691,242.278-242.283C484.562,108.689,375.881,0,242.285,0z M242.285,425.027    c-100.764,0-182.744-81.979-182.744-182.744c0-100.766,81.98-182.742,182.744-182.742s182.745,81.976,182.745,182.742    C425.029,343.049,343.049,425.027,242.285,425.027z', { scaleX: .03, scaleY: .03, left: ui.offset.left - $('#leftpanel').width() + 7, top: ui.offset.top - this.bottomcanvas._offset.top - 2, typename: 'topline', belongsto: belongto, groupto: belongto, selectable: false });
          let bottomline = new fabric.Path('M360.342,216.266L219.373,113.882c-9.783-7.106-22.723-8.121-33.498-2.63c-10.771,5.49-17.556,16.559-17.556,28.65V344.67    c0,12.092,6.784,23.158,17.556,28.646c4.61,2.348,9.611,3.506,14.6,3.506c6.666,0,13.301-2.07,18.898-6.138l140.969-102.383    c8.33-6.047,13.256-15.719,13.256-26.018C373.598,231.988,368.672,222.312,360.342,216.266z M242.285,0C108.688,0,0.004,108.689,0.004,242.283c0,133.592,108.686,242.283,242.281,242.283    c133.594,0,242.278-108.691,242.278-242.283C484.562,108.689,375.881,0,242.285,0z M242.285,425.027    c-100.764,0-182.744-81.979-182.744-182.744c0-100.766,81.98-182.742,182.744-182.742s182.745,81.976,182.745,182.742    C425.029,343.049,343.049,425.027,242.285,425.027z', { scaleX: .03, scaleY: .03, left: ui.offset.left - $('#leftpanel').width() + 7, top: ui.offset.top - this.bottomcanvas._offset.top + 19, typename: 'bottomline', belongsto: belongto, groupto: belongto, selectable: false });
          let outline = new fabric.Path('M360.342,216.266L219.373,113.882c-9.783-7.106-22.723-8.121-33.498-2.63c-10.771,5.49-17.556,16.559-17.556,28.65V344.67    c0,12.092,6.784,23.158,17.556,28.646c4.61,2.348,9.611,3.506,14.6,3.506c6.666,0,13.301-2.07,18.898-6.138l140.969-102.383    c8.33-6.047,13.256-15.719,13.256-26.018C373.598,231.988,368.672,222.312,360.342,216.266z M242.285,0C108.688,0,0.004,108.689,0.004,242.283c0,133.592,108.686,242.283,242.281,242.283    c133.594,0,242.278-108.691,242.278-242.283C484.562,108.689,375.881,0,242.285,0z M242.285,425.027    c-100.764,0-182.744-81.979-182.744-182.744c0-100.766,81.98-182.742,182.744-182.742s182.745,81.976,182.745,182.742    C425.029,343.049,343.049,425.027,242.285,425.027z', { scaleX: .03, scaleY: .03, left: ui.offset.left - $('#leftpanel').width() + 53.5, top: ui.offset.top - this.bottomcanvas._offset.top + 8, typename: 'outline', belongsto: belongto, groupto: belongto, selectable: false });


          let operator;
          if (ui.draggable[0].id == 'addition-operator') {
            operator = new fabric.IText('+', {
              left: bottomline.left + 15.5,
              top: ui.offset.top - this.bottomcanvas._offset.top - 10.5,
              fontFamily: 'arial',
              fill: '#3c1361',
              fontSize: 50,
              typename: 'operator',
              belongsto: belongto, groupto: belongto, selectable: false
            });
          }
          else if (ui.draggable[0].id == 'subtraction-operator') {
            operator = new fabric.IText('-', {
              left: bottomline.left + 20,
              top: ui.offset.top - this.bottomcanvas._offset.top - 15,
              fontFamily: 'arial',
              fill: '#3c1361',
              fontSize: 50,
              typename: 'operator',
              belongsto: belongto, groupto: belongto, selectable: false
            });
          }
          else if (ui.draggable[0].id == 'multiplication-operator') {
            operator = new fabric.IText('*', {
              left: bottomline.left + 20,
              top: ui.offset.top - this.bottomcanvas._offset.top,
              fontFamily: 'arial',
              fill: '#3c1361',
              fontSize: 50,
              typename: 'operator',
              belongsto: belongto, groupto: belongto, selectable: false
            });
          }
          else if (ui.draggable[0].id == 'division-operator') {
            operator = new fabric.IText('/', {
              left: bottomline.left + 25,
              top: ui.offset.top - this.bottomcanvas._offset.top,
              fontFamily: 'arial',
              fill: '#3c1361',
              fontSize: 30,
              typename: 'operator',
              belongsto: belongto, groupto: belongto, selectable: false
            });
          }
          let rect = new fabric.Rect({
            left: ui.offset.left - $('#leftpanel').width() + 22,
            top: ui.offset.top - this.bottomcanvas._offset.top,
            originX: 'left',
            originY: 'top',
            width: 30,
            height: 30,
            fill: 'transparent',
            border: 'black',
            strokeWidth: .9,
            stroke: "black",
            belongsto: belongto, groupto: belongto, selectable: false
          });


          this.bottomcanvas.add(operator)
          this.bottomcanvas.add(rect);
          this.bottomcanvas.add(topline);
          this.bottomcanvas.add(bottomline);
          this.bottomcanvas.add(outline);
          // this.bottomcanvas.add(outputline);

        }
        else if (ui.draggable[0].id == '') {

          let belongto = 'operator ' + this.bottomcanvas.getObjects().filter(x => x.typename == 'operator').length;
          let topline = new fabric.Path('M360.342,216.266L219.373,113.882c-9.783-7.106-22.723-8.121-33.498-2.63c-10.771,5.49-17.556,16.559-17.556,28.65V344.67    c0,12.092,6.784,23.158,17.556,28.646c4.61,2.348,9.611,3.506,14.6,3.506c6.666,0,13.301-2.07,18.898-6.138l140.969-102.383    c8.33-6.047,13.256-15.719,13.256-26.018C373.598,231.988,368.672,222.312,360.342,216.266z M242.285,0C108.688,0,0.004,108.689,0.004,242.283c0,133.592,108.686,242.283,242.281,242.283    c133.594,0,242.278-108.691,242.278-242.283C484.562,108.689,375.881,0,242.285,0z M242.285,425.027    c-100.764,0-182.744-81.979-182.744-182.744c0-100.766,81.98-182.742,182.744-182.742s182.745,81.976,182.745,182.742    C425.029,343.049,343.049,425.027,242.285,425.027z', { scaleX: .03, scaleY: .03, left: ui.offset.left - $('#leftpanel').width() + 7, top: ui.offset.top - this.bottomcanvas._offset.top - 2, typename: 'topline', belongsto: belongto });
          let bottomline = new fabric.Path('M360.342,216.266L219.373,113.882c-9.783-7.106-22.723-8.121-33.498-2.63c-10.771,5.49-17.556,16.559-17.556,28.65V344.67    c0,12.092,6.784,23.158,17.556,28.646c4.61,2.348,9.611,3.506,14.6,3.506c6.666,0,13.301-2.07,18.898-6.138l140.969-102.383    c8.33-6.047,13.256-15.719,13.256-26.018C373.598,231.988,368.672,222.312,360.342,216.266z M242.285,0C108.688,0,0.004,108.689,0.004,242.283c0,133.592,108.686,242.283,242.281,242.283    c133.594,0,242.278-108.691,242.278-242.283C484.562,108.689,375.881,0,242.285,0z M242.285,425.027    c-100.764,0-182.744-81.979-182.744-182.744c0-100.766,81.98-182.742,182.744-182.742s182.745,81.976,182.745,182.742    C425.029,343.049,343.049,425.027,242.285,425.027z', { scaleX: .03, scaleY: .03, left: ui.offset.left - $('#leftpanel').width() + 7, top: ui.offset.top - this.bottomcanvas._offset.top + 19, typename: 'bottomline', belongsto: belongto });
          let outline = new fabric.Path('M360.342,216.266L219.373,113.882c-9.783-7.106-22.723-8.121-33.498-2.63c-10.771,5.49-17.556,16.559-17.556,28.65V344.67    c0,12.092,6.784,23.158,17.556,28.646c4.61,2.348,9.611,3.506,14.6,3.506c6.666,0,13.301-2.07,18.898-6.138l140.969-102.383    c8.33-6.047,13.256-15.719,13.256-26.018C373.598,231.988,368.672,222.312,360.342,216.266z M242.285,0C108.688,0,0.004,108.689,0.004,242.283c0,133.592,108.686,242.283,242.281,242.283    c133.594,0,242.278-108.691,242.278-242.283C484.562,108.689,375.881,0,242.285,0z M242.285,425.027    c-100.764,0-182.744-81.979-182.744-182.744c0-100.766,81.98-182.742,182.744-182.742s182.745,81.976,182.745,182.742    C425.029,343.049,343.049,425.027,242.285,425.027z', { scaleX: .03, scaleY: .03, left: ui.offset.left - $('#leftpanel').width() + 53.5, top: ui.offset.top - this.bottomcanvas._offset.top + 8, typename: 'outline', belongsto: belongto });


          let subOperator = new fabric.IText('-', {
            left: bottomline.left + 20,
            top: ui.offset.top - this.bottomcanvas._offset.top - 17,
            fontFamily: 'arial',
            fill: '#3c1361',
            fontSize: 50,
            typename: 'operator',
            belongsto: belongto
          });
          let rect = new fabric.Rect({
            left: ui.offset.left - $('#leftpanel').width() + 22,
            top: ui.offset.top - this.bottomcanvas._offset.top,
            originX: 'left',
            originY: 'top',
            width: 30,
            height: 30,
            fill: 'transparent',
            border: 'black',
            strokeWidth: .9,
            stroke: "black",
            belongsto: belongto
          });


          this.bottomcanvas.add(subOperator)
          this.bottomcanvas.add(rect);
          this.bottomcanvas.add(topline);
          this.bottomcanvas.add(bottomline);
          this.bottomcanvas.add(outline);
          // this.bottomcanvas.add(outputline);

        }

        else if ($(ui.draggable).hasClass("keys")) {
          let mappers = this.bottomcanvas.getObjects().filter(x => x.typename != null && x.typename.indexOf('mapper') > -1)
          let mapping = false;
          let mapper;

          console.log(ui.draggable[0])
          for (let k = 0; k < mappers.length; k++) {
            if (Math.abs(ui.offset.left - $('#leftpanel').width() - mappers[k].left + 10) < 50) {
              mappers[k].column = ui.draggable[0].innerText;
              mapper = mappers[k];
              if (mappers[k].leftitem != null) {
                mappers[k].leftitem.column = ui.draggable[0].innerText;
              }
              mapping = true
            }
          }
          if (mapping == true) {
            if (mapper._objects == null || mapper._objects[0] == null || mapper._objects[1] == null) { return }
            let leftitems = mapper._objects[0].items.map(a => parseInt(a.value));
            let rightitems = mapper._objects[1].items.map(a => a.value);
            let colVal = d3.scaleLinear().domain(leftitems).range(rightitems)
            let evaluatable = source.innerText;
            for (let i = 0; i < this.keys.length; i++) {
              evaluatable = evaluatable.replace(new RegExp(this.keys[i], 'g'), 'parseFloat(this.rowData[0]["' + this.keys[i] + '"])');
            }
            evaluatable = '(' + evaluatable + ')'

            let color = colVal(parseInt(eval(evaluatable)))
            color = '#' + color.match(/\d+/g).map(function (x) {
              x = parseInt(x).toString(16);
              return (x.length == 1) ? "0" + x : x;
            }).join("");
            mapper.rightitem.fill = color;
            this.bottomcanvas.renderAll();
          }
          if (mapping == false) {
            let belongto = 'key ' + this.bottomcanvas.getObjects().filter(x => x.typename == 'outputport' && x.belongsto != null && x.belongsto.indexOf('key') > -1).length;
            // let plusoperators = this.bottomcanvas.getObjects().filter(x => x.text != null && x.text == '+')
            // for (let k = 0; k < plusoperators.length; k++) {
            //   let plustopline = plusoperators[k]._objects.find(x => x.typename != null && x.typename == 'topline')
            //   let plusbottomline = plusoperators[k]._objects.find(x => x.typename != null && x.typename == 'bottomline')
            let a = new fabric.Rect({
              left: ui.offset.left - $('#leftpanel').width(),
              top: ui.offset.top - this.bottomcanvas._offset.top,
              originX: 'left',
              originY: 'top',
              width: $(ui.draggable)[0].offsetWidth,
              height: $(ui.draggable)[0].offsetHeight,
              fill: '#460073',
              transparentCorners: false,
              belongsto: belongto, groupto: belongto, selectable: false
            })
            let b = new fabric.IText(ui.draggable[0].innerText, {
              left: ui.offset.left - $('#leftpanel').width() + 10,
              top: ui.offset.top - this.bottomcanvas._offset.top + 10,
              originX: 'left',
              originY: 'top',
              fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
              fill: 'white',
              fontSize: 13,
              belongsto: belongto, groupto: belongto, selectable: false
            })
            let c = new fabric.Circle({
              left: ui.offset.left - $('#leftpanel').width() + a.width,
              top: ui.offset.top - this.bottomcanvas._offset.top + 8,
              originX: 'left',
              originY: 'top',
              radius: 7,
              fill: 'black',
              typename: 'outputport',
              belongsto: belongto, groupto: belongto, selectable: false
            })

            c.fieldName = ui.draggable[0].innerText;
            this.bottomcanvas.add(a)
            this.bottomcanvas.add(b)
            this.bottomcanvas.add(c)


            /* if (Math.abs(ui.offset.left - ($('#leftpanel').width() + plustopline.originalLeft) + 50) < 50 && Math.abs(ui.offset.top - this.bottomcanvas._offset.top - plustopline.originalTop) < 20) {
               a.left = plustopline.originalLeft - $('#leftpanel').width() + 50
               a.top = plustopline.originalTop - 40
               b.left = plustopline.originalLeft - $('#leftpanel').width() + 60
               b.top = plustopline.originalTop - 35
               plusoperators[k].topfieldColumn = ui.draggable[0].innerText;
               plusoperators[k].topfield = 'topfield'
               this.bottomcanvas.add(element)
             }

             if (Math.abs(ui.offset.left - ($('#leftpanel').width() + plusbottomline.originalLeft) + 50) < 50 && Math.abs(ui.offset.top - this.bottomcanvas._offset.top - plusbottomline.originalTop) < 20) {
               a.left = plusbottomline.originalLeft - $('#leftpanel').width() + 50
               a.top = plusbottomline.originalTop - 40
               b.left = plusbottomline.originalLeft - $('#leftpanel').width() + 60
               b.top = plusbottomline.originalTop - 35
               plusoperators[k].bottomfield = 'bottomfield'
               plusoperators[k].bottomfieldColumn = ui.draggable[0].innerText;
               this.bottomcanvas.add(element)
             }*/

            /*if (plusoperators[k].topfield != null && plusoperators[k].bottomfield != null) {
              let outputrect = new fabric.Rect({
                left: plusoperators[k].left + 150,
                top: plusoperators[k].top + 10,
                originX: 'left',
                originY: 'top',
                width: $(ui.draggable)[0].offsetWidth,
                fill: '#460073',
                transparentCorners: false
              })
              let outputrectext = new fabric.IText(plusoperators[k].topfieldColumn + '\n' + plusoperators[k].text + '\n' + plusoperators[k].bottomfieldColumn, {
                left: plusoperators[k].left + 155,
                top: plusoperators[k].top + 12,
                originX: 'left',
                originY: 'top',
                fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
                fill: 'white',
                fontSize: 13,
                editable: false
              })
              outputrect.height = outputrectext.text.split('+').length * 30;
              let outputrectobjs: any = [outputrect, outputrectext];
              let outputrectelement = new fabric.Group(outputrectobjs);
              outputrectelement.typename = 'outputrect'
              outputrectelement.selectable = false
              this.bottomcanvas.add(outputrectelement)
            }*/
            this.bottomcanvas.renderAll();
            //  }

          }
        }
      }
    });
    $("#maincanvas").droppable({
      accept: "#rectanglePrototype,#circlePrototype,#squarePrototype,#mapperWidget,#pathMarkPrototype,#ellipsePrototype",
      drop: (ev, ui) => {
        let shape;
        if (ui.draggable[0].id == 'rectanglePrototype' || ui.draggable[0].id == 'pathMarkPrototype') {
          shape = new fabric.Rect({
            left: ui.offset.left - $('#leftpanel').width() + 50,
            top: ui.offset.top - 70,
            originX: 'left',
            originY: 'top',
            width: 30,
            height: 50,
            angle: 0,
            fill: '#460073',
            transparentCorners: false
          });
          shape.typename = 'Rectangle'
          shape.ID = 'Rectangle ' + (this.canvas.getObjects().filter(x => x.typename == 'Rectangle').length + 1);
        }
        if (ui.draggable[0].id == 'squarePrototype') {
          shape = new fabric.Rect({
            left: ui.offset.left - $('#leftpanel').width() + 50,
            top: ui.offset.top - 70,
            originX: 'left',
            originY: 'top',
            width: 30,
            height: 30,
            angle: 0,
            fill: '#460073',
            transparentCorners: false
          });
          shape.typename = 'Square'
          shape.ID = 'Square ' + (this.canvas.getObjects().filter(x => x.typename == 'Square').length + 1);
        }
        if (ui.draggable[0].id == 'circlePrototype') {
          shape = new fabric.Circle({
            left: ui.offset.left - $('#leftpanel').width() + 50,
            top: ui.offset.top - 70,
            radius: 20,
            fill: '#460073',
          });
          shape.typename = 'Circle'
          this.radius = shape.radius;
          shape.ID = 'Circle ' + (this.canvas.getObjects().filter(x => x.typename == 'Circle').length + 1);
        }
        if (ui.draggable[0].id == 'ellipsePrototype') {
          shape = new fabric.Ellipse({
            left: ui.offset.left - $('#leftpanel').width() + 50,
            top: ui.offset.top - 70,
            fill: '#460073',
            rx: 20,
            ry: 10,
            angle: 0,
          });
          shape.typename = 'Ellipse'
          this.radiusx = shape.rx;
          this.radiusy = shape.ry
          shape.ID = 'Ellipse ' + (this.canvas.getObjects().filter(x => x.typename == 'Ellipse').length + 1);
        }
        if (ui.draggable[0].id == 'pathMarkPrototype') {
          shape.width = 0;
          shape.typename = 'Line'
          shape.angle = -90;
          shape.ID = 'Line ' + (this.canvas.getObjects().filter(x => x.typename == 'Line').length + 1);
        }
        this.canvas.add(shape);
        this.canvas.setActiveObject(shape);
      }
    });
    this.canvas.on('object:moving', (event) => {
      this.xposition = event.target.left - this.graph.left;
      this.yposition = this.graph.top + (this.graph.height * this.graph.scaleY) - event.target.top - (event.target.height * event.target.scaleY);
      this.selectedObject.xpositionColumn = null
      this.selectedObject.ypositionColumn = null
      this.selectedObject.mappedxPosition = '';
      this.selectedObject.mappedyPosition = '';
    });
    this.canvas.on('object:scaling', (event) => {
      this.length = event.target.getHeight();
      this.width = event.target.getWidth();
      this.area = this.length * this.width;
    });
  }

  changeselection() {
    this.selection = !this.selection;
    this.canvas.deactivateAll().renderAll();
  }

  cloneObject(o) {
    function F() { }
    F.prototype = o;
    return new F();
  }

  calculateMapping(item) {
    this.calculation = ''

    this.calculateOperators(item.children[0])
    this.calculation += item.text;
    this.calculateOperators(item.children[1])

    return this.calculation;
  }

  calculation: string;
  calculateOperators(child) {
    if (child.typename == "field") {
      this.calculation += child.fieldName;
    }
    else {
      this.calculateOperators(child.children[0])
      this.calculation += child.text;
      this.calculateOperators(child.children[1])
    }
  }


  length: any;
  width: any;
  area: number;

  drawgraph(canvas, scale = 1, select = false, left = 100, top = 50) {
    var xaxis = new fabric.Line([250, 50, 250, 200], {
      stroke: 'black'
    });
    var yaxis = new fabric.Line([250, 200, 450, 200], {
      stroke: 'black'
    });

    var xtriangle = new fabric.Triangle({
      width: 10,
      height: 15,
      fill: 'black',
      left: 450,
      top: 195,
      angle: 90
    });

    var ytriangle = new fabric.Triangle({
      width: 10,
      height: 15,
      fill: 'black',
      left: 245,
      top: 50,
    });

    let objs = [xaxis, yaxis, xtriangle, ytriangle];
    this.graph = new fabric.Group(objs);
    this.graph.selectable = select;
    this.graph.scaleX = scale
    this.graph.scaleY = scale
    this.graph.left = left;
    this.graph.top = top;
    this.graph.typename = 'Graph'
    this.graph.ID = 'Graph ' + (canvas.getObjects().filter(a => a.ID != null && a.typename == 'Graph').length + 1)
    this.graphs.push(this.graph)

    canvas.add(this.graph);
    canvas.renderAll();
  }
  graphs: any = [];
  graph: any;

  loaddata(index) {
    if (canvas) canvas.clear();
    setTimeout(() => {
      let file = { name: 'row.csv' };
      let header = '';
      let firstrow = '';
      Object.keys(this.dataService.rowdata[index]).forEach((d, i) => {
        if (sessionStorage.getItem('selectedlabel') != d) {
          header += d + ',';
          firstrow += this.dataService.rowdata[0][d] + ',';
        }
      })
      header = header.substring(0, header.length - 1);
      firstrow = firstrow.substring(0, firstrow.length - 1);

      let event = { target: { result: header + '\n' + firstrow } };
      console.log(event)
      setTimeout(() => {
        onDataFileReadComplete(event, file);
      }, 500);
      this.rowData = this.dataService.rowdata;
    }, 500);

  }

  experimentVisible = false;
  navigateML() {
    this.dataService.canvasCollection = [];
    this.dataService.validationCollection = [];
    for (let i = 0; i < this.rowData.length; i++) {
      let canvas = <HTMLCanvasElement>document.getElementById('canvas' + i);
      let newCanvas = <HTMLCanvasElement>canvas.cloneNode(true);
      let ctx = newCanvas.getContext('2d');

      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, newCanvas.width, newCanvas.height);
      ctx.drawImage(canvas, 0, 0);

      this.dataService.canvasCollection
        .push({
          data: newCanvas.toDataURL("image/png"), label: this.rowData[i][Object.keys(this.rowData[0])[Object.keys(this.rowData[0]).length - 1]], datasetSelection: 'train'
        })
    }
    for (let i = 0; i < this.validationdata.length; i++) {
      let canvas = <HTMLCanvasElement>document.getElementById('valcanvas' + i);
      let newCanvas = <HTMLCanvasElement>canvas.cloneNode(true);
      let ctx = newCanvas.getContext('2d');

      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, newCanvas.width, newCanvas.height);
      ctx.drawImage(canvas, 0, 0);

      this.dataService.validationCollection
        .push({
          data: newCanvas
            .toDataURL("image/png"), label: this.validationdata[i][Object.keys(this.validationdata[0])[Object.keys(this.validationdata[0]).length - 1]], datasetSelection: 'validation'
        })
    }
    ++this.experiment;
    sessionStorage.setItem('canvasCollection&e' + this.experiment, JSON.stringify(this.dataService.canvasCollection))
    localStorage.setItem('validationCollection', JSON.stringify(this.dataService.validationCollection))
    window.open('/drawVisual?experiment=true&etab=' + this.experiment);

  }

  experiment: number = 0;

  backToViz() {
    this.experimentVisible = false;
  }
}


