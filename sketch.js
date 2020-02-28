// TODO: preserve the updated fog in local storage using p5 storeItem()
// TODO: size the image and the fog after switch to fullscreen

// Global variables:
let currentMap;
let mapFileName;
let fog;
let lastFog;
let userFile;

// Application states:
let stateUserFile = false;
let stateShowMenu = false;
let stateFullscreen = false;
let stateLocked = false;
let stateErase = false;
let stateFogOpacity = true; // True means a semi-transparent fog. False means completely opaque.
let stateBrush = 2; // 1: small brush. 2: medium brush. 4: large brush.
let stateShowBlackBrushes = false;
let stateShowWhiteBrushes = false;
let idleTimer; // This is used for turning off the loop, when the application is idling.

// UI icons:
let imgMenu;
let imgUndo;
let imgBlackBrush;
let imgWhiteBrush;
let imgUnlocked;
let imgLocked;
let imgOpacityOff;
let imgOpacityOn;
let imgRefresh;
let imgOpenFile;
let imgFullscreenOn;
let imgFullscreenOff;

// DOM elements:
let inputWrapper;
let filePicker;
let stateShowPicker;

// UI sizing:
let margin;
let iconSize;
let iconSpacing;
let brushSize;

function setup() {
  // put setup code here
  createCanvas(windowWidth, windowHeight);  // Crude fix for compensating for scrollbars
  //colorMode(RGBA);
  background(0, 0, 0);
  scaleUI();
  // Adding HTML for the file input to load a map:
  inputWrapper = select('.input-wrapper');
  filePicker = createFileInput(handleFile);
  filePicker.parent(inputWrapper);
  filePicker.hide();
  inputWrapper.hide();
  initiateMenu();
  currentMap = loadImage('dungeonmap.jpeg');
  mapFileName = 'dungeonmap.jpeg';
  fog = createImage(width, height);
  initiateFog();
  lastFog = fog.get();
  idleTimer = millis();
}
function draw() {
  background(0, 0, 0);
  drawMap();
  drawFog();
  showUI();
  // This will turn off the draw loop after 60 seconds of no interaction:
  if (millis() - idleTimer > 60000) {
    noLoop();
  }
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
function drawFog() {
  if (stateFogOpacity) {
    tint(0, 0, 0, 128);
    image(fog, 0, 0);
    noTint();
  }
  else {
    image(fog, 0, 0);
  }
}
function touchMoved() {
  loop();
  idleTimer = millis();
  scratchFog();
  return false;
}
function mouseDragged() {
  loop();
  idleTimer = millis();
  scratchFog();
  return false;
}
function touchStarted() {
  loop();
  idleTimer = millis();
  // Menu is open, but user pressed outside menu area:
  let menuWidth = 2*margin + iconSize;
  if (mouseX > menuWidth && stateShowMenu) {
    stateShowMenu = false;
    redraw();
    return false;
  }
  else if (mouseX > 100 && !stateShowMenu && !stateLocked) {
    // Save the fog for undo:
    lastFog = fog.get();
    redraw();
  }
  else {
    redraw();
  }
}
function touchEnded() {
  //loop();
  idleTimer = millis();
  let menuWidth = 2*margin + iconSize;
  if (mouseX < menuWidth && !stateShowMenu) {
    if (mouseY < menuWidth) {  // re-using menuWidth, since the area is a square.
      stateShowMenu = true;
      // Good place to save fog? storeItem('mapFileName', fog) -> See working solution.
      redraw();
      return false;
    }
  }
  else if (mouseX < menuWidth && stateShowMenu) {
    // Toggle the menu (burger button):
    if (mouseY < (margin + iconSize + iconSpacing)) {
      stateShowBlackBrushes = false;
      stateShowWhiteBrushes = false;
      stateShowMenu = false;
      //noLoop();
      redraw();
      return false;
    }
    // For the individual menu items:

    // Undo/redo:
    if (mouseY > (margin + iconSize + iconSpacing) && mouseY < (margin +2*iconSize + iconSpacing)) {
      let tempFog = fog.get();
      fog = lastFog.get();
      lastFog = tempFog.get();
      stateShowMenu = false;
      redraw();
      return false;
    }

    // Set brush to black (draw fog):
    if (mouseY > (margin + 2*iconSize + iconSpacing) && mouseY < (margin +3*iconSize + 2*iconSpacing)) {
      stateErase = true;
      //stateShowMenu = false;
      if (stateShowBlackBrushes) {
        stateShowBlackBrushes = false;
      }
      else {
        stateShowBlackBrushes = true;
      }
      redraw();
      return false;
    }
    
    // Set brush to white/transparent (erase fog):
    if (mouseY > (margin + 3*iconSize + iconSpacing) && mouseY < (margin +4*iconSize + 3*iconSpacing)) {
      stateErase = false;
      //stateShowMenu = false;
      if (stateShowWhiteBrushes) {
        stateShowWhiteBrushes = false;
      }
      else {
        stateShowWhiteBrushes = true;
      }
      redraw();
      return false;
    }

    // Lock/Unlock the brush:
    if (mouseY > (margin + 4*iconSize + 2*iconSpacing) && mouseY < (margin +5*iconSize + 4*iconSpacing)) {
      if (stateLocked) {
        stateLocked = false;
      }
      else {
        stateLocked = true;
      }
      stateShowMenu = false;
      redraw();
      //noLoop();
      return false;
    }

    // Toggle fog opacity:
    if (mouseY > (margin + 5*iconSize + 4*iconSpacing) && mouseY < (margin +6*iconSize + 5*iconSpacing)) {
      if (stateFogOpacity) {
        stateFogOpacity = false;
      }
      else {
        stateFogOpacity = true;
      }
      redraw();
      stateShowMenu = false;
      return false;
    }

    // Toggle fullscreen:
    if (mouseY > (margin + 6*iconSize + 5*iconSpacing) && mouseY < (margin +7*iconSize + 6*iconSpacing)) {
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
    if (mouseY > (margin + 7*iconSize + 6*iconSpacing) && mouseY < (margin + 8*iconSize + 7*iconSpacing)) {
      initiateFog();
      stateShowMenu = false;
      redraw();
      return false;
    }
  }
  else {
    redraw();
    //noLoop();
  }
  // Check for pick of black brush size from submenu:
  if (mouseX > menuWidth && stateShowBlackBrushes) {
    let submenuRightBorder = menuWidth + (margin * 2) + (iconSize * 3) + (iconSpacing * 2);
    let blackBrushPosY = (margin + 2*iconSize + 2*iconSpacing);
    if (mouseX < submenuRightBorder && mouseY > blackBrushPosY) {
      if (mouseY < (blackBrushPosY + iconSize)) {
        if (mouseX > menuWidth && mouseX < (menuWidth + iconSize)) {
          stateBrush = 1;
          stateShowBlackBrushes = false;
          stateShowMenu = false;
          return false;
        }
        else if (mouseX > (menuWidth + iconSize) && mouseX < (menuWidth + (2 * iconSize))) {
          stateBrush = 2;
          stateShowBlackBrushes = false;
          stateShowMenu = false;
          return false;
        }
        else if (mouseX > (menuWidth + (2 * iconSize)) && mouseX < submenuRightBorder) {
          stateBrush = 4;
          stateShowBlackBrushes = false;
          stateShowMenu = false;
          return false;
        }
      }
    }
    else {
      stateShowBlackBrushes = false;
      stateShowMenu = false;
      return false;
    }
  }
  // Check for pick of white brush size from submenu:
  if (mouseX > menuWidth && stateShowWhiteBrushes) {
    let submenuRightBorder = menuWidth + (margin * 2) + (iconSize * 3) + (iconSpacing * 2);
    let whiteBrushPosY = (margin + 3*iconSize + 3*iconSpacing);
    if (mouseX < submenuRightBorder && mouseY > whiteBrushPosY) {
      if (mouseY < (whiteBrushPosY + iconSize)) {
        if (mouseX > menuWidth && mouseX < (menuWidth + iconSize)) {
          stateBrush = 1;
          stateShowWhiteBrushes = false;
          stateShowMenu = false;
          return false;
        }
        else if (mouseX > (menuWidth + iconSize) && mouseX < (menuWidth + (2 * iconSize))) {
          stateBrush = 2;
          stateShowWhiteBrushes = false;
          stateShowMenu = false;
          return false;
        }
        else if (mouseX > (menuWidth + (2 * iconSize)) && mouseX < submenuRightBorder) {
          stateBrush = 4;
          stateShowWhiteBrushes = false;
          stateShowMenu = false;
          return false;
        }
      }
    }
    else {
      stateShowWhiteBrushes = false;
      stateShowMenu = false;
      return false;
    }
  }
}
function scratchFog() {
  // Check if the tool is locked:
  if (stateLocked) {
    redraw();
    return;
  }
  loop();
  let brushColor = color(0, 0, 0 ,0);
  if (stateErase) {
    brushColor = color(0, 0, 0, 255)
  }
  // To allow for different brush sizes:
  let currentBrushSize = brushSize * stateBrush;
  fog.loadPixels();
  let x = int(mouseX - currentBrushSize/2);
  let w = int(mouseX + currentBrushSize/2);
  let y = int(mouseY - currentBrushSize/2);
  let h = int(mouseY + currentBrushSize/2);
  for (let i = 0; i < currentBrushSize; i++) {
    for (let j = 0; j < currentBrushSize; j++) {
      fog.set(x+i, y+j, brushColor);  // Not the fastest, but the only reliable way.
    }
  }
  fog.updatePixels();
  image(fog, 0, 0);  // This somehow updates the displayed fog while touchMoved unlike drawFog().
  //redraw();
  //drawFog();
  //noLoop();
}
function initiateFog() {
  // Check for an existing fog associated with mapFileName in localStorage.
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
    // Save current fog?
    changeMap(userFile);
    mapFileName = file.name;
  }
}
function changeMap(userMap) {
  currentMap = userMap;
  stateUserFile = true;
  initiateFog();
  redraw();
}
function scaleUI() {
  // This function lets us adjust the scale of the UI (menu) to fit smaller screens and screens with
  //   high pixel density. However, there's a difference in behaviour between OS's.
  let scaleFactor = 1;
  let smallestDim = Math.min(width, height); 
  if (smallestDim < 960 && smallestDim >= 720) {
    scaleFactor = 0.75;
  }
  else if (smallestDim < 720 && smallestDim >= 480) {
    scaleFactor = 0.5;
  }
  else if (smallestDim < 480) {
    scaleFactor = 0.25;
  }
  margin = int(8*displayDensity()*scaleFactor);
  iconSize = int(48*displayDensity()*scaleFactor);
  iconSpacing = int(16*displayDensity()*scaleFactor);
  brushSize = int(40*scaleFactor);
}
function showUI() {
  let fullMenuHeight = (margin*2) + (iconSize*9) + (iconSpacing*8);
  let fullMenuWidth = (margin*2) + iconSize;
  fill(0, 0, 0);
  if (stateShowMenu) {
    rect(0, 0, fullMenuWidth, fullMenuHeight);
    let iconPosY = margin;
    image(imgMenu, margin, iconPosY, iconSize, iconSize);
    iconPosY += (iconSpacing + iconSize);
    image(imgUndo, margin, iconPosY, iconSize, iconSize);
    iconPosY += (iconSpacing + iconSize);
    image(imgBlackBrush, margin, iconPosY, iconSize, iconSize);
    if (stateShowBlackBrushes) {
      stroke(0);
      fill(0);
      let submenuX = (margin * 2) + iconSize;
      let submenuWidth = (margin * 2) + (iconSize * 3) + (iconSpacing * 2);
      let submenuHeight = (iconSpacing * 2) + iconSize;
      rect(submenuX, (iconPosY - iconSpacing), submenuWidth, submenuHeight);
      stroke(255);
      strokeWeight(4);
      let subIconPosX = submenuX + margin + int(iconSize/2);
      let subIconPosY = iconPosY + int(iconSize/2);
      let subIconSize = int(iconSize/4);
      ellipse(subIconPosX, subIconPosY, subIconSize, subIconSize);
      subIconPosX += iconSize;
      subIconSize *= 2;
      ellipse(subIconPosX, subIconPosY, subIconSize, subIconSize);
      subIconPosX += iconSize + iconSpacing;
      subIconSize *= 2;
      ellipse(subIconPosX, subIconPosY, subIconSize, subIconSize);
      noStroke();
      noFill();
    }
    iconPosY += (iconSpacing + iconSize);
    image(imgWhiteBrush, margin, iconPosY, iconSize, iconSize);
    if (stateShowWhiteBrushes) {
      stroke(0);
      fill(0);
      let submenuX = (margin * 2) + iconSize;
      let submenuWidth = (margin * 2) + (iconSize * 3) + (iconSpacing * 2);
      let submenuHeight = (iconSpacing * 2) + iconSize;
      rect(submenuX, (iconPosY - iconSpacing), submenuWidth, submenuHeight);
      stroke(255);
      strokeWeight(4);
      fill(255);
      let subIconPosX = submenuX + margin + int(iconSize/2);
      let subIconPosY = iconPosY + int(iconSize/2);
      let subIconSize = int(iconSize/4);
      ellipse(subIconPosX, subIconPosY, subIconSize, subIconSize);
      subIconPosX += iconSize;
      subIconSize *= 2;
      ellipse(subIconPosX, subIconPosY, subIconSize, subIconSize);
      subIconPosX += iconSize + iconSpacing;
      subIconSize *= 2;
      ellipse(subIconPosX, subIconPosY, subIconSize, subIconSize);
      noStroke();
      noFill();
    }
    iconPosY += (iconSpacing + iconSize);
    if (stateLocked) {
      image(imgLocked, margin, iconPosY, iconSize, iconSize);
    }
    else {
      image(imgUnlocked, margin, iconPosY, iconSize, iconSize);
    }
    iconPosY += (iconSpacing + iconSize);
    if (stateFogOpacity) {
      image(imgOpacityOff, margin, iconPosY, iconSize, iconSize);
    }
    else {
      image(imgOpacityOn, margin, iconPosY, iconSize, iconSize);
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
    // Adding a DOM input element and a label element on top of the open file image:
    inputWrapper.position(margin, iconPosY);
    inputWrapper.show();
    filePicker.position(margin, iconPosY);
    filePicker.show();
  }
  else {
    rect(0, 0, fullMenuWidth, fullMenuWidth);
    image(imgMenu, margin, margin, iconSize, iconSize);
    filePicker.hide();
    inputWrapper.hide();
  }
  redraw();
}
function initiateMenu() {
  imgMenu = loadImage('./data/baseline_menu_white_48dp.png');
  imgUndo = loadImage('./data/outline_undo_white_48dp.png');
  imgBlackBrush = loadImage('./data/baseline_brush_black_48dp.png');
  imgWhiteBrush = loadImage('./data/baseline_lens_white_48dp.png');
  imgUnlocked = loadImage('./data/baseline_lock_open_white_48dp.png');
  imgLocked = loadImage('./data/baseline_lock_white_48dp.png');
  imgOpacityOff = loadImage('./data/outline_visibility_white_48dp.png');
  imgOpacityOn = loadImage('./data/outline_visibility_off_white_48dp.png');
  imgRefresh = loadImage('./data/baseline_refresh_white_48dp.png');
  imgOpenFile = loadImage('./data/baseline_folder_open_white_48dp.png');
  imgFullscreenOn = loadImage('./data/baseline_fullscreen_white_48dp.png');
  imgFullscreenOff = loadImage('./data/baseline_fullscreen_exit_white_48dp.png');
  filePicker.hide();
}
