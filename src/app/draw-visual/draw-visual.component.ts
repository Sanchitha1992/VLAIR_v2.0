import { AfterViewInit, Component, OnInit, ɵCREATE_ATTRIBUTE_DECORATOR__POST_R3__ } from '@angular/core';
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

  constructor(private route: ActivatedRoute, private dataService: DataService, private router: Router) { }
  public selection: boolean;


  crop() {
    console.log(canvas.getObjects());
    let rect = canvas.getObjects().find(a => a.name == 'selectionrect')
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
      })
      this.rowData.forEach(a => { this.highlight.push(false) })
    }
    this.canvas = new fabric.Canvas("maincanvas");
    this.canvas.setDimensions({ width: 1050, height: 220 });

    this.bottomcanvas = new fabric.Canvas("bottomcanvas");
    this.bottomcanvas.setDimensions({ width: 1050, height: 220 });

    this.drawgraph(this.canvas);

    //this.loaddata(0);
  }

  ngAfterViewInit(): void {
    setTimeout(() => { this.draganddropFunction(); }, 1000)

  }

  changeColor(value) {
    this.selectedObject.fill = value
    this.selectedObject.border = value
    this.canvas.renderAll();
  }

  changex(value) {
    this.selectedObject.left = parseFloat(value);
    this.canvas.renderAll();
  }

  changey(value) {
    this.selectedObject.top = parseFloat(value);
    this.canvas.renderAll();
  }

  selectedObject: any;
  positionX: number;
  positionY: number;
  visibility: any;
  radius: number;
  side: number;
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
        if (this.selectedObject.type == 'rectangle') {
          this.xposition = this.selectedObject.left;
          this.yposition = this.selectedObject.top;
          this.color = this.selectedObject.fill;
          this.length = this.selectedObject.height;
          this.width = this.selectedObject.width;
          this.area = this.length * this.width;
          this.visibility = { 'xposition': true, 'yposition': true, 'color': true, 'length': true, 'width': true, 'side': false, 'radius': false }
        }
        else if (this.selectedObject.type == 'square') {
          this.xposition = this.selectedObject.left;
          this.yposition = this.selectedObject.top;
          this.color = this.selectedObject.fill;
          this.side = this.selectedObject.height;
          this.area = this.side * this.side;
          this.visibility = { 'xposition': true, 'yposition': true, 'color': true, 'length': false, 'width': false, 'side': true, 'radius': false }
        }
        else if (this.selectedObject.type == 'circle') {
          this.xposition = this.selectedObject.left;
          this.yposition = this.selectedObject.top;
          this.color = this.selectedObject.fill;
          this.radius = this.selectedObject.radius;
          this.area = 3.14 * this.radius * this.radius;
          this.visibility = { 'xposition': true, 'yposition': true, 'color': true, 'length': false, 'width': false, 'side': false, 'radius': true }
        }
        setTimeout(() => { this.draganddropFunction(); }, 1000)

      }
    });
    let val = 0
    let source;
    let isoperatorselected;
    let ismapperselected;
    let operator;
    let ismidmapperselected;
    let ismidoperatorselected;
    this.bottomcanvas.on("mouse:down", (event) => {
      source = event.target
      let pointer = this.bottomcanvas.getPointer(event.e);
      this.positionX = pointer.x;
      this.positionY = pointer.y;
      //console.log(event.target)
      if (event.target!=null && event.target.type == 'operator') {
        //operator=document.createElement("div");
        //operator.innerText="+"
        //operator.style.position='absolute'
        //operator.style.left=(this.positionX)+'px';
        //operator.style.top=(this.bottomcanvas._offset.top+this.positionY)+'px';
        //document.body.append(operator)
        //operator.draggable();
        isoperatorselected = true;
        ismapperselected = false;
        ismidmapperselected=false;
        ismidoperatorselected=false;
      }
      else if (event.target != null && event.target.type == 'mapper') {
        isoperatorselected = false;
        ismapperselected = true;
        ismidmapperselected=false;
        ismidoperatorselected=false;
      }
      else {
        isoperatorselected = false;
        ismapperselected = false;
        ismidmapperselected=false;
        ismidoperatorselected=false;
      }
    });

    //document.addEventListener("mousemove", (event) => {
    //  if (isoperatorselected) {
    //    operator[0].style.left = (event.pageX)+20 + 'px';
    //    operator[0].style.top = (event.pageY)+20 + 'px';
    //  }
    //})

    $("#mapperPopup").focusout(function(){
      $('#mapperPopup').css('display','none')
    })

    document.addEventListener("mousedown",(evnt:any)=>{
      console.log(evnt)
      if(evnt.path[1].className=='colormidpanel'){
      ismidmapperselected=true;
      isoperatorselected = false;
      ismapperselected = false;
      ismidoperatorselected=false;
      source=evnt; 
      }
      else if(evnt.srcElement.innerText.indexOf('+')>-1 || evnt.srcElement.innerText.indexOf('-')>-1 || evnt.srcElement.innerText.indexOf('*')>-1 || evnt.srcElement.innerText.indexOf('/')>-1)
      {
      ismidmapperselected=false;
      isoperatorselected = false;
      ismapperselected = false;
      ismidoperatorselected=true;
      source=evnt; 
      }
    })

    document.addEventListener("mouseup", evnt => {
      //console.log(evnt)
      let positionX = evnt.pageX;
      let positionY = evnt.pageY;
      //console.log(document.elementFromPoint(positionX, positionY))

      if (isoperatorselected && document.elementFromPoint(positionX, positionY).id == 'keytab') {
        //operator = $("<div class='keys' style='display:none;position:absolute;left:" + (this.positionX) + 'px' + ";top:" + (this.bottomcanvas._offset.top + this.positionY) + 'px' + ";font-size: 14px;background-color:#460073;border: 1px solid #460073;padding: 5px 10px;margin: 2px;display: inline - flex;color: #fff;'>" + this.calculateMapping(source) + "</div>")
        //operator[0].style.display = 'inline-block';
        //operator[0].style.position = 'relative';
        //operator[0].style.left = '0px';
        //operator[0].style.top = '0px';
        //$('#keytab').append(operator);
        this.keys.push( this.calculateMapping(source))
        isoperatorselected = false
      }
      else if (ismapperselected && document.elementFromPoint(positionX, positionY).id == 'keytab') {
        let leftitems = source._objects[0].items.map(a => parseInt(a.value));
        let rightitems = source._objects[1].items.map(a => a.value);
        let colVal = d3.scaleLinear().domain([d3.min(leftitems),d3.max(leftitems)]).range(rightitems)
        let color = colVal(parseInt(this.rowData[0][source.column]))
        color = '#' + color.match(/\d+/g).map(function (x) {
          x = parseInt(x).toString(16);
          return (x.length == 1) ? "0" + x : x;
        }).join("");
        let colorelement=$("<div class='colormidpanel' style='display:inline-block'><button style='height:20px;width:50px;background-color:"+color+"'/><input type='hidden' value="+source.name+"><input type='hidden' value="+color+"></div>");
        $('#keytab').append(colorelement);
      }
      else if(ismidmapperselected && this.selectedObject!=null)
      {
        this.selectedObject.mapper=this.bottomcanvas.getObjects().filter(a=>a.name==source.path[1].children[1].value)
        this.color='#' + source.srcElement.style['backgroundColor'].match(/\d+/g).map(function (x) {
          x = parseInt(x).toString(16);
          return (x.length == 1) ? "0" + x : x;
        }).join("");
        this.selectedObject.fill=source.srcElement.style['backgroundColor']
        this.canvas.renderAll()
      }
      else if(ismidoperatorselected && this.selectedObject!=null){
        let evaluatable=source.srcElement.innerText;
        if(document.elementFromPoint(positionX, positionY).id == 'length'){
          for(let i=0;i<this.keys.length;i++)
          {
          evaluatable=evaluatable.replace(new RegExp(this.keys[i], 'g'), 'parseFloat(this.rowData[0]["'+this.keys[i]+'"])');
          }
          this.length = eval(evaluatable)
        this.selectedObject.height=this.length
      }
      else if(document.elementFromPoint(positionX, positionY).id == 'width'){
        for(let i=0;i<this.keys.length;i++)
        {
        evaluatable=evaluatable.replace(new RegExp(this.keys[i], 'g'), 'parseFloat(this.rowData[0]["'+this.keys[i]+'"])');
        }
        this.width = eval(evaluatable)
      this.selectedObject.width=this.width
    }
      }
      ismapperselected=false;
      ismidmapperselected=false;
      isoperatorselected=false;
    })

    this.bottomcanvas.on("mouse:up", (event) => {
      if (source != null && source.type == 'operator' && event.target != null) {
        let pointer = this.bottomcanvas.getPointer(event.e);
        //console.log(this.positionX, this.positionY, pointer.x, pointer.y)
        event.target.level = 'children'
        if (source.level != 'children') {
          source.level = 'parent'
        }
        if (source.children == null) { source.children = [] }
        source.children.push(event.target);
        let line = new fabric.Line([this.positionX, this.positionY, pointer.x, pointer.y], { stroke: 'black',selectable:false });
        this.bottomcanvas.add(line);
        source = null;
      }

      if (event.target != null && event.target.type != null && event.target.type.indexOf('Data') > -1) {

        $('#mapperPopup').css('display', 'block')
        $('#mapperPopup').css('left', event.target.left + 20 + 'px')
        $('#mapperPopup').css('top', this.bottomcanvas._offset.top + event.target.top + 'px')
        if (event.target.type == 'isColorData') {
          $('#mappedPopuptext').attr('type', 'color')
        }
        else  {
          $('#mappedPopuptext').attr('type', 'text')
        }
        $('#mappedPopuptext').val(event.target.value)
        selectedPopupElement = event.target;
      }
    });
    let selectedPopupElement;
    $("#mappedPopuptext").change(function(){
      selectedPopupElement.value = $('#mappedPopuptext').val()
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
        this.length = this.rowData[0][ui.draggable[0].id.replace("id", "")]
        this.selectedObject.height =this.length                                                           
        this.canvas.renderAll()
      }
    });
    $("#divwidth").droppable({
      accept: keys,
      drop: (ev, ui) => {
        this.width = this.rowData[0][ui.draggable[0].id.replace("id", "")]
        this.selectedObject.width = this.width
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
      cursorAt: { top: 18.5, left: 60 },
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
          let mappers = this.bottomcanvas.getObjects().filter(x => x.type.indexOf('mapper') > -1)
          for (let i = 0; i < mappers.length; i++) {
            let name = mappers[i].type;
            if (Math.abs(ui.offset.left - mappers[i].left) < 50 || Math.abs(ui.offset.left - (mappers[i].left + 150)) < 50)
            {
              let leftmapper = mappers[i]._objects[0];
              let rightmapper = mappers[i]._objects[1];

              if (leftmapper.items == null) {
                leftmapper.items = [];
              }
              if (rightmapper.items == null) {
                rightmapper.items = [];
              }
              //let mapid = leftmapper.filter(x => x.mappedto == name + i) == null ? 1 : leftmapper.filter(x => x.mappedto == name + i).length + 1
              let letter;
              if (ui.draggable[0].id == 'isNumericData') {
                letter = new fabric.IText('#', {
                  fontFamily: 'arial', fill: '#460073', fontSize: 35, type: ui.draggable[0].id,value:"",selectable:false
                })
              }
              else if (ui.draggable[0].id == 'isColorData') {
                letter = new fabric.Path('m -1662.5927,2965.5148 c 1.9739,3.398 4.0351,6.4881 6,9.3438 1.965,2.8556 3.8358,5.4801 5.4688,7.9687 1.633,2.4885 3.022,4.8287 4,7.125 0.4891,1.148 0.8603,2.2733 1.125,3.4063 0.2647,1.1327 0.4062,2.2665 0.4062,3.4062 0,1.1395 -0.1483,2.2698 -0.375,3.3438 -0.2266,1.0737 -0.5383,2.1073 -0.9687,3.0937 -0.8608,1.9728 -2.0858,3.759 -3.625,5.25 -1.5392,1.4906 -3.3709,2.698 -5.4063,3.5313 -1.0176,0.4163 -2.1112,0.7807 -3.2187,1 -1.1076,0.2192 -2.2316,0.3125 -3.4063,0.3125 -1.1745,0 -2.3256,-0.093 -3.4375,-0.3125 -1.1118,-0.2193 -2.1941,-0.5835 -3.2187,-1 -2.0487,-0.8335 -3.8875,-2.0406 -5.4375,-3.5313 -1.55,-1.491 -2.8036,-3.2772 -3.6563,-5.25 -0.4261,-0.9864 -0.7541,-2.02 -0.9687,-3.0937 -0.2146,-1.074 -0.3032,-2.2044 -0.2813,-3.3438 0.029,-1.5282 0.2077,-2.8851 0.5,-4.2187 0.2923,-1.3339 0.6751,-2.6098 1.1875,-3.8125 1.0251,-2.4062 2.4464,-4.6096 4.0938,-6.875 1.6474,-2.2654 3.5123,-4.6158 5.4375,-7.25 1.925,-2.6344 3.9231,-5.5807 5.7812,-9.0938 z m -7.9375,23.625 c -0.4883,0.7747 -0.9597,1.5154 -1.3125,2.3438 -0.3093,0.7263 -0.5425,1.5382 -0.7187,2.3437 -0.1766,0.8052 -0.2637,1.6397 -0.2813,2.5625 -0.013,0.6879 0.027,1.3515 0.1563,2 0.1296,0.6485 0.3364,1.2482 0.5937,1.8438 0.5148,1.1911 1.283,2.256 2.2188,3.1562 0.9359,0.9002 2.0443,1.6219 3.2812,2.125 0.6187,0.2515 1.2348,0.524 1.9063,0.6563 0.6712,0.1322 1.3846,0.1562 2.0937,0.1562 0.7093,0 1.3627,-0.024 2.0313,-0.1562 0.6688,-0.1323 1.3542,-0.405 1.9687,-0.6563 1.229,-0.5031 2.3207,-1.2248 3.25,-2.125 0.9294,-0.9002 1.699,-1.9651 2.2188,-3.1562 0.2599,-0.5956 0.4569,-1.1953 0.5937,-1.8438 0.013,-0.037 -0.013,-0.088 0,-0.125 z', {
                  fontFamily: 'arial', fill: '#460073', type: ui.draggable[0].id,value:"",selectable:false
                })
                letter.set({scaleY: .7,scaleX: .7});
              }
              else if (ui.draggable[0].id == 'isStringData') {
                letter = new fabric.Path('m 112.375,55.0625 0,20.09375 8.6875,0 c 0,0 -0.0419,8.2293 -1.28125,11.625 -1.2391,3.3959 -2.6875,5.28125 -2.6875,5.28125 l 2.125,3.90625 c 0,0 6.7091,-5.4148 9.1875,-11.1875 2.4781,-5.773 2.89225,-13.3194 2.90625,-17.8125 l 0.0312,-11.90625 z m 24.96875,0 0,20.09375 8.6875,0 c 0,0 -0.0107,8.2293 -1.25,11.625 -1.2391,3.3959 -2.71875,5.28125 -2.71875,5.28125 l 2.15625,3.90625 c 0,0 6.7091,-5.4148 9.1875,-11.1875 2.4781,-5.773 2.89225,-13.3194 2.90625,-17.8125 l 0.0312,-11.90625 z', {
                   fontFamily: 'arial', fill: '#460073', fontSize: 25, type: ui.draggable[0].id,value:"",selectable:false
                })
              }
                if (Math.abs(ui.offset.left - (mappers[i].left+50)) < 50) {
                  letter.left = mappers[i].left + 63;
                  letter.top = mappers[i].top + (leftmapper.items.length*40)+10;
                  leftmapper.items.push(letter)
                  if (leftmapper.items.length == 1) {
                    let firstleftitem = this.cloneObject(letter)
                    firstleftitem.left = mappers[i].left + 10
                    firstleftitem.top = mappers[i].top + 50;
                    this.bottomcanvas.add(firstleftitem)
                  }
                }
                if (Math.abs(ui.offset.left - (mappers[i].left + 150)) < 50) {
                  letter.left = mappers[i].left + 213,
                  letter.top = mappers[i].top + (rightmapper.items.length * 40)+10
                  rightmapper.items.push(letter)
                  if (rightmapper.items.length == 1) {
                    let firstrightitem = this.cloneObject(letter)
                    firstrightitem.left = mappers[i].left + 280
                    firstrightitem.top = mappers[i].top + 50;
                    this.bottomcanvas.add(firstrightitem)
                  }
                }
             
              this.bottomcanvas.add(letter);
            }
          }
        }
        else if (ui.draggable[0].id == 'addition-operator') {
          let plusoperator = new fabric.IText('+', {
            left: ui.offset.left,
            top: ui.offset.top - this.bottomcanvas._offset.top,
            fontFamily: 'arial',
            fill: '#460073',
            fontSize: 50,
            type: 'operator',
            selectable: false
          })
          this.bottomcanvas.add(plusoperator);

        }
        else if (ui.draggable[0].id == 'mapperWidget') {
          let shape = new fabric.Rect({
            left: ui.offset.left,
            top: ui.offset.top - this.bottomcanvas._offset.top,
            originX: 'left',
            originY: 'top',
            width: 50,
            height: 150,
            angle: 0,
            fill: 'transparent',
            transparentCorners: false
          });
          let rightshape = new fabric.Rect({
            left: ui.offset.left + 150,
            top: ui.offset.top - this.bottomcanvas._offset.top,
            originX: 'left',
            originY: 'top',
            width: 50,
            height: 150,
            angle: 0,
            fill: 'transparent',
            transparentCorners: false
          });
          let leftinput = new fabric.Circle({
            left: ui.offset.left-50,
            top: ui.offset.top - this.bottomcanvas._offset.top+50,
            originX: 'left',
            originY: 'top',
            radius: 20,
            fill: 'transparent',
          });
          let rightoutput = new fabric.Circle({
            left: ui.offset.left + 222,
            top: ui.offset.top - this.bottomcanvas._offset.top + 47,
            originX: 'left',
            originY: 'top',
            radius: 20,
            fill: 'transparent',
          });
          let objs = [leftinput,shape, rightshape,rightoutput];
          let element = new fabric.Group(objs);
          element.selectable=false
          element.type = 'mapper';
          element.name='mapper'+this.bottomcanvas.getObjects().filter(a=>a.type=='mapper').length+1;
          this.bottomcanvas.add(element)
        }
        else if ($(ui.draggable).hasClass("keys")) {
          let mappers = this.bottomcanvas.getObjects().filter(x => x.type.indexOf('mapper') > -1)
          let mapping = false;
          
          for (let k = 0; k < mappers.length; k++) {
            if (Math.abs(ui.offset.left - mappers[k].left+10) < 50) {
              mappers[k].column = ui.draggable[0].id.replace('id', '')
              mapping=true
            }
          }
          if (mapping == false) {
            let a = new fabric.Rect({
              left: ui.offset.left,
              top: ui.offset.top - this.bottomcanvas._offset.top,
              originX: 'left',
              originY: 'top',
              width: $(ui.draggable)[0].offsetWidth,
              height: $(ui.draggable)[0].offsetHeight,
              fill: '#460073',
              transparentCorners: false
            })
            let b = new fabric.IText(ui.draggable[0].id.replace('id', ''), {
              left: ui.offset.left + 15,
              top: ui.offset.top - this.bottomcanvas._offset.top + 10,
              fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
              fill: 'white',
              fontSize: 13,
            })
            let objs = [a, b];
            let element = new fabric.Group(objs);
            element.type = 'field'
            element.fieldName = ui.draggable[0].id.replace('id', '');
            this.bottomcanvas.add(element)
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
            left: ui.offset.left + 70,
            top: ui.offset.top - 70,
            originX: 'left',
            originY: 'top',
            width: 30,
            height: 50,
            angle: 0,
            fill: '#460073',
            transparentCorners: false
          });
          shape.type = 'rectangle'
          shape.name = 'rect 1';
          this.xposition = shape.left - this.graph.left;
          this.yposition = this.graph.top + this.graph.height - shape.top - shape.height;
          this.color = shape.fill;
          this.length = shape.height;
          this.width = shape.width;
          this.area = this.length * this.width;
        }
        if (ui.draggable[0].id == 'squarePrototype') {
          shape = new fabric.Rect({
            left: ui.offset.left + 70,
            top: ui.offset.top - 70,
            originX: 'left',
            originY: 'top',
            width: 30,
            height: 30,
            angle: 0,
            fill: '#460073',
            transparentCorners: false
          });
          shape.type = 'square'
        }
        if (ui.draggable[0].id == 'circlePrototype') {
          shape = new fabric.Circle({
            left: ui.offset.left + 70,
            top: ui.offset.top - 70,
            radius: 20,
            fill: '#460073',
          });
          shape.type = 'circle'
          this.radius = shape.radius;
        }
        this.canvas.add(shape);
      }
    });
    this.canvas.on('object:moving', (event) => {
      this.xposition = event.target.left - this.graph.left;
      this.yposition = this.graph.top + this.graph.height - event.target.top - event.target.height;
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
    if (child.type == "field") {
      this.calculation += child.fieldName;
    }
    else {
      this.calculateOperators(child.children[0])
      this.calculation += child.text;
      this.calculateOperators(child.children[1])
    }
  }

  length: number;
  width: number;
  area: number
  drawgraph(canvas) {
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

    canvas.add(this.graph);
  }

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
      let multiplicationObject = canvas.getObjects().find(x => x.type == 'multiplication');
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
    let selectedrect = canvas.getObjects().find(a => a.name == 'selectionrect')

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


