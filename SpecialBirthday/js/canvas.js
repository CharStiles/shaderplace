//TOOD: DISABLE REDO/UNDO IF IT WON'T DO ANYTHING
//TODO: MAKE MOBILE FRIENDLY
//TOOD: CHECK COLOR ACCESSIBILITY ON ELEMENTS AND CHANGE IF NEEDED
//TOOD: MAKE BRUSH ON CANVAS BE A CIRCLE WITH THE BRUSH SIZE
//TOOD: SET CURRENT SLIDER VAL NEXT TO SLIDER

class HistoryItem {
  constructor(startX, startY, endX, endY, color, weight) {
    this.startX = startX;
    this.startY = startY;
    this.endX = endX;
    this.endY = endY;
    this.color = color;
    this.weight = weight;
  }
  draw() {
    fill(this.color);
    stroke(this.color);
    strokeWeight(this.weight);
    line(this.startX, this.startY, this.endX, this.endY);
  }
}

var darkColors = [
  '#D83D3D',
  '#DD9B7E',
  '#9B7048',
  '#80793E',
  '#4A5A72',
  '#444EA4',
  '#9F7CA5',
  '#C28D8D',
  '#000000'
];

var lightColors = [
  '#F8D9D9',
  '#EBBF96',
  '#FFC266',
  '#C7E7AF',
  '#A6D5D5',
  '#9FC6FF',
  '#DDC2FF',
  '#FFD3D3',
  '#FFFFFF'
];

//history of all strokes
var strokeHistory = [];
//history of undone strokes
var undoneStrokes = [];
//history of just current stroke
var currentPathHistory = [];

var currentColor;
var currentWidth;
var currentBackgroundColor;
var startingWidth = 10;

var startingColor = darkColors[0];
var startingBg = lightColors[lightColors.length - 1]; //white

var prevColorElement; //must be set onload later
var prevBgElement; //must be set onload later

var prevX = null;
var prevY = null;
let canvas_size;
var backgroundMode = false;
let img;
function preload() {
  img = loadImage('assets/filled-overlay.png');
}
function setup() {
  canvas_size = 496;
  if (window.innerWidth <= 540) {
    canvas_size = 250;
  }
  let can = createCanvas(canvas_size, canvas_size);
  can.parent('ratvas-container');
  can.id('ratvas');
  document.onmouseup = released;

  currentWidth = startingWidth;
  currentColor = color(startingColor);
  currentBackgroundColor = color(startingBg);

  strokeCap('ROUND');
  background(currentBackgroundColor);
  strokeWeight(currentWidth);
  fill(currentColor);
  stroke(currentColor);

  document
    .getElementById('startingBackground')
    .classList.add('background-preview-active');
  document.getElementById('startingBackground').click();
}

function mouseDragged() {
  if (prevX == null && prevY == null) {
    //if not off canvas
    if (mouseX >= 0 && mouseY >= 0 && mouseX <= 500 && mouseY <= 500) {
      prevX = mouseX;
      prevY = mouseY;
    }
  } else {
    strokeWeight(currentWidth);
    fill(currentColor);
    stroke(currentColor);
    line(prevX, prevY, mouseX, mouseY);

    let historyItem = new HistoryItem(
      prevX,
      prevY,
      mouseX,
      mouseY,
      currentColor,
      currentWidth
    );
    currentPathHistory.push(historyItem);

    prevX = mouseX;
    prevY = mouseY;
  }
}
function draw() {
 // image(img, 0, 0, canvas_size, canvas_size);
}

function released() {
  prevX = null;
  prevY = null;
  if (currentPathHistory.length > 0) {
    strokeHistory.push(currentPathHistory);
    currentPathHistory = [];
    undoneStrokes = [];
  }
}

function undo() {
  if (strokeHistory.length < 1) return;
  undoneStrokes.unshift(strokeHistory.pop());
  redrawHistory();
}

function redo() {
  if (undoneStrokes.length < 1) return;
  strokeHistory.push(undoneStrokes.shift());
  redrawHistory();
}

function redrawHistory() {
  background(currentBackgroundColor);
  strokeHistory.forEach(path => path.forEach(ele => ele.draw()));
}

function unattachIndicator(ele) {
  ele.classList.remove('selected-color');
}

function attachIndicator(ele) {
  ele.classList.add('selected-color');
}

function generateColorPalette(colorContainer, bg) {
  let rows = darkColors.length;

  let colIndicator = document.createElement('IMG');
  colIndicator.id = 'col-indicator';
  colIndicator.src = 'assets/brush.svg';

  let bgIndicator = document.createElement('IMG');
  bgIndicator.id = 'bg-indicator';
  bgIndicator.src = 'assets/background.svg';
  let colElement1 = document.createElement('DIV');
  let colElement2 = document.createElement('DIV');
  let colElement3 = document.createElement('DIV');
  for (let i = 0; i < rows; i++) {
    let darkColor = darkColors[i];
    let lightColor = lightColors[i];
    var rowElement = document.createElement('DIV');
    rowElement.classList.add('colorpalette-row');

    var darkColorElement = document.createElement('DIV');
    var lightColorElement = document.createElement('DIV');

    darkColorElement.classList.add('color-item');
    darkColorElement.style.backgroundColor = darkColor;

    lightColorElement.classList.add('color-item');
    lightColorElement.style.backgroundColor = lightColor;
    if (lightColor === '#FFFFFF') {
      lightColorElement.style.border = '2px solid rgba(0, 0, 0, 0.3)';
    }

    darkColorElement.addEventListener('click', function() {
      setColor(this, darkColor, bg);
    });
    lightColorElement.addEventListener('click', function() {
      setColor(this, lightColor, bg);
    });

    //need to keep track of currently selected color elements so we can attach the indicator to them
    if (!bg && darkColor === startingColor) {
      prevColorElement = darkColorElement;
      attachIndicator(prevColorElement, colIndicator);
    }
    if (bg && lightColor === startingBg) {
      prevBgElement = lightColorElement;
      attachIndicator(prevBgElement, bgIndicator);
    }

    rowElement.appendChild(darkColorElement);
    rowElement.appendChild(lightColorElement);

    // console.log(colorContainer);
    if (i % 3 == 0 && i < rows - 1) {
      colElement1.appendChild(rowElement);
    }
    if (i % 3 == 1) {
      colElement2.appendChild(rowElement);
    }
    if (i % 3 == 2) {
      colElement3.appendChild(rowElement);
    }
  }
  colElement1.classList.add('colorpalette-col');
  colElement2.classList.add('colorpalette-col');
  colElement3.classList.add('colorpalette-col');

  colorContainer.appendChild(colElement1);
  colorContainer.appendChild(colElement2);
  colorContainer.appendChild(colElement3);
}

function setColor(element, col, bg) {
  if (bg) {
    currentBackgroundColor = color(col);
    redrawHistory();

    unattachIndicator(prevBgElement);
    attachIndicator(element);
    prevBgElement = element;
  } else {
    currentColor = color(col);

    unattachIndicator(prevColorElement);
    attachIndicator(element);
    prevColorElement = element;
  }
}

function setWidth(wid) {
  currentWidth = Math.floor(parseFloat(wid));
}

function setBg(val) {
  backgroundMode = val;
}

var backgroundPreviews;
function changeRatBackground(ele) {
  for (let i = 0; i < backgroundPreviews.length; i++) {
    let bg = backgroundPreviews[i];
    if (bg.classList.contains('background-preview-active')) {
      bg.classList.remove('background-preview-active');
    }
  }
  ele.classList.add('background-preview-active');
}

/* set up DOM parts */
window.onload = function() {
  backgroundPreviews = document.getElementsByClassName('background-preview');
  var colorContainerPen = document.getElementById('colorpalette-pen');
  var colorContainerBg = document.getElementById('colorpalette-bg');
  generateColorPalette(colorContainerPen, false);
  generateColorPalette(colorContainerBg, true);

  document.getElementById('undo').addEventListener('click', () => undo());
  document.getElementById('redo').addEventListener('click', () => redo());

  document.getElementById('widthSlider').addEventListener('input', function() {
    setWidth(this.value);
  });
  document.getElementById('widthSlider').value = startingWidth;

  let bg = document.getElementById('background');
  let brush = document.getElementById('brush');

  // document.getElementById('brush').addEventListener('click', function() {
  //   this.classList.remove('not-selected');
  //   bg.classList.add('not-selected');
  //   setBg(false);
  // });

  // document.getElementById('background').addEventListener('click', function() {
  //   this.classList.remove('not-selected');
  //   brush.classList.add('not-selected');
  //   setBg(true);
  // });

  document.getElementById('ratvas-container').addEventListener(
    'touchmove',
    function(e) {
      e.preventDefault();
      console.log('hi');
    },
    false
  );
};
