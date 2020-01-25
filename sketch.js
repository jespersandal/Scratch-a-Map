// TODO: LoadFile to read an image file
// TODO: preserve the updated fog in local storage using p5 storeItem()
// TODO: size the image and the fog
// TODO: adjust for pixelDensity
// TODO: Change from full framerate to noLoop/redraw to reduce power consumption
// TODO: UI for loading image, reset fog, undo or switch brush, fullscreen, lock

let currentMap;
let fog;
let userFile;

// Application states:
let stateUserFile = false;
let stateShowMenu = false;
let stateFullscreen = false;
let stateLocked = false;
let stateErase = false;

// UI icons:
let imgMenu;
let imgBlackBrush;
let imgWhiteBrush;
let imgUnlocked;
let imgLocked;
let imgRefresh;
let imgOpenFile;
let imgFullscreenOn;
let imgFullscreenOff;

// DOM elements:
//let input;
let inputWrapper;
let filePicker;
let stateShowPicker;

// UI sizing:
let margin;
let iconSize;
let iconSpacing;

function setup() {
  // put setup code here
  createCanvas(windowWidth, windowHeight);  // Crude fix for compensating for scrollbars
  colorMode(HSB);
  background(0, 0, 0);
  scaleUI();
  //input = createFileInput(handleFile);
  //styleInputButton();
  inputWrapper = select('.input-wrapper');
  filePicker = createFileInput(handleFile);
  filePicker.parent(inputWrapper);
  filePicker.hide();
  inputWrapper.hide();

  initiateMenu();
  currentMap = loadImage('dungeonmap.jpeg');
  fog = createImage(width, height);
  initiateFog();
  //noLoop();
}
function draw() {
  // put drawing code here
  background(0, 0, 0);
  drawMap();
  image(fog, 0, 0);
  showUI();
}
function drawMap() {
  let mapScaledWidth;
  let mapScaledHeight;
  let mapScale;
  if (currentMap.width < currentMap.height) {
    mapScale = (width/currentMap.height);
    translate(width/2, height/2);
    rotate(HALF_PI);
    imageMode(CENTER);
    image(currentMap, 0, 0, currentMap.width*mapScale, currentMap.height*mapScale);
    rotate(-1.0 * HALF_PI);
    imageMode(CORNER);
    translate(-width/2, -height/2);
  }
  else {
    mapScale = (width/currentMap.width);
    if ((mapScale * currentMap.height) > height) {
      mapScale = (height/currentMap.height);
    }
    image(currentMap, 0, 0, currentMap.width*mapScale, currentMap.height*mapScale);
  }
}
function touchMoved() {
  drawFog();
}
function touchStarted() {
  // Menu is open, but user pressed outside menu area:
  if (mouseX > 100 && stateShowMenu) {
    stateShowMenu = false;
    redraw();
    return false;
  }
  else {
    redraw();
  }
}
function touchEnded() {
  loop();
  // We use x:100 as a rough border of the menu. TODO: Add this to scaleUI.
  if (mouseX < 100 && !stateShowMenu) {
    if (mouseY < 100) {
      stateShowMenu = true;
      redraw();
      return false;
    }
  }
  else if (mouseX < 100 && stateShowMenu) {
    if (mouseY < (70*displayDensity())) {
      stateShowMenu = false;
      noLoop();
      redraw();
      return false;
    }
    // For the individual menu items:

    // Set brush to black (draw fog):
    if (mouseY > (margin + iconSize + iconSpacing) && mouseY < (margin +2*iconSize + iconSpacing)) {
      stateErase = true;
      stateShowMenu = false;
      redraw();
      return false;
    }
    
    // Set brush to white/transparent (erase fog):
    if (mouseY > (margin + 2*iconSize + iconSpacing) && mouseY < (margin +3*iconSize + 2*iconSpacing)) {
      stateErase = false;
      stateShowMenu = false;
      redraw();
      return false;
    }

    // Lock/Unlock the brush:
    if (mouseY > (margin + 3*iconSize + 2*iconSpacing) && mouseY < (margin +4*iconSize + 3*iconSpacing)) {
      if (stateLocked) {
        stateLocked = false;
      }
      else {
        stateLocked = true;
      }
      stateShowMenu = false;
      redraw();
      noLoop();
      return false;
    }

    // Toggle fullscreen:
    if (mouseY > (margin + 4*iconSize + 3*iconSpacing) && mouseY < (margin +5*iconSize + 4*iconSpacing)) {
      //fullscreen(!stateFullScreen);
      if (!stateFullscreen) {
        document.documentElement.requestFullscreen();
        stateFullscreen = !stateFullscreen;
      }
      else {
        document.exitFullscreen();
        stateFullscreen = !stateFullscreen;
      }
      redraw();
      
      return false;
    }

    // Refresh to reset the fog:
    if (mouseY > (margin + 5*iconSize + 4*iconSpacing) && mouseY < (margin + 6*iconSize + 5*iconSpacing)) {
      initiateFog();
      stateShowMenu = false;
      redraw();
      return false;
    }
  }
  else {
    noLoop();
  }
}
function drawFog() {
  // Check if the tool is locked:
  if (stateLocked) {
    redraw();
    return;
  }
  let brushColor = color(0, 0, 0 ,0);
  if (stateErase) {
    brushColor = color(0, 0, 0, 255)
  }
  fog.loadPixels();
  let x = mouseX - 20;
  let y = mouseY - 20;
  for (let i = 0; i < 40; i++) {
    for (let j = 0; j < 40; j++) {
      fog.set(x+i, y+j, brushColor);
    }
  }
  fog.updatePixels();
  redraw();
}
function initiateFog() {
  // Set all pixels to 0 (black)
  fog.loadPixels();
  for (let i = 0; i < fog.pixels.length; i++) {
    if (i%4 != 3) {
      fog.pixels[i] = 0;  
    }
    else {
      fog.pixels[i] = 255;
    }
  }
  fog.updatePixels();
  redraw();
}
function handleFile(file) {
  if (file.type === 'image') {
    userFile = createImg(file.data, '');
    userFile.hide();
    changeMap(userFile);
  }
}
function changeMap(userMap) {
  currentMap = userMap;
  stateUserFile = true;
  initiateFog();
  redraw();
}
function scaleUI() {
  margin = 10*displayDensity();
  iconSize = 50*displayDensity();
  iconSpacing = 20*displayDensity();
}
function showUI() {
  let fullMenuHeight = (margin*2) + (iconSize*7) + (iconSpacing*6);
  fill(0, 0, 0);
  if (stateShowMenu) {
    rect(0, 0, 100, fullMenuHeight);
    let iconPosY = margin;
    image(imgMenu, margin, iconPosY, iconSize, iconSize);
    iconPosY += (iconSpacing + iconSize);
    image(imgBlackBrush, margin, iconPosY, iconSize, iconSize);
    iconPosY += (iconSpacing + iconSize);
    image(imgWhiteBrush, margin, iconPosY, iconSize, iconSize);
    iconPosY += (iconSpacing + iconSize);
    if (stateLocked) {
      image(imgLocked, margin, iconPosY, iconSize, iconSize);
    }
    else {
      image(imgUnlocked, margin, iconPosY, iconSize, iconSize);
    }
    iconPosY += (iconSpacing + iconSize);
    if (stateFullscreen) {
      image(imgFullscreenOff, margin, iconPosY, iconSize, iconSize);
    }
    else {
      image(imgFullscreenOn, margin, iconPosY, iconSize, iconSize);
    }
    iconPosY += (iconSpacing + iconSize);
    image(imgRefresh, margin, iconPosY, iconSize, iconSize);
    iconPosY += (iconSpacing + iconSize);
    image(imgOpenFile, margin, iconPosY, iconSize, iconSize);
    // Adding a DOM input element on top of the open file image:
    //input = createFileInput(handleFile);
    //inputWrapper.position(margin, iconPosY);
    //inputWrapper.show();
    //input.position(margin, iconPosY);
    //input.addClass('invisible');
    //input.show();
    //filePicker = document.getElementById('mapFile');
    inputWrapper.position(margin, iconPosY);
    inputWrapper.show();
    filePicker.position(margin, iconPosY);
    filePicker.show();
  }
  else {
    rect(0, 0, 100, 100);
    image(imgMenu, margin, margin, iconSize, iconSize);
    //input.hide();
    filePicker.hide();
    inputWrapper.hide();
  }
  redraw();
}
function initiateMenu() {
  imgMenu = loadImage('./data/baseline_menu_white_48dp.png');
  imgBlackBrush = loadImage('./data/baseline_brush_black_48dp.png');
  imgWhiteBrush = loadImage('./data/baseline_lens_white_48dp.png');
  imgUnlocked = loadImage('./data/baseline_lock_open_white_48dp.png');
  imgLocked = loadImage('./data/baseline_lock_white_48dp.png');
  imgRefresh = loadImage('./data/baseline_refresh_white_48dp.png');
  imgOpenFile = loadImage('./data/baseline_folder_open_white_48dp.png');
  imgFullscreenOn = loadImage('./data/baseline_fullscreen_white_48dp.png');
  imgFullscreenOff = loadImage('./data/baseline_fullscreen_exit_white_48dp.png');
  filePicker.hide();
}
function styleInputButton() {
  //input.addClass('invisible');
  let inputInnerHTML = '<input type="file" id="pickMap">';
  inputWrapper = createElement('label', inputInnerHTML);
  inputWrapper.attribute('for', 'pickMap')
  inputWrapper.addClass('input-wrapper');
  //input.size(iconSize, iconSize);
}