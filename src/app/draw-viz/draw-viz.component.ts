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
  selector: 'app-draw-viz',
  templateUrl: './draw-viz.component.html',
  styleUrls: ['./draw-viz.component.css']
})
export class DrawVizComponent implements OnInit, AfterViewInit {

  markToolboxVisible: boolean = false;
  operatorToolboxVisible: boolean = false;
  valuesToolboxVisible: boolean = false;

  constructor(private route: ActivatedRoute, private dataService: DataService, private router: Router) { }
  public selection: boolean;
  ngAfterViewInit(): void {
    var brushColor = "#000000";
    var brushWidth = 5;

    // create a wrapper around native canvas element (with id="theCanvas")            
    canvas = new fabric.Canvas('theCanvas', { backgroundColor: "#ffffff", renderOnAddRemove: false });
    var width = $('#mainContainer').width();
    var height = $(document).height() - $('#theMenu').height() - 5;
    console.log("$(document).height() :" + $(document).height());
    console.log("$('#theMenu').height() :" + $('#theMenu').height());
    console.log("height :" + height);
    console.log("height: " + height);
    canvas.setWidth(width);
    canvas.setHeight(height);
    canvas.selection = false;
    canvas.connectorsHidden = false;
    canvas.selectionColor = 'rgba(229,238,244,0.5)';
    canvas.selectionDashArray = [7, 7];
    canvas.selectionBorderColor = '#7c7064';
    canvas.selectionLineWidth = 3;

    checkForRetinaDisplay();

    $("#canvasContainer").on('mousewheel', function (ev) {
      hideOpenTooltips();
      ev.preventDefault();
      var e = ev.originalEvent;
      displaywheel(e);
    });
    var isDown, origX, origY, rect;

    canvas.on('mouse:down', o => {
      if (rect != null) {
        canvas.setActiveObject(rect);
      }
      if (this.selection == true && rect == null) {
        isDown = true;
        var pointer = canvas.getPointer(o.e);
        origX = pointer.x;
        origY = pointer.y;
        var pointer = canvas.getPointer(o.e);
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

        canvas.add(rect);

        canvas.setActiveObject(rect);
        rect.name = 'selectionrect';

        document.getElementById('selectionPanel').style.display = 'block';
        document.getElementById('selectionPanel').style.left = origX + 'px';
        document.getElementById('selectionPanel').style.top = origY + 'px';
      }
    });

    canvas.on('object:moving', function (e) {
      if (e.target.name == 'selectionrect') {
        document.getElementById('selectionPanel').style.left = e.target.getLeft() + 'px';
        document.getElementById('selectionPanel').style.top = e.target.getTop() + 'px';

      }
    });

    canvas.on('mouse:move', (o) => {
      if (this.selection == true) {
        if (!isDown) return;
        var pointer = canvas.getPointer(o.e);

        if (origX > pointer.x) {
          rect.set({ left: Math.abs(pointer.x) });
        }
        if (origY > pointer.y) {
          rect.set({ top: Math.abs(pointer.y) });
        }

        rect.set({ width: Math.abs(origX - pointer.x) });
        rect.set({ height: Math.abs(origY - pointer.y) });
        canvas.remove(rect);
        canvas.add(rect);
        canvas.setActiveObject(rect);

        canvas.renderAll();

        (document.getElementById('selectionWidth') as any).value = rect.width;
        (document.getElementById('selectionHeight') as any).value = rect.height;
      }
    });

    canvas.on('mouse:up', (o) => {
      if (this.selection == true) {
        isDown = false;
      }
    });

    canvas.on('object:scaling', (o) => {
      if (o.target.name == 'selectionrect') {
        (document.getElementById('selectionWidth') as any).value = o.target.width*o.target.scaleX;
        (document.getElementById('selectionHeight') as any).value = o.target.height * o.target.scaleY;
      }
    });



    var canvasContainerElement = document.querySelector("#canvasContainer");
    var manager = new Hammer.Manager(canvasContainerElement);
    manager.add(new Hammer.Tap({ event: 'doubletap', taps: 2, threshold: 75, interval: 400, time: 600, posThreshold: 25 }));
    manager.add(new Hammer.Press({ event: 'press', time: 450 }));
    var pan1Finger = new Hammer.Pan({ event: 'pan1Finger', pointers: 1 });
    manager.add(pan1Finger);
    var pinch = new Hammer.Pinch({ event: 'pinch' });
    manager.add(pinch);
    manager.on("doubletap", function (ev) {
      console.log("%cdoubletap detected", "background: #1f656a; color: white;");
      console.log(ev);
      canvasDoubleTap(ev);
    });
    manager.on("press", function (ev) {
      console.log(ev);
      canvasPressEvent(ev);
    });

    // ###################### PANNING WITH 1 FINGER (TO CUT CONNECTORS) ###################### //
    manager.on("pan1Fingerstart", function (ev) {
      if (this.selection == false) {
        if (!canvas.activePanningMode) {
          if (!canvas.isDrawingMode && !canvas.getActiveObject() && !canvas.getActiveGroup()) {
            console.log("STARTING pan1Finger");
            console.log(ev);
            canvas.pan1Fingerstarted = true;
            gestureSetEnabled(manager, 'pinch', false);
          }
        } else if (!canvas.selection) {
          /********** PANNING **********/
          canvas.defaultCursor = "-webkit-grabbing";
          // This is to allow the canvas panning with one finger
          console.log("STARTING pan1Finger in PANNING MODE");
          console.log(ev);
          canvas.viewportLeft = canvas.viewportTransform[4];
          canvas.viewportTop = canvas.viewportTransform[5];
          gestureSetEnabled(manager, 'pinch', false);
        } else if (!canvas.getActiveObject()) {
          console.log("Starting selection");
        }
        hideOpenTooltips();
      }
    });
    manager.on("pan1Fingermove", function (ev) {
      if (this.selection == false) {
        if (!canvas.activePanningMode) {
          if (!canvas.isDrawingMode && !canvas.getActiveObject() && !canvas.getActiveGroup() && canvas.pan1Fingerstarted) {
            console.log("MOVING pan1Finger");
            console.log(ev);
          }
        } else if (!canvas.selection) {
          /********** PANNING **********/
          canvas.defaultCursor = "-webkit-grabbing";
          // This should only happen when the mouse event happens over a zone where NO objects are being touched
          if (!canvas.isDrawingMode && !canvas.getActiveObject() && !canvas.getActiveGroup()) {
            var x = -canvas.viewportLeft - ev.deltaX;
            var y = -canvas.viewportTop - ev.deltaY;
            canvas.absolutePan(new fabric.Point(x, y));
          }
        } else if (!canvas.getActiveObject()) {
          /********** SQUARE SELECTING **********/
          console.log("Selecting");
        }
      }
    });

    manager.on("pan1Fingerend", function (ev) {
      if (this.selection == false) {
        if (!canvas.activePanningMode && !canvas.isSamplingLineMode && !canvas.selection) {
          if (!canvas.isDrawingMode && !canvas.getActiveObject() && !canvas.getActiveGroup() && canvas.pan1Fingerstarted && !canvas.connectorsHidden) {
            console.log("END pan1Finger");
            console.log(ev);
            var xPage, yPage;
            var viewportLeft = canvas.viewportTransform[4];
            var viewportTop = canvas.viewportTransform[5];
            var xPage = ev.pointers[0].pageX;
            var yPage = ev.pointers[0].pageY;
            var x2 = (xPage - viewportLeft - $('#theCanvas').offset().left) / canvas.getZoom();
            var y2 = (yPage - viewportTop - $('#theCanvas').offset().top) / canvas.getZoom();
            var x1 = (xPage - ev.deltaX - viewportLeft - $('#theCanvas').offset().left) / canvas.getZoom();
            var y1 = (yPage - ev.deltaY - viewportTop - $('#theCanvas').offset().top) / canvas.getZoom();
            var p1 = new fabric.Point(x1, y1);
            var p2 = new fabric.Point(x2, y2);
            var line = { x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y };
            var crossedConnectors = getConnectorsCrossedByLine(line);
            console.log(crossedConnectors.length + " connectors crossed!");
            var totalConnectors = crossedConnectors.length;
            var i = 0;
            crossedConnectors.forEach(function (object) {
              var refreshCanvas = i === (totalConnectors - 1);
              var connector = object.connector;
              var splitPoint = object.splitPoint;
              connector.split(splitPoint, line, refreshCanvas);
              i++;
            });
            canvas.pan1Fingerstarted = false;
          }
          gestureSetEnabled(manager, 'pinch', true);
        } else if (!canvas.selection) {
          canvas.defaultCursor = "-webkit-grab";
          gestureSetEnabled(manager, 'pinch', true);
        } else if (!canvas.getActiveObject()) {
          console.log("Square selection ended");
        }
      }
    });

    // ###################### PINCHING ###################### //
    manager.on("pinchstart", function (ev) {
      if (!canvas.getActiveObject() && !canvas.getActiveGroup()) {
        canvas.zoomBeforePanning = canvas.getZoom();
      }
    });
    manager.on("pinchmove", function (ev) {
      console.log("%cpinchmove", "background: aqua");
      console.log(ev);
      if (!canvas.getActiveObject() && !canvas.getActiveGroup()) {
        var center = new fabric.Point(ev.center.x, ev.center.y);
        canvas.zoomToPoint(center, canvas.zoomBeforePanning * ev.scale);
        canvas.renderAll();
      }
    });
    managerr = manager;
    canvas.allowTouchScrolling = false;
    var lastCopiedObject = null;
    bindCanvasDefaultEvents();

    var copiedObject;
    var canvasScale = 1;

    // button Zoom In
    $("#btnZoomIn").click(function () {
      zoomIn();
    });
    // button Zoom Out
    $("#btnZoomOut").click(function () {
      zoomOut();
    });
    // button Reset Zoom
    $("#btnResetZoom").click(function () {
      resetZoom();
    });

    $("#locatorWidget").draggable({
      cursorAt: { top: 18.5, left: 60 },
      cursor: 'none',
      scroll: false,
      helper: function (event) {
        return $("<div style='z-index: 100;  margin-top: -1px; margin-left: 38px;'><li><i class='icon-screenshot icon-2x'></i></li></div>");
      }
    });
    $("#mapperWidget").draggable({
      cursorAt: { top: 18.5, left: 60 },
      cursor: 'none',
      scroll: false,
      helper: function (event) {
        return $("<div style='z-index: 100;'><li><i class='collections-mapper'></i></li></div>");
      }
    });
    $("#collectionGetterWidget").draggable({
      cursorAt: { top: 18.5, left: 60 },
      cursor: 'none',
      scroll: false,
      helper: function (event) {
        return $("<div style='z-index: 100;'><li><i class='fa fa-angellist'></i></li></div>");
      }
    });
    $("#collectionAttributeSelectorWidget").draggable({
      cursorAt: { top: 18.5, left: 60 },
      cursor: 'none',
      scroll: false,
      helper: function (event) {
        return $("<div style='z-index: 100;'><li><i class='fa fa-archive'></i></li></div>");
      }
    });
    $("#verticalCollection").draggable({
      cursorAt: { top: 18.5, left: 30 },
      cursor: 'none',
      helper: function (event) {
        return $("<div style='z-index: 100;'><li><i class='collections-collection'></i></li></div>");
      }
    });
    $("#collectionGenerator").draggable({
      cursorAt: { top: 18.5, left: 60 },
      cursor: 'none',
      scroll: false,
      helper: function (event) {
        return $("<div style='z-index: 100; margin-top: -1px; margin-left: 38px;'><li><i class='collections-generator'></i></li></div>");
      }
    });
    $("#numberGenerator").draggable({
      cursorAt: { top: 18.5, left: 60 },
      cursor: 'none',
      scroll: false,
      helper: function (event) {
        return $("<div style='z-index: 100;'><li><i class='collections-number'></i></li></div>");
      }
    });
    $("#dateGenerator").draggable({
      cursorAt: { top: 18.5, left: 60 },
      cursor: 'none',
      scroll: false,
      helper: function (event) {
        return $("<div style='z-index: 100;'><li><i class='fa fa-adn'></i></li></div>");
      }
    });
    $("#rangeGenerator").draggable({
      cursorAt: { top: 18.5, left: 28 },
      cursor: 'none',
      scroll: false,
      helper: function (event) {
        return $("<div style='z-index: 100;'><li><i class='range-generator'></i></li></div>");
      }
    });
    $("#squarePrototype").draggable({
      cursorAt: { top: 18.5, left: 60 },
      cursor: 'none',
      scroll: false,
      helper: function (event) {
        return $("<div style='z-index: 100; margin-top: -1px; margin-left: 38px;'><li><i class='mark-square'></i></li></div>");
      }
    });
    $("#pathMarkPrototype").draggable({
      cursorAt: { top: 18.5, left: 60 },
      cursor: 'none',
      scroll: false,
      helper: function (event) {
        return $("<div style='z-index: 100; margin-top: -1px; margin-left: 38px;'><li><i class='mark-pathMark'></i></li></div>");
      }
    });
    $("#rectPrototype").draggable({
      cursorAt: { top: 18.5, left: 60 },
      cursor: 'none',
      scroll: false,
      helper: function (event) {
        return $("<div style='z-index: 100; margin-top: -1px; margin-left: 38px;'><li><i class='mark-rectangle'></i></li></div>");
      }
    });
    $("#circlePrototype").draggable({
      cursorAt: { top: 18.5, left: 60 },
      cursor: 'none',
      scroll: false,
      helper: function (event) {
        return $("<div style='z-index: 100; margin-top: -1px; margin-left: 38px;'><li><i class='mark-circle'></i></li></div>");
      }
    });
    $("#fatFontPrototype").draggable({
      cursorAt: { top: 18.5, left: 60 },
      cursor: 'none',
      scroll: false,
      helper: function (event) {
        return $("<div style='z-index: 100; margin-top: -1px; margin-left: 38px;'><li><i class='mark-fatfont'></i></li></div>");
      }
    });
    $("#ellipsePrototype").draggable({
      cursorAt: { top: 18.5, left: 60 },
      cursor: 'none',
      helper: function (event) {
        return $("<div style='z-index: 100; margin-top: -1px; margin-left: 38px;'><li><i class='mark-ellipse'></i></li></div>");
      }
    });
    $("#isColorData").draggable({
      cursorAt: { top: 18.5, left: 60 },
      cursor: 'none',
      helper: function (event) {
        return $("<div style='z-index: 100; margin-top: -4px; margin-left: 28px;'><li><i class='value-color' style='border:1px solid #aaa; border-radius: 10em; padding-top: 10px; padding-bottom: 10px; padding-left: 10px; padding-right: 10px;'></i></li></div>");
      }
    });
    $("#isStringData").draggable({
      cursorAt: { top: 18.5, left: 60 },
      cursor: 'none',
      scroll: false,
      helper: function (event) {
        return $("<div style='z-index: 100; margin-top: -4px; margin-left: 28px;'><li><i class='value-string' style='border:1px solid #aaa; border-radius: 10em; padding-top: 10px; padding-bottom: 10px; padding-left: 10px; padding-right: 10px;'></i></li></div>");
      }
    });
    $("#isNumericData").draggable({
      cursorAt: { top: 18.5, left: 60 },
      cursor: 'none',
      scroll: false,
      helper: function (event) {
        return $("<div style='z-index: 100; margin-top: -4px; margin-left: 28px;'><li><i class='value-number' style='border:1px solid #aaa; border-radius: 10em; padding-top: 10px; padding-bottom: 10px; padding-left: 10px; padding-right: 10px;'></i></li></div>");
      }
    });
    $("#collectionValue").draggable({
      cursorAt: { top: 18.5, left: 60 },
      cursor: 'none',
      scroll: false,
      helper: function (event) {
        return $("<div style='z-index: 100; margin-top: -20px; margin-left: -45px;'><li><i class='fa-flickr icon-2x' style='border:1px solid #aaa; border-radius: 5em; padding-top: 13px; padding-bottom: 10px; padding-left: 20px; padding-right: 47px;'></i></li></div>");
      }
    });
    $("#isShapeData").draggable({
      cursorAt: { top: 18.5, left: 60 },
      cursor: 'none',
      scroll: false,
      helper: function (event) {
        return $("<div style='z-index: 100; margin-top: -4px; margin-left: 28px;'><li><i class='value-shape' style='border:1px solid #aaa; border-radius: 10em; padding-top: 10px; padding-bottom: 10px; padding-left: 10px; padding-right: 10px;'></i></li></div>");
      }
    });
    $("#isDurationData").draggable({
      cursorAt: { top: 18.5, left: 60 },
      cursor: 'none',
      scroll: false,
      helper: function (event) {
        return $("<div style='z-index: 100; margin-top: -4px; margin-left: 28px;'><li><i class='value-duration' style='border:1px solid #aaa; border-radius: 10em; padding-top: 10px; padding-bottom: 10px; padding-left: 10px; padding-right: 10px;'></i></li></div>");
      }
    });
    $("#isDateAndTimeData").draggable({
      cursorAt: { top: 18.5, left: 60 },
      cursor: 'none',
      scroll: false,
      helper: function (event) {
        return $("<div style='z-index: 100; margin-top: -4px; margin-left: 28px;'><li><i class='value-dateAndTime' style='border:1px solid #aaa; border-radius: 10em; padding-top: 10px; padding-bottom: 10px; padding-left: 10px; padding-right: 10px;'></i></li></div>");
      }
    });
    $("#addition-operator").draggable({
      cursorAt: { top: 18.5, left: 8 },
      cursor: 'none',
      scroll: false,
      helper: function (event) {
        return $("<div style='z-index: 100; margin-left: -36px; margin-top: 0px; padding-left: 0px; padding-rigth: 60px;'><li><i class='operator-additionIcon' style='border:1px solid #aaa; border-radius: 5em; padding: 1em;'></i></li></div>");
      }
    });
    $("#subtraction-operator").draggable({
      cursorAt: { top: 18.5, left: 8 },
      cursor: 'none',
      scroll: false,
      helper: function (event) {
        return $("<div style='z-index: 100; margin-left: -36px; margin-top: 0px; padding-left: 0px; padding-rigth: 60px;'><li><i class='operator-subtractionIcon' style='border:1px solid #aaa; border-radius: 5em; padding: 1em;'></i></li></div>");
      }
    });
    $("#multiplication-operator").draggable({
      cursorAt: { top: 18.5, left: 8 },
      cursor: 'none',
      scroll: false,
      helper: function (event) {
        return $("<div style='z-index: 100; margin-left: -36px; margin-top: 0px; padding-left: 0px; padding-rigth: 60px;'><li><i class='operator-multiplicationIcon' style='border:1px solid #aaa; border-radius: 5em; padding: 1em;'></i></li></div>");
      }
    });
    $("#division-operator").draggable({
      cursorAt: { top: 18.5, left: 0 },
      cursor: 'none',
      scroll: false,
      helper: function (event) {
        return $("<div style='z-index: 100; margin-left: -36px; margin-top: 0px; padding-left: 0px; padding-rigth: 60px;'><li><i class='operator-divisonIcon' style='border:1px solid #aaa; border-radius: 5em; padding: 1em;'></i></li></div>");
      }
    });
    $("#xFunction").draggable({
      cursorAt: { top: 20, left: 23 },
      cursor: 'none',
      scroll: false,
      helper: function (event) {
        return $("<div style='z-index: 100;'><li><i class='function-x'></i></li></div>");
      }
    });
    $("#emptyFunction").draggable({
      cursorAt: { top: 20, left: 23 },
      cursor: 'none',
      scroll: false,
      helper: function (event) {
        return $("<div style='z-index: 100;'><li><i class='function-empty'></i></li></div>");
      }
    });
    $("#x2Function").draggable({
      cursorAt: { top: 20, left: 23 },
      cursor: 'none',
      scroll: false,
      helper: function (event) {
        return $("<div style='z-index: 100;'><li><i class='function-x2'></i></li></div>");
      }
    });
    $("#x3Function").draggable({
      cursorAt: { top: 20, left: 23 },
      cursor: 'none',
      scroll: false,
      helper: function (event) {
        return $("<div style='z-index: 100;'><li><i class='function-x3'></i></li></div>");
      }
    });
    $("#sinXFunction").draggable({
      cursorAt: { top: 20, left: 23 },
      cursor: 'none',
      scroll: false,
      helper: function (event) {
        return $("<div style='z-index: 100;'><li><i class='function-sinx'></i></li></div>");
      }
    });
    $("#cosXFunction").draggable({
      cursorAt: { top: 20, left: 23 },
      cursor: 'none',
      scroll: false,
      helper: function (event) {
        return $("<div style='z-index: 100;'><li><i class='function-cosx'></i></li></div>");
      }
    });
    $("#logXFunction").draggable({
      cursorAt: { top: 20, left: 23 },
      cursor: 'none',
      scroll: false,
      helper: function (event) {
        return $("<div style='z-index: 100;'><li><i class='function-logx'></i></li></div>");
      }
    });
    $("#sqrtXFunction").draggable({
      cursorAt: { top: 20, left: 23 },
      cursor: 'none',
      scroll: false,
      helper: function (event) {
        return $("<div style='z-index: 100;'><li><i class='function-sqrtx'></i></li></div>");
      }
    });
    $("#theCanvas").droppable({
      accept: "#addition-operator, #subtraction-operator, #multiplication-operator, #division-operator, #xFunction, #emptyFunction, #x2Function, #x3Function, #sinXFunction, #cosXFunction, #logXFunction, #sqrtXFunction, #playerWidget, #locatorWidget, #mapperWidget, #collectionGetterWidget, #collectionAttributeSelectorWidget, #verticalCollection, #collectionGenerator, #numberGenerator, #rangeGenerator, #dateGenerator, #rectPrototype, #squarePrototype, #pathMarkPrototype, #circlePrototype, #fatFontPrototype, #ellipsePrototype, #isColorData, #isStringData, #isNumericData, #collectionValue, #isDurationData, #isDateAndTimeData, #isShapeData",
      drop: canvasDropFunction
    });

    adjustCanvasDimensions();

    var drop = document.querySelector('#drop');
    addEvent(drop, 'dragover', cancel);
    addEvent(drop, 'dragenter', cancel);
    addEvent(drop, 'drop', function (e) {
      console.log("*** External page element dropped ***");
      if (e.preventDefault) {
        e.preventDefault(); // stops the browser from redirecting off to the text.
      }
      var canvasCoords = getCanvasCoordinates(e);
      if (e.dataTransfer.types) {
        console.log("e.dataTransfer.types:");
        console.log(e.dataTransfer.types);
        var totalTypes = e.dataTransfer.types.length;
        for (var i = 0; i < totalTypes; i++) {
          var type = e.dataTransfer.types[i];
          var contentType = type;
          var dataString = e.dataTransfer.getData(type);
          console.log("content-type " + contentType);
          console.log("dataString: " + dataString);
          if (contentType === "text/html") {
            var parsedHTML = $.parseHTML(dataString);
            console.log("***" + dataString, 'red', 'white');
            var found = addVisualElementFromHTML(parsedHTML, canvasCoords, true);
            if (found) {
              break;
            }
          }

        }
      } else {
        console.log(e.dataTransfer.getData('Text'));
      }
      return false;
    });
    // When the system starts up, the panning mode is active by default
    applyActiveMenuButtonStyle($("#panningModeButton"));
    activatePanningMode();

  }

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
  highlight: boolean[]=[];
  ngOnInit(): void {
    if (sessionStorage.getItem('rowdata') != null) {
      this.rowData = this.dataService.rowdata = JSON.parse(sessionStorage.getItem('rowdata'));
      this.rowData.forEach(a => { this.highlight.push(false) })
    }

    this.loaddata(0);
  }


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
        if (sessionStorage.getItem('selectedlabel')!=d) {
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
      } catch {}
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
        else if (domainoperator== 'addition') {
          val = 0
          for (let i1 = 0; i1 < domainsource.length; i1++)
            val = val + this.rowData[index][i1];
        }
        else if (domainoperator== 'multiplication') {
          val = 1
          for (let i1 = 0; i1 < domainsource.length; i1++)
            val = val * this.rowData[index][i1];
        }
        else if (domainoperator== 'division') {
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
        if (canvas.getObjects()[i].customshape==true) {
          let label = canvas.getObjects()[i].visualProperties.find(x => x.attribute == 'height' || x.attribute == 'width').inConnectors[0].source.label;

          let incollection, outcollection, domainsource, domainoperator;

          if (label) {
            let obj = canvas.getObjects()[i];
            let mapper;
            if (obj?.visualProperties.find(x => x["attribute"] == "fill").inConnectors.length >0) {
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
              this.recordedEvents.push({ data: canvas.getObjects()[i].visualProperties.find(x => x.attribute == 'height').inConnectors[0].source.label, obj: obj.visualProperties.find(x => x["attribute"] == "height")});
              this.recordedEvents.push({ data: canvas.getObjects()[i].visualProperties.find(x => x.attribute == 'width').inConnectors[0].source.label, obj: obj.visualProperties.find(x => x["attribute"] == "width")});
            }
          }
        }
      } catch {}
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
        mergedRecordedEvents[obj] = { left: element.parentObject.left, top: element.parentObject.top, fill: element.fill, value: element.value.number, data: [ele['data']], domain: ele.domain, range: ele.range, domainsource: ele.domainsource, domainoperator: ele.domainoperator};
      }
      else{
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
        var rect = new fabric.Rect({ left: mergedRecordedEvents[ele].left - 20, top: mergedRecordedEvents[ele].top - 20, fill:'rgba(0,0,0,0)', strokeWidth: 1,  width: mergedRecordedEvents[ele].width, height: mergedRecordedEvents[ele].height });
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
        if (canvas.getObjects()[i].customshape==true) {
          let label = canvas.getObjects()[i].visualProperties.find(x => x.attribute == 'height' || x.attribute == 'width').inConnectors[0].source.label;
          if (label) {

            let obj = canvas.getObjects()[i];

            let incollection, outcollection, domainsource, domainoperator;

            let mapper;
            if (obj?.visualProperties.find(x => x["attribute"] == "fill").inConnectors.length > 0) {
              mapper= obj?.visualProperties.find(x => x["attribute"] == "fill").inConnectors[0].source.mapper;
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
              this.recordedEvents.push({ data: canvas.getObjects()[i].visualProperties.find(x => x.attribute == 'height').inConnectors[0].source.label, obj: obj.visualProperties.find(x => x["attribute"] == "height")});
              this.recordedEvents.push({ data: canvas.getObjects()[i].visualProperties.find(x => x.attribute == 'width').inConnectors[0].source.label, obj: obj.visualProperties.find(x => x["attribute"] == "width")});
            }
          }
        }
      } catch {}
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
        mergedRecordedEvents[obj] = { left: element.parentObject.left, top: element.parentObject.top, fill: element.fill, value: element.value.number, data: [ele['data']], domain: ele.domain, range: ele.range, domainsource: ele.domainsource, domainoperator:ele.domainoperator};
      }
      else{
      mergedRecordedEvents[obj]['data'].push(ele['data'])
      }
      mergedRecordedEvents[obj][element['attribute']] = (element.parentObject[element['attribute']] / element.value.unscaledValue) * row[ele['data']];
    });
    Object.keys(mergedRecordedEvents).forEach(ele => {
      let colVal;
      if (mergedRecordedEvents[ele].domain!=null && typeof(mergedRecordedEvents[ele].domain[0]) == 'string') {
        colVal = d3.scaleOrdinal()
          .domain(mergedRecordedEvents[ele].domain)
          .range(mergedRecordedEvents[ele].range)
      }
      else if (mergedRecordedEvents[ele].domain!=null && typeof (mergedRecordedEvents[ele].domain[0])== 'number') {
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
  experimentVisible=false;
  navigateML() {
    this.dataService.canvasCollection = [];
    for (let i = 0; i < this.rowData.length; i++) {
      this.dataService.canvasCollection
        .push({
          data: (document.getElementById("canvas" + i) as any)
            .toDataURL("image/png"), label: this.rowData[i][Object.keys(this.rowData[0])[Object.keys(this.rowData[0]).length - 1]], datasetSelection: 'train'
        })
    }
    this.experimentVisible=true;
  }

  backToViz()
  {
    this.experimentVisible=false;
  }
}


