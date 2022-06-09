import { AfterViewInit, Component, ElementRef, OnInit, ViewChild, ɵCREATE_ATTRIBUTE_DECORATOR__POST_R3__ } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DataService } from '../services/dataservice/data.service';
import * as d3 from 'd3';

declare const fabric: any;
declare const Hammer: any;
declare const $;
declare const checkForRetinaDisplay: Function;
declare const canvasDropFunction: Function;
declare var canvas: any;
declare const hideOpenTooltips: Function;
declare const displaywheel: Function;
declare const canvasDoubleTap: Function;
declare const gestureSetEnabled: Function;
declare const canvasPressEvent: Function;
declare const getConnectorsCrossedByLine: Function;
declare const bindCanvasDefaultEvents: Function;
declare const zoomIn: Function;
declare const zoomOut: Function;
declare const resetZoom: Function;
declare const adjustCanvasDimensions: Function;
declare const addEvent: Function;
declare const cancel: Function;
declare const getCanvasCoordinates: Function;
declare const addVisualElementFromHTML: Function;
declare const applyActiveMenuButtonStyle: Function;
declare const activatePanningMode: Function;
declare var managerr;
declare const onDataFileReadComplete: Function;
declare const createSampleExtractorFromPath: Function;

@Component({
  selector: 'app-draw-visual',
  templateUrl: './draw-visual.component.html',
  styleUrls: ['./draw-visual.component.css']
})
export class DrawVisualComponent implements OnInit, AfterViewInit {

  markToolboxVisible: boolean = false;
  operatorToolboxVisible: boolean = false;
  valuesToolboxVisible: boolean = false;
  lengthTitle: any = '';
  xPositionTitle: any = '';
  yPositionTitle: any = '';
  widthTitle: any = '';
  areaTitle: any = '';
  keybg: any = [];
  sideTitle: string = '';
  radiusTitle: string = ''
  rotation: any;
    midScroll: boolean;
  constructor(private route: ActivatedRoute, private dataService: DataService, private router: Router) { }
  public selection: boolean;


  crop() {
    console.log(canvas.getObjects());
    let rect = canvas.getObjects().find(a => a.typename == 'selectionrect')
    let x = rect.left - canvas.left;
    let y = rect.top - canvas.top;

    let scale = 1;
    x *= 1 / scale;
    y *= 1 / scale;

    let width = rect.width * 1 / scale;
    let heigh = rect.height * 1 / scale;

    canvas.clipTo = function (ctx) {
      ctx.rect(rect.left, rect.top, rect.width, rect.height);
    }
  }
  mode: string = 'single';
  recordedEvents: any;
  public rowData: any;
  public showrows = true;
  highlight: boolean[] = [];
  keys: string[] = [];
  keyid: string[] = [];
  canvas: any;
  xposition: number;
  yposition: number;
  color: string;
  bottomcanvas: any;

  ngOnInit(): void {
    if (sessionStorage.getItem('rowdata') != null) {
      this.rowData = this.dataService.rowdata = JSON.parse(sessionStorage.getItem('rowdata'));
      Object.keys(this.rowData[0]).forEach((element) => {
        this.keys.push(element);
        this.keyid.push(element);
        this.keybg.push('#460073')
      })
      this.rowData.forEach(a => { this.highlight.push(false) })
    }
    this.canvas = new fabric.Canvas("maincanvas");
    this.canvas.setDimensions({ width: 850, height: 235 });
    this.canvas.typename = 'canvas'

    this.bottomcanvas = new fabric.Canvas("bottomcanvas");
    this.bottomcanvas.setDimensions({ width: 850, height: 315 });

    this.drawgraph(this.canvas);

    //this.loaddata(0);
    this.loadUndoRedo();
    this.loadSelector();

  }
  loadSelector() {
    let isDown, origX, origY, rect;
    this.canvas.on('mouse:down', o => {

      if (this.selection == true && rect == null) {
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
          transparentCorners: false
        });

        this.canvas.add(rect);
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
        //(document.getElementById('selectionWidth') as any).value = rect.width;
        //(#document.getElementById('selectionHeight') as any).value = rect.height;
      }
    });

    this.canvas.on('mouse:up', (o) => {
      if (this.selection == true) {
        isDown = false;
        this.selection = false;
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
    this.redo_stack.push(this.undo_stack.pop());
    let previous_state = this.undo_stack[this.undo_stack.length - 1];
    if (previous_state == null) {
      previous_state = '{}';
      this.drawgraph(this.canvas);
    }
    this.canvas.loadFromJSON(previous_state, () => {
      this.canvas.renderAll();
    })
  }


  clearAll(canvas) {
    if (canvas.typename == 'bottomcanvas') {
      this.bottomcanvases.push(this.bottomcanvas)
    }
    for (let i = canvas.getObjects().length; i >= 0; i--) {
      canvas.remove(canvas.getObjects()[i]);
    }
    canvas.renderAll()
    //canvas.getObjects().forEach((obj) => {
    // canvas.remove(obj);
    //canvas.renderAll();
    //});
    if (canvas.typename == 'canvas') {
      this.drawgraph(canvas);
    }
  }

  canvasMode: string = 'Single';
  onCanvasMode(val) {
    if (val == 'Collective') {
      this.canvas.getObjects().forEach((obj) => {

        if (obj.typename == 'Rectangle') {
          for (let i = 0; i < this.rowData.length; i++) {
            let value = i;
            this.canvas.add(new fabric.Rect({
              left: obj.left,
              top: obj.top,
              originX: 'left',
              originY: 'top',
              width: eval(obj.widthColumn),
              height: eval(obj.heightColumn),
              angle: 0,
              fill: 'transparent',
              transparentCorners: false,
              typename: 'duplicate'
            }));
          }
        }
        else if (obj.typename == 'Square') {
          for (let i = 0; i < this.rowData.length; i++) {
            let value = i;
            this.canvas.add(new fabric.Rect({
              left: obj.left,
              top: obj.top,
              originX: 'left',
              originY: 'top',
              width: eval(obj.widthColumn),
              height: eval(obj.widthColumn),
              angle: 0,
              fill: 'transparent',
              transparentCorners: false,
              typename: 'duplicate'
            }));
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
  rightcanvases: any[]=[];
  applyChanges() {
    let selectionrect = this.canvas.getObjects().find(a => a.typename == 'selectionrect')
    console.log(selectionrect.left)

    for (let i = 0; i < this.rowData.length; i++) {
      let rightcanvas = new fabric.Canvas("canvas" + i);
      rightcanvas.setDimensions({ width: selectionrect.width, height: selectionrect.height });

      let canvasObjects = this.canvas.getObjects();
      for (let j = 0; j < canvasObjects.length; j++) {
        let obj;
        if (canvasObjects[j].typename == 'Rectangle' || canvasObjects[j].typename == 'Square') {
          let height, width;
          if (canvasObjects[j].heightColumn == null) {
            height = canvasObjects[j].height * canvasObjects[j].scaleY
          }
          else {
            let value = i
            height = eval(canvasObjects[j].heightColumn)
          }
          if (canvasObjects[j].widthColumn == null) {
            width = canvasObjects[j].width * canvasObjects[j].scaleX
          }
          else {
            let value = i
            width = eval(canvasObjects[j].widthColumn)
          }
          obj = new fabric.Rect({
            left: canvasObjects[j].left - selectionrect.left, top: canvasObjects[j].top - selectionrect.top,
            originX: 'left', originY: 'top', width: width, height: height, fill: '#460073'
          })
          rightcanvas.add(obj);
        }
        if (canvasObjects[j].mappername != null) {
          let outputport = this.bottomcanvas.getObjects().find(x => x.belongsto == canvasObjects[j].mappername && x.typename == 'outputport')
          let leftitems = outputport.leftitems.map(a => parseInt(a.value));
          let rightitems = outputport.rightitems.map(a => a.value);
          let colVal = d3.scaleLinear().domain([d3.min(leftitems), d3.max(leftitems)]).range(rightitems)
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
  }


  changeColor(value) {
    this.selectedObject.fill = value
    this.selectedObject.border = value
    this.canvas.renderAll();
  }

  rotationOperand: any = '10';
  rotationOperator: any = '*';

  changeRotation(value) {
    this.selectedObject.angle = eval(value + this.rotationOperator + this.rotationOperand);
    this.canvas.renderAll();
  }

  changex(value) {
    this.selectedObject.left = eval(parseFloat(value) + this.xPositionOperator + this.xPositionOperand) + this.graph.left;
    this.xPositionTitle = '';
    this.canvas.renderAll();
  }

  changey(value) {
    this.selectedObject.top = eval(parseFloat(value) + this.yPositionOperator + this.yPositionOperand) + this.graph.top + this.graph.height - this.yposition - (this.selectedObject.height * this.selectedObject.scaleY);
    //this.yposition = this.graph.top + this.graph.height - this.selectedObject.top - (this.selectedObject.height * this.selectedObject.scaleY);
    this.yPositionTitle = '';
    this.canvas.renderAll();
  }

  changelength(value) {
    this.selectedObject.height = eval(parseFloat(value) + this.lengthOperator + this.lengthOperand);
    this.selectedObject.heightColumn = null
    this.lengthTitle = ''
    this.canvas.renderAll();
    this.area = this.selectedObject.height * this.selectedObject.width
  }

  changewidth(value) {
    this.selectedObject.width = eval(parseFloat(value) + this.widthOperator + this.widthOperand);
    this.selectedObject.widthColumn = null
    this.widthTitle = ''
    this.canvas.renderAll();
    this.area = this.selectedObject.height * this.selectedObject.width
  }

  changeside(value) {
    this.selectedObject.width = eval(parseFloat(value) + this.sideOperator + this.sideOperand)
    this.selectedObject.height = parseFloat(value);
    this.sideTitle = ''
    this.area = this.selectedObject.height * this.selectedObject.width
    this.canvas.renderAll();
  }


  changeradius(value) {
    this.selectedObject.radius = eval(parseFloat(value) + this.radiusOperator + this.radiusOperand)
    this.area = 3.14 * this.selectedObject.radius * this.selectedObject.radius
    this.radiusTitle = ''
    this.canvas.renderAll();
  }

  changeRow(value) {
    this.rowIndex = value;
    this.canvas.getObjects().forEach(obj => {
      if (obj.heightColumn != null && obj.widthColumn != null) {
        obj.height = eval(obj.heightColumn);
        obj.width = eval(obj.widthColumn);
      }
      this.canvas.renderAll()
    })
    let obj = this.canvas.getActiveObject();
    this.length = eval(obj.heightColumn.split('*')[0].split('/')[0])
    this.width = eval(obj.widthColumn.split('*')[0].split('/')[0])

    //alert(JSON.stringify(this.rowData[value]))
  }

  changeGraph(val) {
    this.graph = this.canvas.getObjects().find(x => x.ID == val);
    this.selectedObject.graphname = val;
    this.xposition = this.selectedObject.left - this.graph.left;
    this.yposition = this.graph.top + this.graph.height - this.selectedObject.top - (this.selectedObject.height * this.selectedObject.scaleY);
  }

  selectedObject: any;
  positionX: number;
  positionY: number;
  visibility: any;
  radius: any;
  side: any;
  widthOperator: any = '*';
  widthOperand: any = 10;
  lengthOperator: any = '*';
  lengthOperand: any = 10;
  rowIndex: number = 0;
  sideOperator: any = '*';
  sideOperand: any = 10;
  radiusOperator: any = '*';
  radiusOperand: any = 10;
  rotationTitle: string = ''
  bottomcanvases: any = [];
  areaOperator: any = '*';
  areaOperand: any = 10;
  xPositionOperator: any = '*';
  xPositionOperand: any = 10;
  yPositionOperator: any = '*';
  yPositionOperand: any = 10;
  @ViewChild('keytab', { read: ElementRef }) public keytab: ElementRef<any>;

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
        if (this.rotationOperator == '/') {
          this.rotation = (e.target.angle) * this.rotationOperand;
        }
        else if (this.rotationOperator == '*') {
          this.rotation = e.target.angle / this.rotationOperand
        }
        if (this.selectedObject.typename == 'Rectangle') {
          this.selectedObject.graphname = this.graph.ID;
          this.xposition = this.selectedObject.left - this.graph.left;
          this.yposition = this.graph.top + this.graph.height - this.selectedObject.top - this.selectedObject.height;

          if (this.selectedObject.fill.indexOf('#') > -1) {
            this.color = this.selectedObject.fill
          }
          else {
            this.color = '#' + this.selectedObject.fill.match(/\d+/g).map(function (x) {
              x = parseInt(x).toString(16);
              return (x.length == 1) ? "0" + x : x;
            }).join("");
          }
          let obj = this.canvas.getActiveObject();
          if (obj.heightColumn != null) {
            this.length = eval(obj.heightColumn.split('*')[0].split('/')[0])
            this.lengthTitle = obj.mappedheight;
          }
          else {
            if (this.lengthOperator == '*') {
              this.length = this.selectedObject.height / this.lengthOperand;
            }
            else if (this.lengthOperator == '/') {
              this.length = this.selectedObject.height * this.lengthOperand;
            }
          }
          if (obj.widthColumn != null) {
            this.width = eval(obj.widthColumn.split('*')[0].split('/')[0])
            this.widthTitle = obj.mappedwidth;
          }
          else {
            if (this.widthOperator == '*') {
              this.width = this.selectedObject.width / this.widthOperand;
            }
            else if (this.widthOperator == '/') {
              this.width = this.selectedObject.width * this.widthOperand;
            }
          }
          this.area = this.width * this.length;
          this.areaOperand = this.widthOperand * this.lengthOperand;
          this.visibility = { 'xposition': true, 'yposition': true, 'color': true, 'length': true, 'width': true, 'side': false, 'radius': false, 'area': true, 'rotation': true }
        }
        else if (this.selectedObject.typename == 'Graph') {
          this.xposition = this.selectedObject.left;
          this.yposition = this.selectedObject.top;
          this.visibility = { 'xposition': true, 'yposition': true, 'color': false, 'length': false, 'width': false, 'side': false, 'radius': false, 'area': false, 'rotation': true }
        }
        else if (this.selectedObject.typename == 'Square') {
          this.xposition = this.selectedObject.left;
          this.yposition = this.selectedObject.top;
          this.color = this.selectedObject.fill;
          let obj = this.canvas.getActiveObject();
          if (obj.heightColumn != null) {
            this.side = eval(obj.heightColumn.split('*')[0].split('/')[0])
          }
          else {
            if (this.sideOperator == '*') {
              this.side = this.selectedObject.width / this.sideOperand;
            }
            else if (this.sideOperator == '/') {
              this.side = this.selectedObject.width * this.sideOperand;
            }
          }
          this.area = this.selectedObject.width * this.selectedObject.width;
          this.visibility = { 'xposition': true, 'yposition': true, 'color': true, 'length': false, 'width': false, 'side': true, 'radius': false, 'area': true, 'rotation': true }
        }
        else if (this.selectedObject.typename == 'Circle') {
          this.xposition = this.selectedObject.left;
          this.yposition = this.selectedObject.top;
          this.color = this.selectedObject.fill;
          let obj = this.canvas.getActiveObject();
          if (obj.heightColumn != null) {
            this.radius = eval(obj.radiusColumn.split('*')[0].split('/')[0])
          }
          else {
            if (this.radiusOperator == '*') {
              this.radius = this.selectedObject.radius / this.radiusOperand;
            }
            else if (this.sideOperator == '/') {
              this.radius = this.selectedObject.radius * this.radiusOperand;
            }
          }
          //this.radius = this.selectedObject.radius;
          this.area = 3.14 * this.selectedObject.radius * this.selectedObject.radius;
          this.visibility = { 'xposition': true, 'yposition': true, 'color': true, 'length': false, 'width': false, 'side': false, 'radius': true, 'area': true, 'rotation': true }
        }
        setTimeout(() => { this.draganddropFunction(); }, 1000)

      },
      'object:rotating': (e) => {
        if (this.rotationOperator == '/')
          this.rotation = (e.target.angle) * this.rotationOperand;
        else if (this.rotationOperator == '*')
          this.rotation = e.target.angle / this.rotationOperand
      }

    });
    let val = 0
    let source;
    let isoperatorselected;
    let ismapperselected;
    let iskeyselected;
    let operator;
    let ismidmapperselected;
    let ismidoperatorselected;
    this.bottomcanvas.on("mouse:down", (event) => {
      let pointer = this.bottomcanvas.getPointer(event.e);
      this.positionX = pointer.x;
      this.positionY = pointer.y;
      console.log(event)
      
      if (event.target != null && event.target.typename == 'outputport') {
        isoperatorselected = true;
        ismapperselected = false;
        iskeyselected = false;
        ismidmapperselected = false;
        ismidoperatorselected = false;
        source = event.target
      }
      else if (event.target != null && event.target.typename == 'firstrightitem') {
        isoperatorselected = false;
        ismapperselected = true;
        ismidmapperselected = false;
        ismidoperatorselected = false;
        iskeyselected = false;
        source = event.target.parent
      }
      else if (event.target != null && event.target.typename == 'key') {
        isoperatorselected = false;
        ismapperselected = false;
        ismidmapperselected = false;
        ismidoperatorselected = false;
        iskeyselected = true;
        source = event.target;
      }
      else {
        isoperatorselected = false;
        ismapperselected = false;
        ismidmapperselected = false;
        ismidoperatorselected = false;
        iskeyselected = false;
        source = event.target
      }
    });

    //document.addEventListener("mousemove", (event) => {
    //  if (isoperatorselected) {
    //    operator[0].style.left = (event.pageX)+20 + 'px';
    //    operator[0].style.top = (event.pageY)+20 + 'px';
    //  }
    //})

    $("#mapperPopup").focusout(function () {
      $('#mapperPopup').css('display', 'none')
    })

    document.addEventListener("mousedown", (evnt: any) => {
      if ($(evnt.srcElement).siblings() != null && $(evnt.srcElement).siblings()[0] != null && $(evnt.srcElement).siblings()[0].value != null && $(evnt.srcElement).siblings()[0].value.indexOf('mapper') > -1) {
        ismidmapperselected = true;
        isoperatorselected = false;
        ismapperselected = false;
        ismidoperatorselected = false;
        source = evnt;
      }
      else if ($(evnt.srcElement).siblings() != null && $(evnt.srcElement).siblings()[0] != null && $(evnt.srcElement).siblings()[0].value != null && $(evnt.srcElement).siblings()[0].value.indexOf('operator') > -1) {
        ismidmapperselected = false;
        isoperatorselected = false;
        ismapperselected = false;
        ismidoperatorselected = true;
        source = evnt;
      }
      else if (evnt.srcElement.className.indexOf('keys') > -1) {
        source = evnt.srcElement;
      }
    })

    document.addEventListener("mouseup", evnt => {
      //console.log(evnt)
      let target: any = evnt.target;
      let positionX = evnt.pageX;
      let positionY = evnt.pageY;
      //console.log(document.elementFromPoint(positionX, positionY))

      
      if (isoperatorselected && document.elementFromPoint(positionX, positionY).id == 'keytab') {

        let key = "idkey" + ($('#keytab')[0].children.length)
        let textkey = "idtextkey" + ($('#keytab')[0].children.length)
        let keyelement = $("<span id='" + key + "' ><input type='text' id='" + textkey + "' style='width:100px;display:inline-block;font-size: 14px;padding: 5px 10px;margin: 2px;display: inline - flex;color: #fff;background-color:#460073' value='" + source.value + "'/><input type='hidden' value='" + source.belongsto + "'/><input type='hidden' value='" + this.bottomcanvases.length + "'/></span>");
        $('#keytab').append(keyelement);
        setTimeout(() => {
          $('#' + key).draggable({
            cursorAt: { top: 18.5, left: 60 },
            cursor: 'none',
            scroll: false,
            helper: (event) => {
              return $("<div style='z-index: 100; margin-top: -1px; margin-left: 38px;'>" + this.keys[this.keys.length - 1] + "</div>");
            }
          });
          $('#' + key).on('dblclick', (a) => {
            let id = $(a.target).siblings()[1].value
            this.bottomcanvas.loadFromJSON(this.bottomcanvases[id], () => {
              this.bottomcanvas.renderAll();
            });
            for (let i = this.bottomcanvas.getObjects().length; i >= 0; i--) {
              this.bottomcanvas.remove(this.bottomcanvas.getObjects()[i]);
            }
            let loadedval = JSON.parse(this.bottomcanvases[id])
            for (let i = 0; i < loadedval.objects.length; i++) {
              this.bottomcanvas.add(loadedval[i])
            }
            this.bottomcanvas.renderAll()
          })

          $('#' + textkey).on('change', (a) => {
            let object = this.bottomcanvas.getObjects().find(b => b.typename == 'text' && b.value == $(a.target).siblings()[0].value)
            object.text = $(a.target).val();
            this.bottomcanvas.renderAll()
          })

        }, 1000)
        if (source.belongsto.indexOf('operator') > -1) {

          let line = new fabric.Line([source.left, source.top + source.radius, source.left + 50, source.top + source.radius], { stroke: 'black', selectable: false });
          let rect = new fabric.Rect({
            left: line.left + line.width, 
            top: line.top - 15,
            originX: 'left',
            originY: 'top',
            width: 80,
            height: 30,
            fill: '#460073',
            transparentCorners: false, selectable: false,
            belongsto: source.belongsto,
          })
          let text = new fabric.IText(source.value, {
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
          })
          this.bottomcanvas.add(line)
          this.bottomcanvas.add(rect)
          this.bottomcanvas.add(text)
        }
        if (source.belongsto.indexOf('mapper') > -1) {
          let item = this.bottomcanvas.getObjects().find(x => x.belongsto == source.belongsto && x.typename == 'outputport')

          let leftitems = item.leftitems.map(a => parseInt(a.value));
          let rightitems = item.rightitems.map(a => a.value);
          let colVal = d3.scaleLinear().domain([d3.min(leftitems), d3.max(leftitems)]).range(rightitems)
          let evaluatable = item.column;
          for (let i = 0; i < this.keys.length; i++) {
            evaluatable = evaluatable.replace(new RegExp(this.keys[i], 'g'), 'parseFloat(this.rowData[0]["' + this.keys[i] + '"])');
          }
          evaluatable = '(' + evaluatable + ')'

          let color = colVal(parseInt(eval(evaluatable)))
          color = '#' + color.match(/\d+/g).map(function (x) {
            x = parseInt(x).toString(16);
            return (x.length == 1) ? "0" + x : x;
          }).join("");

          let outputport = this.bottomcanvas.getObjects().find(x => x.belongsto == source.belongsto && x.typename == 'outputport')
          outputport.fill = color;
          let a = new fabric.Rect({
            left: outputport.left + 60,
            top: outputport.top,
            originX: 'left',
            originY: 'top',
            width: 100,
            height: 30,
            fill: '#460073',
            transparentCorners: false, selectable: false
          })
          let b = new fabric.IText(source.value, {
            left: outputport.left + 75,
            top: outputport.top + 5,
            originX: 'left',
            originY: 'top',
            fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
            fill: 'white',
            fontSize: 13,
            selectable: false,
          })
         
          let line = new fabric.Line([outputport.left + 20, outputport.top + 5, a.left, a.top + 5], { stroke: 'black', selectable: false });
          this.bottomcanvas.add(line);
          this.bottomcanvas.add(a)
          this.bottomcanvas.add(b)
        }

      }
      else if (ismapperselected && target.id == 'keytab') {
        let leftitems = source._objects[0].items.map(a => parseInt(a.value));
        let rightitems = source._objects[1].items.map(a => a.value);
        let colVal = d3.scaleLinear().domain([d3.min(leftitems), d3.max(leftitems)]).range(rightitems)
        let evaluatable = source.column;
        for (let i = 0; i < this.keys.length; i++) {
          evaluatable = evaluatable.replace(new RegExp(this.keys[i], 'g'), 'parseFloat(this.rowData[0]["' + this.keys[i] + '"])');
        }
        evaluatable = '(' + evaluatable + ')'

        let color = colVal(parseInt(eval(evaluatable)))
        color = '#' + color.match(/\d+/g).map(function (x) {
          x = parseInt(x).toString(16);
          return (x.length == 1) ? "0" + x : x;
        }).join("");
        let key = "idkey" + ($('#keytab')[0].children.length)

        let colorelement = $("<div class='colormidpanel' id='" + key + "'  style='display:inline-block;font-size: 14px;padding: 5px 10px;margin: 2px;display: inline - flex;color: #fff;background-color:" + color + "'>" + color + "<input type='hidden' value='" + color + "'><input type='hidden' value='" + this.bottomcanvases.length + "'></div>");
        $('#keytab').append(colorelement);

        setTimeout(() => {
          $('#' + key).draggable({
            cursorAt: { top: 18.5, left: 60 },
            cursor: 'none',
            scroll: false,
            helper: (event) => {
              return $("<div style='z-index: 100; margin-top: -1px; margin-left: 38px;'>" + this.keys[this.keys.length - 1] + "</div>");
            }
          });
          $('#' + key).on('click', (a) => {
            let id = a.target.children[1].value;
            //this.bottomcanvas.loadFromJSON(this.bottomcanvases[id], () => {
            //  this.bottomcanvas.renderAll();
            //});
            for (let i = this.bottomcanvas.getObjects().length; i >= 0; i--) {
              this.bottomcanvas.remove(this.bottomcanvas.getObjects()[i]);
            }
            let loadedval = JSON.parse(this.bottomcanvas[id])
            for (let i = 0; i < loadedval.length; i++) {
              this.bottomcanvas.push(loadedval[i])
            }
            this.bottomcanvas.renderAll()
          })
        }, 1000)
      }
      else if (ismidmapperselected && this.selectedObject != null) {
        this.selectedObject.mappername = $(source.srcElement).siblings()[0].value;
        this.selectedObject.bottomcanvasid = $(source.srcElement).siblings()[1].value;
       
        let outputport = this.bottomcanvas.getObjects().find(a => a.typename == 'outputport' && a.belongsto == $(source.srcElement).siblings()[0].value)
        this.selectedObject.fill = outputport.fill
        this.selectedObject.stroke = outputport.fill
        target.value = outputport.fill;
        this.canvas.renderAll()
      }
      else if (ismidoperatorselected && this.selectedObject != null) {
        let evaluatable = this.bottomcanvas.getObjects().find(x => x.typename == 'outputport' && x.belongsto == $(source.srcElement).siblings()[0].value).fieldName.replace("\n", "");
        if (target.id == 'length') {
          this.lengthTitle = evaluatable
          let value;
          for (let i = 0; i < this.keys.length; i++) {
            value = this.rowIndex;
            evaluatable = evaluatable.replace(new RegExp(this.keys[i], 'g'), 'parseFloat(this.rowData[value]["' + this.keys[i] + '"])');
          }
          evaluatable = '(' + evaluatable + ')'

          this.length = eval(evaluatable)
          target.value = this.length
          this.selectedObject.heightColumn = evaluatable + this.lengthOperator + this.lengthOperand;
          this.selectedObject.height = eval(evaluatable + this.lengthOperator + this.lengthOperand)
          this.canvas.renderAll()
        }
        else if (document.elementFromPoint(positionX, positionY).id == 'width') {
          let evaluatable = this.bottomcanvas.getObjects().find(x => x.typename == 'outputport' && x.belongsto == $(source.srcElement).siblings()[0].value).fieldName.replace("\n", "");
          this.widthTitle = evaluatable
          for (let i = 0; i < this.keys.length; i++) {
            evaluatable = evaluatable.replace(new RegExp(this.keys[i], 'g'), 'parseFloat(this.rowData[0]["' + this.keys[i] + '"])');
          }
          evaluatable = '(' + evaluatable + ')'
          this.width = eval(evaluatable)
          target.value = this.width
          this.selectedObject.widthColumn = evaluatable + this.widthOperator + this.widthOperand
          this.selectedObject.width = eval(evaluatable + this.widthOperator + this.widthOperand)
          this.canvas.renderAll()
        }
      }
      ismapperselected = false;
      ismidmapperselected = false;
      isoperatorselected = false;
      ismidoperatorselected = false;
      isoperatorselected = false;

      setTimeout(() => {
        if (document.getElementById('keytab').scrollWidth > 920) {
          this.midScroll=true
        }
      });
    })

    this.bottomcanvas.on("mouse:up", (event) => {
      if (source != null && source.typename == 'outputport' && source.belongsto != null && source.belongsto.indexOf('key') > -1 && event.target == null) {
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
          belongsto: 'isNumericData ' + this.bottomcanvas.getObjects().filter(x => x.typename == 'outputport' && x.belongsto == 'isNumericData').length, selectable: false
        });
        let rect = new fabric.Rect({
          left: inputport.left + (inputport.radius * 2),
          top: inputport.top-10, originX: 'left', originY: 'top',
          width: 30, height: 30, fill: 'transparent', border: 'black',
          strokeWidth: .9, stroke: "black", selectable: false
        });
        let hash = new fabric.IText('#', {
          left: rect.left+3,
          top: rect.top+1,
          fontFamily: 'arial',
          fill: '#3c1361',
          fontSize: 30,
          typename: 'isNumericData',
          belongsto: 'isNumericData ' + this.bottomcanvas.getObjects().filter(x => x.typename == 'outputport' && x.belongsto == 'isNumericData').length, selectable: false
        });
        
        let outputport = new fabric.Circle({
          left: rect.left+rect.width ,
          top: rect.top+(rect.height/3) ,
          originX: 'left',
          originY: 'top',
          radius: 5,
          fill: 'black',
          typename: 'outputport',
          belongsto: 'isNumericData ' + this.bottomcanvas.getObjects().filter(x => x.typename == 'outputport' && x.belongsto == 'isNumericData').length, selectable: false
        });
        let line = new fabric.Line([source.left, source.top+3, pointer.x+2, pointer.y+2], { stroke: 'black', selectable: false });
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
      else if (source != null && source.typename == 'outputport' && source.belongsto != null && source.belongsto.indexOf('isNumericData') > -1 && event.target!=null) {
        let letter= new fabric.IText('#', {
          fontFamily: 'arial', fill: '#460073', fontSize: 35, typename: 'isNumericData', value: "", selectable: false, editable: false, belongsto: event.target.belongsto
        });
        let mapper = this.bottomcanvas.getObjects().find(x => x.typename != null && x.mainname == 'mapper')
        let leftinput = this.bottomcanvas.getObjects().find(x => x.typename == 'leftinput' && x.belongsto == event.target.belongsto)
        if (mapper.leftitems == null) { mapper.leftitems = [] }
        letter.left = leftinput.left + 10;
        letter.top = leftinput.top + (mapper.leftitems.length * letter.height);
        letter.value = source.value;
        mapper.leftitems.push(letter)

        let line = new fabric.Line([source.left, source.top + 2, letter.left, letter.top +10], { stroke: 'black', selectable: false });
        this.bottomcanvas.add(line)
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
        event.target.column = source.fieldName;

        let pointer = this.bottomcanvas.getPointer(event.e);
        let line = new fabric.Line([this.positionX, this.positionY, pointer.x, pointer.y], { stroke: 'black', selectable: false });
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
            selectable: false, editable: false,
            belongsto: event.target.belongsto,
          })

          //let b = new fabric.Path('M16,20V16H1V9H16V5l8,7Z', { left: a.left + (a.width * a.scaleX)-15, top: a.top + (a.height * a.scaleY / 4)-10, typename: 'outputline', belongsto: event.target.belongto });

          let b = new fabric.Line([outline.left+15, outline.top+5 , outline.left + 30, outline.top+5], { stroke: 'black', selectable: false });

          let c = new fabric.Circle({
            left: b.left + b.width, top: outline.top, originX: 'left', originY: 'top', radius: 5,
            fill: 'black', selectable: false, editable: false });

          let d = new fabric.Rect({
            left: c.left+(c.radius*2),
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
            fieldName: bottomline.column + '\n' + operator.text + '\n' + topline.column,
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
            fieldName: bottomline.column + '\n' + operator.text + '\n' + topline.column,
            value: 'Operator ' + (outputport.length + 1),
          })
          
          //this.bottomcanvas.add(a)
          this.bottomcanvas.add(b)
          this.bottomcanvas.add(c)
          this.bottomcanvas.add(d)
          this.bottomcanvas.add(e)
          this.bottomcanvas.add(f)
        }
      }
      else if (source != null && (source.typename == 'outputport' || source.typename == 'key') && event.target != null && event.target.typename == 'firstleftitem') {
        let pointer = this.bottomcanvas.getPointer(event.e);
        let line = new fabric.Line([this.positionX, this.positionY, pointer.x, pointer.y], { stroke: 'black', selectable: false });
        this.bottomcanvas.add(line);

        let item = this.bottomcanvas.getObjects().find(x => x.belongsto == event.target.belongsto && x.typename == 'outputport')
        item.column = source.fieldName;
      }
      else if (source != null && (source.typename == 'outputport' || source.typename == 'key') && event.target != null && event.target.typename == 'isNumericData') {
        let line = new fabric.Line([source.left, source.top + (source.radius / 2), event.target.left, event.target.top + (event.target.height / 2)], { stroke: 'black', selectable: false });
        event.target.value = this.rowData[this.rowIndex][source.fieldName];
        this.bottomcanvas.add(line)
      }


      if (source.typename!='outputport' && event.target != null && event.target.typename != null && (event.target.typename.indexOf('Data') > -1)) {

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
        }
        else if (event.target.typename == 'firstleftitem') {
          $('#mappedPopuptext').attr('type', 'text')
          $('#mappedPopuptext').attr('readonly', true);
          $('#mappedPopuptext').val(event.target.column)
        }
        selectedPopupElement = event.target;
      }
    });

    let selectedPopupElement;
    $("#mappedPopuptext").change(() => {
      selectedPopupElement.value = $('#mappedPopuptext').val()
      if (this.bottomcanvas.getObjects().find(x => x.typename == 'outputport' && x.belongsto == selectedPopupElement.belongsto) != null)
      {
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
        return $("<div style='z-index: 100; margin-top: -1px; margin-left: 38px;color: #460073'><li><i class='value-number'></i></li></div>");
      }
    });

    $("#isStringData").draggable({
      cursorAt: { top: 18.5, left: 60 },
      cursor: 'none',
      scroll: false,
      helper: (event) => {
        return $("<div style='z-index: 100; margin-top: -1px; margin-left: 38px;color: #460073'><li><i class='value-string'></i></li></div>");
      }
    });

    $("#isColorData").draggable({
      cursorAt: { top: 18.5, left: 60 },
      cursor: 'none',
      scroll: false,
      helper: (event) => {
        return $("<div style='z-index: 100; margin-top: -1px; margin-left: 38px;color: #460073'><li><i class='value-color'></i></li></div>");
      }
    });

    $("#divlength").droppable({
      drop: (ev, ui) => {
        console.log(ui.draggable[0])

        let evaluatable = ui.draggable[0].innerText;
        let value = this.rowIndex;
        for (let i = 0; i < this.keys.length; i++) {
          evaluatable = evaluatable.replace(new RegExp(this.keys[i], 'g'), 'parseFloat(this.rowData[value]["' + this.keys[i] + '"])');
        }
        evaluatable = '(' + evaluatable + ')'

        this.length = eval(evaluatable)
        this.selectedObject.height = eval(evaluatable + this.lengthOperator + this.lengthOperand);
        this.selectedObject.heightColumn = evaluatable + this.lengthOperator + this.lengthOperand;
        this.selectedObject.mappedheight = ui.draggable[0].innerText;
        this.lengthTitle = ui.draggable[0].innerText;
        this.canvas.renderAll()
      }
    });

    $("#divxposition").droppable({
      drop: (ev, ui) => {
        console.log(ui.draggable[0])

        let evaluatable = ui.draggable[0].innerText;
        let value = this.rowIndex;
        for (let i = 0; i < this.keys.length; i++) {
          evaluatable = evaluatable.replace(new RegExp(this.keys[i], 'g'), 'parseFloat(this.rowData[value]["' + this.keys[i] + '"])');
        }
        evaluatable = '(' + evaluatable + ')'

        this.xposition = eval(evaluatable)
        this.selectedObject.left = eval(evaluatable + this.xPositionOperator + this.xPositionOperand) + this.graph.left;
        this.xPositionTitle = ui.draggable[0].innerText;
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
        this.selectedObject.angle = eval(evaluatable + this.rotationOperator + this.rotationOperand);
        this.selectedObject.rotateColumn = evaluatable + this.rotationOperator + this.rotationOperand;
        this.selectedObject.mappedrotate = ui.draggable[0].innerText;
        this.rotationTitle = ui.draggable[0].innerText;
        this.canvas.renderAll()
      }
    });
    $("#divwidth").droppable({
      drop: (ev, ui) => {
        let evaluatable = ui.draggable[0].innerText;
        let value = this.rowIndex;
        for (let i = 0; i < this.keys.length; i++) {
          evaluatable = evaluatable.replace(new RegExp(this.keys[i], 'g'), 'parseFloat(this.rowData[value]["' + this.keys[i] + '"])');
        }
        evaluatable = '(' + evaluatable + ')'
        this.width = eval(evaluatable)
        this.selectedObject.width = eval(evaluatable + this.widthOperator + this.widthOperand);
        this.selectedObject.widthColumn = evaluatable + this.widthOperator + this.widthOperand;
        this.selectedObject.mappedwidth = ui.draggable[0].innerText;
        this.widthTitle = ui.draggable[0].innerText;
        this.area = this.width * this.length;
        this.canvas.renderAll()
      }
    });
    $("#divside").droppable({
      drop: (ev, ui) => {
        let evaluatable = ui.draggable[0].innerText;
        let value = this.rowIndex;
        for (let i = 0; i < this.keys.length; i++) {
          evaluatable = evaluatable.replace(new RegExp(this.keys[i], 'g'), 'parseFloat(this.rowData[value]["' + this.keys[i] + '"])');
        }
        evaluatable = '(' + evaluatable + ')'
        this.side = eval(evaluatable)
        this.selectedObject.width = eval(evaluatable + this.widthOperator + this.widthOperand);
        this.selectedObject.widthColumn = evaluatable + this.widthOperator + this.widthOperand;
        this.selectedObject.height = this.selectedObject.width;
        this.selectedObject.mappedwidth = ui.draggable[0].innerText;
        this.sideTitle = ui.draggable[0].innerText;
        this.area = this.side * this.side;
        this.canvas.renderAll()
      }
    });
    $("#divradius").droppable({
      drop: (ev, ui) => {
        let evaluatable = ui.draggable[0].innerText;
        let value = this.rowIndex;
        for (let i = 0; i < this.keys.length; i++) {
          evaluatable = evaluatable.replace(new RegExp(this.keys[i], 'g'), 'parseFloat(this.rowData[value]["' + this.keys[i] + '"])');
        }
        evaluatable = '(' + evaluatable + ')'
        this.radius = eval(evaluatable)
        this.selectedObject.radius = eval(evaluatable + this.radiusOperator + this.radiusOperand);
        this.selectedObject.radiusColumn = evaluatable + this.radiusOperator + this.radiusOperand;
        this.selectedObject.mappedradius = ui.draggable[0].innerText;
        this.radiusTitle = ui.draggable[0].innerText;
        this.area = 3.14 * this.radius * this.radius;
        this.canvas.renderAll()
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

        this.changeArea(eval(evaluatable))
        this.selectedObject.area = eval(evaluatable + this.areaOperator + this.areaOperand);
        this.selectedObject.areaColumn = evaluatable + this.areaOperator + this.areaOperand;
        this.selectedObject.mappedarea = ui.draggable[0].innerText;
        this.areaTitle = ui.draggable[0].innerText;
        this.canvas.renderAll()
      }
    });

    $("#rectanglePrototype").draggable({
      cursorAt: { top: 18.5, left: 60 },
      cursor: 'none',
      scroll: false,
      helper: (event) => {
        return $("<div style='z-index: 100; margin-top: -1px; margin-left: 38px;'><li><i class='mark-rectangle'></i></li></div>");
      }
    });
    $("#circlePrototype").draggable({
      cursorAt: { top: 18.5, left: 60 },
      cursor: 'none',
      scroll: false,
      helper: (event) => {
        return $("<div style='z-index: 100; margin-top: -1px; margin-left: 38px;'><li><i class='mark-rectangle'></i></li></div>");
      }
    });
    $("#mapperWidget").draggable({
      cursorAt: { top: 18.5, left: 80 },
      cursor: 'none',
      scroll: false,
      helper: (event) => {
        return $("<div style='z-index: 100; margin-top: -1px; margin-left: 38px;'><li><i class='collections-mapper'></i></li></div>");
      }
    });
    $("#squarePrototype").draggable({
      cursorAt: { top: 18.5, left: 60 },
      cursor: 'none',
      scroll: false,
      helper: (event) => {
        return $("<div style='z-index: 100; margin-top: -1px; margin-left: 38px;'><li><i class='mark-rectangle'></i></li></div>");
      }
    });
    $("#addition-operator").draggable({
      cursorAt: { top: 18.5, left: 60 },
      cursor: 'none',
      scroll: false,
      helper: (event) => {
        return $("<div style='z-index: 100; margin-top: -1px; margin-left: 38px;'><li><i class='operator-additionIcon'></i></li></div>");
      }
    });
    $("#bottomcanvas").droppable({
      drop: (ev, ui) => {
        if (ui.draggable[0].id == 'isNumericData' || ui.draggable[0].id == 'isColorData' || ui.draggable[0].id == 'isStringData') {
          // console.log(this.bottomcanvas.getObjects())
          let mappers = this.bottomcanvas.getObjects().filter(x => x.typename != null && x.mainname == 'mapper')
          let isInsideMapper = false;
          for (let i = 0; i < mappers.length; i++) {
            let mapper = mappers[i];
            let leftitem = this.bottomcanvas.getObjects().find(x => x.belongsto == mapper.belongsto && x.typename == 'leftinput')
            let rightitem = this.bottomcanvas.getObjects().find(x => x.belongsto == mapper.belongsto && x.typename == 'rightinput')

            if (leftitem.left - (ui.offset.left - $('#leftpanel').width()) < leftitem.width + 10 || rightitem.left - (ui.offset.left - $('#leftpanel').width()) < rightitem.width + 10) {
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
                  fontFamily: 'arial', fill: '#460073', fontSize: 35, typename: ui.draggable[0].id, value: 0, selectable: false, editable: false, belongsto: mapper.belongsto
                })
              }
              else if (ui.draggable[0].id == 'isColorData') {
                letter = new fabric.Path('m -1662.5927,2965.5148 c 1.9739,3.398 4.0351,6.4881 6,9.3438 1.965,2.8556 3.8358,5.4801 5.4688,7.9687 1.633,2.4885 3.022,4.8287 4,7.125 0.4891,1.148 0.8603,2.2733 1.125,3.4063 0.2647,1.1327 0.4062,2.2665 0.4062,3.4062 0,1.1395 -0.1483,2.2698 -0.375,3.3438 -0.2266,1.0737 -0.5383,2.1073 -0.9687,3.0937 -0.8608,1.9728 -2.0858,3.759 -3.625,5.25 -1.5392,1.4906 -3.3709,2.698 -5.4063,3.5313 -1.0176,0.4163 -2.1112,0.7807 -3.2187,1 -1.1076,0.2192 -2.2316,0.3125 -3.4063,0.3125 -1.1745,0 -2.3256,-0.093 -3.4375,-0.3125 -1.1118,-0.2193 -2.1941,-0.5835 -3.2187,-1 -2.0487,-0.8335 -3.8875,-2.0406 -5.4375,-3.5313 -1.55,-1.491 -2.8036,-3.2772 -3.6563,-5.25 -0.4261,-0.9864 -0.7541,-2.02 -0.9687,-3.0937 -0.2146,-1.074 -0.3032,-2.2044 -0.2813,-3.3438 0.029,-1.5282 0.2077,-2.8851 0.5,-4.2187 0.2923,-1.3339 0.6751,-2.6098 1.1875,-3.8125 1.0251,-2.4062 2.4464,-4.6096 4.0938,-6.875 1.6474,-2.2654 3.5123,-4.6158 5.4375,-7.25 1.925,-2.6344 3.9231,-5.5807 5.7812,-9.0938 z m -7.9375,23.625 c -0.4883,0.7747 -0.9597,1.5154 -1.3125,2.3438 -0.3093,0.7263 -0.5425,1.5382 -0.7187,2.3437 -0.1766,0.8052 -0.2637,1.6397 -0.2813,2.5625 -0.013,0.6879 0.027,1.3515 0.1563,2 0.1296,0.6485 0.3364,1.2482 0.5937,1.8438 0.5148,1.1911 1.283,2.256 2.2188,3.1562 0.9359,0.9002 2.0443,1.6219 3.2812,2.125 0.6187,0.2515 1.2348,0.524 1.9063,0.6563 0.6712,0.1322 1.3846,0.1562 2.0937,0.1562 0.7093,0 1.3627,-0.024 2.0313,-0.1562 0.6688,-0.1323 1.3542,-0.405 1.9687,-0.6563 1.229,-0.5031 2.3207,-1.2248 3.25,-2.125 0.9294,-0.9002 1.699,-1.9651 2.2188,-3.1562 0.2599,-0.5956 0.4569,-1.1953 0.5937,-1.8438 0.013,-0.037 -0.013,-0.088 0,-0.125 z', {
                  fontFamily: 'arial', fill: '#460073', typename: ui.draggable[0].id, value: "#460073", selectable: false
                  , belongsto: mapper.belongsto
                })
                letter.set({ scaleY: .7, scaleX: .7 });
              }
              else if (ui.draggable[0].id == 'isStringData') {
                letter = new fabric.Path('m 112.375,55.0625 0,20.09375 8.6875,0 c 0,0 -0.0419,8.2293 -1.28125,11.625 -1.2391,3.3959 -2.6875,5.28125 -2.6875,5.28125 l 2.125,3.90625 c 0,0 6.7091,-5.4148 9.1875,-11.1875 2.4781,-5.773 2.89225,-13.3194 2.90625,-17.8125 l 0.0312,-11.90625 z m 24.96875,0 0,20.09375 8.6875,0 c 0,0 -0.0107,8.2293 -1.25,11.625 -1.2391,3.3959 -2.71875,5.28125 -2.71875,5.28125 l 2.15625,3.90625 c 0,0 6.7091,-5.4148 9.1875,-11.1875 2.4781,-5.773 2.89225,-13.3194 2.90625,-17.8125 l 0.0312,-11.90625 z', {
                  fontFamily: 'arial', fill: '#460073', fontSize: 25, typename: ui.draggable[0].id, value: null, selectable: false, belongsto: mapper.belongsto
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
                  firstrightitem.value= 'Mapper ' + this.bottomcanvas.getObjects().filter(x => x.typename == 'mapper').length

                  mappers[i].firstrightitem = firstrightitem;
                  this.bottomcanvas.add(firstrightitem)
                }
              }

              this.bottomcanvas.add(letter);
            }
          }
          if (isInsideMapper == false) {
            let hash = new fabric.IText('#', {
              left: ui.offset.left - $('#leftpanel').width()+3,
              top: ui.offset.top - this.bottomcanvas._offset.top,
              fontFamily: 'arial',
              fill: '#3c1361',
              fontSize: 30,
              typename:'isNumericData',
              belongsto: 'isNumericData ' + this.bottomcanvas.getObjects().filter(x => x.typename == 'outputport' && x.belongsto == 'isNumericData').length,selectable:false
            });
            let rect = new fabric.Rect({
              left: ui.offset.left - $('#leftpanel').width(),
              top: ui.offset.top - this.bottomcanvas._offset.top,originX: 'left',originY: 'top',
              width: 30,height: 30,fill: 'transparent',border: 'black',
              strokeWidth: .9, stroke: "black", selectable: false
            });
            let outputport = new fabric.Circle({
              left: rect.left+rect.width,
              top: rect.top+(rect.height/3),
              originX: 'left',
              originY: 'top',
              radius: 5,
              fill: 'black',
              typename: 'outputport',
              belongsto: 'isNumericData ' +this.bottomcanvas.getObjects().filter(x => x.typename == 'outputport' && x.belongsto == 'isNumericData').length,selectable: false
            });
            this.bottomcanvas.add(rect);
            this.bottomcanvas.add(hash);
            this.bottomcanvas.add(outputport)
          }
        }
        else if (ui.draggable[0].id == 'addition-operator') {

          let belongto = 'operator ' + this.bottomcanvas.getObjects().filter(x => x.typename == 'operator').length;
          let topline = new fabric.Path('M360.342,216.266L219.373,113.882c-9.783-7.106-22.723-8.121-33.498-2.63c-10.771,5.49-17.556,16.559-17.556,28.65V344.67    c0,12.092,6.784,23.158,17.556,28.646c4.61,2.348,9.611,3.506,14.6,3.506c6.666,0,13.301-2.07,18.898-6.138l140.969-102.383    c8.33-6.047,13.256-15.719,13.256-26.018C373.598,231.988,368.672,222.312,360.342,216.266z M242.285,0C108.688,0,0.004,108.689,0.004,242.283c0,133.592,108.686,242.283,242.281,242.283    c133.594,0,242.278-108.691,242.278-242.283C484.562,108.689,375.881,0,242.285,0z M242.285,425.027    c-100.764,0-182.744-81.979-182.744-182.744c0-100.766,81.98-182.742,182.744-182.742s182.745,81.976,182.745,182.742    C425.029,343.049,343.049,425.027,242.285,425.027z', { scaleX: .03, scaleY: .03, left: ui.offset.left - $('#leftpanel').width()+7, top: ui.offset.top - this.bottomcanvas._offset.top-2, typename: 'topline', belongsto: belongto });
          let bottomline = new fabric.Path('M360.342,216.266L219.373,113.882c-9.783-7.106-22.723-8.121-33.498-2.63c-10.771,5.49-17.556,16.559-17.556,28.65V344.67    c0,12.092,6.784,23.158,17.556,28.646c4.61,2.348,9.611,3.506,14.6,3.506c6.666,0,13.301-2.07,18.898-6.138l140.969-102.383    c8.33-6.047,13.256-15.719,13.256-26.018C373.598,231.988,368.672,222.312,360.342,216.266z M242.285,0C108.688,0,0.004,108.689,0.004,242.283c0,133.592,108.686,242.283,242.281,242.283    c133.594,0,242.278-108.691,242.278-242.283C484.562,108.689,375.881,0,242.285,0z M242.285,425.027    c-100.764,0-182.744-81.979-182.744-182.744c0-100.766,81.98-182.742,182.744-182.742s182.745,81.976,182.745,182.742    C425.029,343.049,343.049,425.027,242.285,425.027z', { scaleX: .03, scaleY: .03, left: ui.offset.left - $('#leftpanel').width()+7, top: ui.offset.top - this.bottomcanvas._offset.top + 19, typename: 'bottomline', belongsto: belongto });
          let outline = new fabric.Path('M360.342,216.266L219.373,113.882c-9.783-7.106-22.723-8.121-33.498-2.63c-10.771,5.49-17.556,16.559-17.556,28.65V344.67    c0,12.092,6.784,23.158,17.556,28.646c4.61,2.348,9.611,3.506,14.6,3.506c6.666,0,13.301-2.07,18.898-6.138l140.969-102.383    c8.33-6.047,13.256-15.719,13.256-26.018C373.598,231.988,368.672,222.312,360.342,216.266z M242.285,0C108.688,0,0.004,108.689,0.004,242.283c0,133.592,108.686,242.283,242.281,242.283    c133.594,0,242.278-108.691,242.278-242.283C484.562,108.689,375.881,0,242.285,0z M242.285,425.027    c-100.764,0-182.744-81.979-182.744-182.744c0-100.766,81.98-182.742,182.744-182.742s182.745,81.976,182.745,182.742    C425.029,343.049,343.049,425.027,242.285,425.027z', { scaleX: .03, scaleY: .03, left: ui.offset.left - $('#leftpanel').width()+53.5, top: ui.offset.top - this.bottomcanvas._offset.top+8, typename: 'outline', belongsto: belongto });


          let plusoperator = new fabric.IText('+', {
            left: bottomline.left + 15.5,
            top: ui.offset.top - this.bottomcanvas._offset.top - 10.5,
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


          this.bottomcanvas.add(plusoperator)
          this.bottomcanvas.add(rect);
          this.bottomcanvas.add(topline);
          this.bottomcanvas.add(bottomline);
          this.bottomcanvas.add(outline);
          // this.bottomcanvas.add(outputline);

        }
        else if (ui.draggable[0].id == 'mapperWidget') {
          let mapperheight = 150
          let belongto = 'mapper ' + this.bottomcanvas.getObjects().filter(x => x.typename == 'mapper').length;
          //let leftinputsmall = new fabric.Circle({
          //  left: ui.offset.left - $('#leftpanel').width(),
          //  top: ui.offset.top - this.bottomcanvas._offset.top + (mapperheight / 3) + 10,
          //  originX: 'left',
          //  originY: 'top',
          //  radius: 10,
          //  fill: 'black',
          //  belongsto: belongto,
          //  typename:'leftinputsmallitem'
          //});
          let leftinput = new fabric.Circle({
            left: ui.offset.left - $('#leftpanel').width(),
            top: ui.offset.top - this.bottomcanvas._offset.top + (mapperheight / 3),
            originX: 'left',
            originY: 'top',
            radius: 20,
            fill: 'transparent',
            belongsto: belongto,
            typename: 'firstleftitemContainer'
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
            typename: 'leftinput'
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
            typename: 'rightinput',
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
          });
          let rightoutput = new fabric.Circle({
            left: outershape.left + outershape.width + 10,
            top: ui.offset.top - this.bottomcanvas._offset.top + (shape.height / 3),
            originX: 'left',
            originY: 'top',
            radius: 20,
            fill: 'transparent',
            belongsto: belongto,
            typename: 'outputport',
            mainname: 'mapper'
          });

          //let rightoutputsmall = new fabric.Circle({
          //  left: rightoutput.left + (rightoutput.radius * 2),
          //  top: ui.offset.top - this.bottomcanvas._offset.top + (shape.height / 3) + (rightoutput.radius / 2),
          //  originX: 'left',
          //  originY: 'top',
          //  radius: 10,
          //  fill: 'black',
          //  belongsto: belongto,
          //  typename: 'outputport',
          //  selectable:false
          //});

          this.bottomcanvas.add(leftinput)
          this.bottomcanvas.add(shape)
          this.bottomcanvas.add(rightshape)
          this.bottomcanvas.add(rightoutput)
          this.bottomcanvas.add(outershape)
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
            let colVal = d3.scaleLinear().domain([d3.min(leftitems), d3.max(leftitems)]).range(rightitems)
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
              transparentCorners: false, selectable: false
            })
            let b = new fabric.IText(ui.draggable[0].innerText, {
              left: ui.offset.left - $('#leftpanel').width() + 10,
              top: ui.offset.top - this.bottomcanvas._offset.top + 10,
              originX: 'left',
              originY: 'top',
              fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
              fill: 'white',
              fontSize: 13,
              selectable: false

            })
            let c = new fabric.Circle({
              left: ui.offset.left - $('#leftpanel').width() + a.width,
              top: ui.offset.top - this.bottomcanvas._offset.top + 8,
              originX: 'left',
              originY: 'top',
              radius: 7,
              fill: 'black',
              selectable: false,
              typename: 'outputport',
              belongsto: 'key ' + this.bottomcanvas.getObjects().filter(x => x.typename=='outputport' && x.belongsto != null && x.belongsto.indexOf('key')>-1).length
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
      accept: "#rectanglePrototype,#circlePrototype,#squarePrototype,#mapperWidget",
      drop: (ev, ui) => {
        let shape;
        if (ui.draggable[0].id == 'rectanglePrototype') {
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
          shape.ID = 'rect ' + (this.canvas.getObjects().filter(x => x.typename == 'Rectangle').length + 1);
          //shape.name = 'rect 1';
          //this.xposition = shape.left - this.graph.left;
          //this.yposition = this.graph.top + this.graph.height - shape.top - shape.height;
          //this.color = shape.fill;
          //this.length = shape.height;
          //this.width = shape.width;
          //this.area = this.length * this.width;
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
          shape.ID = 'square ' + (this.canvas.getObjects().filter(x => x.typename == 'Square').length + 1);
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
          shape.ID = 'circle ' + (this.canvas.getObjects().filter(x => x.typename == 'Circle').length + 1);
        }
        this.canvas.add(shape);
        this.canvas.setActiveObject(shape);
      }
    });
    this.canvas.on('object:moving', (event) => {
      this.xposition = event.target.left - this.graph.left;
      this.yposition = this.graph.top + (this.graph.height * this.graph.scaleY) - event.target.top - (event.target.height * event.target.scaleY);
    });
    this.canvas.on('object:scaling', (event) => {
      this.length = event.target.getHeight();
      this.width = event.target.getWidth();
      this.area = this.length * this.width;
    });
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

  changeArea(areaValue) {
    let areadiff = this.area / areaValue;

    if (this.lengthOperator == '*') {
      this.length = this.length / Math.sqrt(areadiff)
    }
    if (this.widthOperator == '*') {
      this.width = this.width / Math.sqrt(areadiff)
    }
    this.area = this.length * this.width
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
    this.graphs.push(this.graph.ID)
    canvas.add(this.graph);
    canvas.renderAll();
  }
  graphs: any = [];
  graph: any;

  //loadColorPanel() {
  //  var line = new fabric.Line([100, 100, 100, 200]);
  //  canvas.add(line);
  //  createSampleExtractorFromPath(line, true);
  //}
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

  onRowChange(index) {
    Object.keys(this.rowData[0]).forEach((key) => {
      try {
        canvas.getObjects().find(x => x.label == key).value[0].number = this.rowData[index][key];
        canvas.getObjects().find(x => x.label == key).value[0].unscaledValue = this.rowData[index][key];

        let propertyObject = canvas.getObjects().find(x => x.label == key).outConnectors[0].destination.visualValues[0].outConnectors.find(x => x.destination.attribute == 'width' || x.destination.attribute == 'height').destination;
        if (propertyObject != null) {
          propertyObject.value.number = this.rowData[index][key];
          propertyObject.value.unscaledValue = this.rowData[index][key];

          propertyObject.parentObject[propertyObject.attribute] = this.rowData[index][key] / (propertyObject.value.outMultiplicationFactor)
          canvas.renderAll();
        }
      } catch { }
    });
    try {
      let multiplicationObject = canvas.getObjects().find(x => x.typename == 'multiplication');
      if (multiplicationObject != null) {
        let value = 1;
        multiplicationObject.inConnectors.forEach(x => {
          value = value * x.source.collection.inConnectors[0].source.value[0].number;
        })
        multiplicationObject.value.number = value;
        multiplicationObject.value.unscaledValue = value;
        canvas.renderAll();

      }
    } catch { }
    try {
      canvas.getObjects().filter(x => x["customshape"] == true).forEach(ele => {
        let mapper = ele?.visualProperties.find(x => x["attribute"] == "fill").inConnectors[0].source.mapper;

        let input = mapper?.inCollection.values.map(x => x.unscaledValue != null ? x.unscaledValue : x.string);
        let output = ele.visualProperties.find(x => x["attribute"] == "fill").inConnectors[0].source.mapper.outCollection.visualValues.map(x => x.value.color._source)
          .map(a => "#" + a.map((x, i) => {
            if (i < 3) {
              x = parseInt(x).toString(16);      //Convert to a base16 string
              return (x.length == 1) ? "0" + x : x;  //Add zero if we get only one character
            }
          }).join(""));
        let colVal;

        if (typeof (input[0]) == 'number') {
          colVal = d3.scaleLinear().domain(input).range(output)
        }
        else if (typeof (input[0]) == 'string') {
          colVal = d3.scaleOrdinal().domain(input).range(output)
        }

        let domainoperator = mapper?.inputPoint.inConnectors[0].source.type;
        let domainsource;
        if (domainoperator == 'multiplication' || domainoperator == 'addition' || domainoperator == 'substraction') {
          domainsource = mapper?.inputPoint.inConnectors[0].source.inConnectors.map(x => x.source.collection.inConnectors[0].source.label);
        }
        else {
          domainsource = mapper?.inputPoint.inConnectors[0].source.collection.inConnectors[0].source.label;
        }

        let val;
        if (domainoperator == 'substraction') {
          val = 0;
          for (let i1 = 0; i1 < domainsource.length; i1++)
            val = val - this.rowData[index][i1];
        }
        else if (domainoperator == 'addition') {
          val = 0
          for (let i1 = 0; i1 < domainsource.length; i1++)
            val = val + this.rowData[index][i1];
        }
        else if (domainoperator == 'multiplication') {
          val = 1
          for (let i1 = 0; i1 < domainsource.length; i1++)
            val = val * this.rowData[index][i1];
        }
        else if (domainoperator == 'division') {
          val = this.rowData[0];
          for (let i1 = 1; i1 < domainsource.length; i1++)
            val = val / this.rowData[index][i1];
        }
        else {
          val = this.rowData[index][domainsource];
        }


        ele.fill = colVal(val);
        canvas.renderAll();
      });
    }
    catch {

    }

  }

  onRepeatWithin() {

    console.log(canvas.getObjects());
    this.recordedEvents = [];
    for (let i = 0; i < canvas.getObjects().length; i++) {
      try {
        if (canvas.getObjects()[i].customshape == true) {
          let label = canvas.getObjects()[i].visualProperties.find(x => x.attribute == 'height' || x.attribute == 'width').inConnectors[0].source.label;

          let incollection, outcollection, domainsource, domainoperator;

          if (label) {
            let obj = canvas.getObjects()[i];
            let mapper;
            if (obj?.visualProperties.find(x => x["attribute"] == "fill").inConnectors.length > 0) {
              mapper = obj?.visualProperties.find(x => x["attribute"] == "fill").inConnectors[0].source.mapper;
              incollection = mapper?.inCollection.values.map(x => x.unscaledValue != null ? x.unscaledValue : x.string);
              outcollection = mapper?.outCollection.visualValues.map(x => x.value.color._source)
                .map(a => "#" + a.map((x, i) => {
                  if (i < 3) {
                    x = parseInt(x).toString(16);      //Convert to a base16 string
                    return (x.length == 1) ? "0" + x : x;  //Add zero if we get only one character
                  }
                }).join(""));

              domainoperator = mapper?.inputPoint.inConnectors[0].source.type;

              if (domainoperator == 'multiplication' || domainoperator == 'addition' || domainoperator == 'substraction') {
                domainsource = mapper?.inputPoint.inConnectors[0].source.inConnectors.map(x => x.source.label);
              }
              else {
                domainsource = mapper?.inputPoint.inConnectors[0].source.label;
              }
            }
            if (mapper) {
              this.recordedEvents.push({ data: canvas.getObjects()[i].visualProperties.find(x => x.attribute == 'height').inConnectors[0].source.label, obj: obj.visualProperties.find(x => x["attribute"] == "height"), domainsource: domainsource, domainoperator: domainoperator, range: outcollection, domain: incollection });
              this.recordedEvents.push({ data: canvas.getObjects()[i].visualProperties.find(x => x.attribute == 'width').inConnectors[0].source.label, obj: obj.visualProperties.find(x => x["attribute"] == "width"), domain: incollection, domainsource: domainsource, domainoperator: domainoperator, range: outcollection });
            }
            else {
              this.recordedEvents.push({ data: canvas.getObjects()[i].visualProperties.find(x => x.attribute == 'height').inConnectors[0].source.label, obj: obj.visualProperties.find(x => x["attribute"] == "height") });
              this.recordedEvents.push({ data: canvas.getObjects()[i].visualProperties.find(x => x.attribute == 'width').inConnectors[0].source.label, obj: obj.visualProperties.find(x => x["attribute"] == "width") });
            }
          }
        }
      } catch { }
    }
    console.log(this.recordedEvents);

    this.rowData.forEach((row, i) => {
      this.createVizWithin(row, i);
    });
  }

  createVizWithin(row, i) {
    let selectedrect = canvas.getObjects().find(a => a.typename == 'selectionrect')

    let mergedRecordedEvents = [];
    this.recordedEvents.forEach(ele => {
      let element = ele['obj'];
      let obj = element.parentObject.left;
      if (mergedRecordedEvents[obj] == null) {
        mergedRecordedEvents[obj] = { left: element.parentObject.left, top: element.parentObject.top, fill: element.fill, value: element.value.number, data: [ele['data']], domain: ele.domain, range: ele.range, domainsource: ele.domainsource, domainoperator: ele.domainoperator };
      }
      else {
        mergedRecordedEvents[obj]['data'].push(ele['data'])
      }
      mergedRecordedEvents[obj][element['attribute']] = (element.parentObject[element['attribute']] / element.value.unscaledValue) * row[ele['data']];
    });

    Object.keys(mergedRecordedEvents).forEach((ele) => {

      let colVal;
      if (mergedRecordedEvents[ele].domain != null) {
        if (typeof (mergedRecordedEvents[ele].domain[0]) == 'string') {
          colVal = d3.scaleOrdinal()
            .domain(mergedRecordedEvents[ele].domain)
            .range(mergedRecordedEvents[ele].range)
        }
        else if (typeof (mergedRecordedEvents[ele].domain[0]) == 'number') {
          colVal = d3.scaleLinear()
            .domain(mergedRecordedEvents[ele].domain)
            .range(mergedRecordedEvents[ele].range)
        }
      }

      let val;
      if (mergedRecordedEvents[ele].domainoperator != null) {
        if (mergedRecordedEvents[ele].domainoperator == 'substraction') {
          val = 0;
          for (let i1 = 0; i1 < mergedRecordedEvents[ele].domainsource.length; i1++)
            val = val - row[mergedRecordedEvents[ele].domainsource[i1]];
        }
        else if (mergedRecordedEvents[ele].domainoperator == 'addition') {
          val = 0
          for (let i1 = 0; i1 < mergedRecordedEvents[ele].domainsource.length; i1++)
            val = val + row[mergedRecordedEvents[ele].domainsource[i1]];
        }
        else if (mergedRecordedEvents[ele].domainoperator == 'multiplication') {
          val = 1
          for (let i1 = 0; i1 < mergedRecordedEvents[ele].domainsource.length; i1++)
            val = val * row[mergedRecordedEvents[ele].domainsource[i1]];
        }
        else if (mergedRecordedEvents[ele].domainoperator == 'division') {
          val = row[mergedRecordedEvents[ele].domainsource[0]];
          for (let i1 = 1; i1 < mergedRecordedEvents[ele].domainsource.length; i1++)
            val = val / row[mergedRecordedEvents[ele].domainsource[i1]];
        }
        else {
          val = row[mergedRecordedEvents[ele].domainsource];
        }
      }

      //if(element.parentObject!=null && element.parentObject.shape=='Square'){
      if (colVal != null) {
        var rect = new fabric.Rect({ left: mergedRecordedEvents[ele].left - 20, top: mergedRecordedEvents[ele].top - 20, stroke: colVal(val), strokeWidth: 1, fill: 'rgba(0,0,0,0)', width: mergedRecordedEvents[ele].width, height: mergedRecordedEvents[ele].height });
      }
      else {
        var rect = new fabric.Rect({ left: mergedRecordedEvents[ele].left - 20, top: mergedRecordedEvents[ele].top - 20, fill: 'rgba(0,0,0,0)', strokeWidth: 1, width: mergedRecordedEvents[ele].width, height: mergedRecordedEvents[ele].height });
      }

      rect.name = 'rect' + i;
      canvas.add(rect);
      //}
      console.log(this.recordedEvents);
    });
    canvas.renderAll();
  }

  clearRepeats() {
    this.rowData.forEach((element, i) => {
      let rect = canvas.getObjects().filter(x => x.name == 'rect' + i);
      rect.forEach(rectangle => {
        canvas.remove(rectangle);
      });
    });
    canvas.renderAll();
  }

  onRepeat() {
    console.log(canvas.getObjects());
    this.recordedEvents = [];
    for (let i = 0; i < canvas.getObjects().length; i++) {
      try {
        if (canvas.getObjects()[i].customshape == true) {
          let label = canvas.getObjects()[i].visualProperties.find(x => x.attribute == 'height' || x.attribute == 'width').inConnectors[0].source.label;
          if (label) {

            let obj = canvas.getObjects()[i];

            let incollection, outcollection, domainsource, domainoperator;

            let mapper;
            if (obj?.visualProperties.find(x => x["attribute"] == "fill").inConnectors.length > 0) {
              mapper = obj?.visualProperties.find(x => x["attribute"] == "fill").inConnectors[0].source.mapper;
              incollection = mapper?.inCollection.values.map(x => x.unscaledValue != null ? x.unscaledValue : x.string);
              outcollection = mapper?.outCollection.visualValues.map(x => x.value.color._source)
                .map(a => "#" + a.map((x, i) => {
                  if (i < 3) {
                    x = parseInt(x).toString(16);      //Convert to a base16 string
                    return (x.length == 1) ? "0" + x : x;  //Add zero if we get only one character
                  }
                }).join(""));

              domainoperator = mapper?.inputPoint.inConnectors[0].source.type;

              if (domainoperator == 'multiplication' || domainoperator == 'addition' || domainoperator == 'substraction') {
                domainsource = mapper?.inputPoint.inConnectors[0].source.inConnectors.map(x => x.source.label);
              }
              else {
                domainsource = mapper?.inputPoint.inConnectors[0].source.label;
              }
            }

            if (mapper) {
              this.recordedEvents.push({ data: canvas.getObjects()[i].visualProperties.find(x => x.attribute == 'height').inConnectors[0].source.label, obj: obj.visualProperties.find(x => x["attribute"] == "height"), domain: incollection, range: outcollection, domainsource: domainsource, domainoperator: domainoperator });
              this.recordedEvents.push({ data: canvas.getObjects()[i].visualProperties.find(x => x.attribute == 'width').inConnectors[0].source.label, obj: obj.visualProperties.find(x => x["attribute"] == "width"), domain: incollection, range: outcollection, domainsource: domainsource, domainoperator: domainoperator });
            }
            else {
              this.recordedEvents.push({ data: canvas.getObjects()[i].visualProperties.find(x => x.attribute == 'height').inConnectors[0].source.label, obj: obj.visualProperties.find(x => x["attribute"] == "height") });
              this.recordedEvents.push({ data: canvas.getObjects()[i].visualProperties.find(x => x.attribute == 'width').inConnectors[0].source.label, obj: obj.visualProperties.find(x => x["attribute"] == "width") });
            }
          }
        }
      } catch { }
    }
    console.log(this.recordedEvents);
    //recordedEvents.forEach(element => {
    //   canvasDropFunction(element['event'],element['ui'])
    //});

    this.rowData.forEach((row, i) => {
      this.createViz(row, 'canvas' + i);
      document.getElementById('canvas' + i).parentElement.style.display = 'none';
      this.createViz(row, 'thumbnailcanvas' + i);
    });
  }

  createViz(row, canvasname) {

    if ((document.getElementById(canvasname) as any).fabric == null) {
      var thumbnailcanvas = new fabric.Canvas(canvasname);
      (document.getElementById(canvasname) as any).fabric = thumbnailcanvas;
    }
    else {
      var thumbnailcanvas = (document.getElementById(canvasname) as any).fabric;
      thumbnailcanvas.clear();
    }

    //var width = $('#mainContainer').width();
    //var height = $(document).height() - $('#theMenu').height() - 5;
    let selectedrect = canvas.getObjects().find(a => a.name == 'selectionrect')
    let sx = selectedrect.scaleX != null ? selectedrect.scaleX : 1;
    let sy = selectedrect.scaleY != null ? selectedrect.scaleY : 1;
    thumbnailcanvas.setWidth(selectedrect.width * sx);
    thumbnailcanvas.setHeight(selectedrect.height * sy);
    let mergedRecordedEvents = [];
    this.recordedEvents.forEach(ele => {
      let element = ele['obj'];
      let obj = element.parentObject.left;
      if (mergedRecordedEvents[obj] == null) {
        mergedRecordedEvents[obj] = { left: element.parentObject.left, top: element.parentObject.top, fill: element.fill, value: element.value.number, data: [ele['data']], domain: ele.domain, range: ele.range, domainsource: ele.domainsource, domainoperator: ele.domainoperator };
      }
      else {
        mergedRecordedEvents[obj]['data'].push(ele['data'])
      }
      mergedRecordedEvents[obj][element['attribute']] = (element.parentObject[element['attribute']] / element.value.unscaledValue) * row[ele['data']];
    });
    Object.keys(mergedRecordedEvents).forEach(ele => {
      let colVal;
      if (mergedRecordedEvents[ele].domain != null && typeof (mergedRecordedEvents[ele].domain[0]) == 'string') {
        colVal = d3.scaleOrdinal()
          .domain(mergedRecordedEvents[ele].domain)
          .range(mergedRecordedEvents[ele].range)
      }
      else if (mergedRecordedEvents[ele].domain != null && typeof (mergedRecordedEvents[ele].domain[0]) == 'number') {
        colVal = d3.scaleLinear()
          .domain(mergedRecordedEvents[ele].domain)
          .range(mergedRecordedEvents[ele].range)
      }

      let val;
      if (mergedRecordedEvents[ele].domainoperator != null) {
        if (mergedRecordedEvents[ele].domainoperator == 'substraction') {
          val = 0;
          for (let i1 = 0; i1 < mergedRecordedEvents[ele].domainsource.length; i1++)
            val = val - row[mergedRecordedEvents[ele].domainsource[i1]];
        }
        else if (mergedRecordedEvents[ele].domainoperator == 'addition') {
          val = 0
          for (let i1 = 0; i1 < mergedRecordedEvents[ele].domainsource.length; i1++)
            val = val + row[mergedRecordedEvents[ele].domainsource[i1]];
        }
        else if (mergedRecordedEvents[ele].domainoperator == 'multiplication') {
          val = 1
          for (let i1 = 0; i1 < mergedRecordedEvents[ele].domainsource.length; i1++)
            val = val * row[mergedRecordedEvents[ele].domainsource[i1]];
        }
        else if (mergedRecordedEvents[ele].domainoperator == 'division') {
          val = row[mergedRecordedEvents[ele].domainsource[0]];
          for (let i1 = 1; i1 < mergedRecordedEvents[ele].domainsource.length; i1++)
            val = val / row[mergedRecordedEvents[ele].domainsource[i1]];
        }
        else {
          val = row[mergedRecordedEvents[ele].domainsource];
        }
      }
      let rect;
      if (colVal != null) {
        rect = new fabric.Rect({
          left: mergedRecordedEvents[ele].left - selectedrect.left - 20, top: mergedRecordedEvents[ele].top - selectedrect.top - 20, stroke: colVal(val), strokeWidth: 1, fill: colVal(val), width: mergedRecordedEvents[ele].width, height: mergedRecordedEvents[ele].height
        });
      }
      else {
        rect = new fabric.Rect({
          left: mergedRecordedEvents[ele].left - selectedrect.left - 20, top: mergedRecordedEvents[ele].top - selectedrect.top - 20, stroke: '#e1504b', strokeWidth: 1, fill: '#e1504b', width: mergedRecordedEvents[ele].width, height: mergedRecordedEvents[ele].height
        });
      }

      thumbnailcanvas.add(rect);
      console.log(this.recordedEvents);
    });
    thumbnailcanvas.renderAll();

    if (canvasname.indexOf('thumbnail') > -1) {
      setTimeout(() => {
        if (thumbnailcanvas.width > 200) {
          var scaleMultiplier = 200 / thumbnailcanvas.width;
          var objects = thumbnailcanvas.getObjects();
          for (var i in objects) {
            objects[i].scaleX = objects[i].scaleX * scaleMultiplier;
            objects[i].scaleY = objects[i].scaleY * scaleMultiplier;
            objects[i].left = objects[i].left * scaleMultiplier;
            objects[i].top = objects[i].top * scaleMultiplier;
            objects[i].setCoords();
          }
          var obj = thumbnailcanvas.backgroundImage;
          if (obj) {
            obj.scaleX = obj.scaleX * scaleMultiplier;
            obj.scaleY = obj.scaleY * scaleMultiplier;
          }

          thumbnailcanvas.discardActiveObject();
          thumbnailcanvas.setWidth(selectedrect.width * scaleMultiplier);
          thumbnailcanvas.setHeight(selectedrect.height * scaleMultiplier);
          thumbnailcanvas.renderAll();
          thumbnailcanvas.calcOffset();
        }

      }, 2000);
    }
  }


  onSelectionWidthChange(width) {
    let scale = width / canvas.getObjects().find(x => x.name == 'selectionrect').width;

    canvas.getObjects().find(x => x.name == 'selectionrect').set({
      scaleX: scale
    });;
    canvas.renderAll();
  }


  onSelectionHeightChange(height) {
    let scale = height / canvas.getObjects().find(x => x.name == 'selectionrect').height;

    canvas.getObjects().find(x => x.name == 'selectionrect').set({ scaleY: scale });
    canvas.renderAll();

  }
  hideSelectionPanel() {
    document.getElementById('selectionPanel').style.display = 'none';
  }

  exportCanvas() {
    this.rowData.forEach((row, i) => {
      const dataURL = (document.getElementById("canvas" + i) as any).toDataURL();
      const link = document.createElement('a');
      link.id = 'link' + i;
      link.download = 'image.png';
      link.href = dataURL;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  }
  experimentVisible = false;
  navigateML() {
    this.dataService.canvasCollection = [];
    for (let i = 0; i < this.rowData.length; i++) {
      this.dataService.canvasCollection
        .push({
          data: (document.getElementById("canvas" + i) as any)
            .toDataURL("image/png"), label: this.rowData[i][Object.keys(this.rowData[0])[Object.keys(this.rowData[0]).length - 1]], datasetSelection: 'train'
        })
    }
    this.experimentVisible = true;
  }

  backToViz() {
    this.experimentVisible = false;
  }
}


