/*
Constructor Function for Mosaic Module
Initialize height and width parameters and place canvas elem in memory
*/

function MosaicModule() {
    'use strict';
    this.tileHeight = TILE_HEIGHT;
    this.tileWidth = TILE_WIDTH;
    this.canvasElem = document.getElementById('mosaic-canvas');
    this.context = this.canvasElem.getContext('2d');
    this.mosaicData = null;
}

/*
Function : getAverageColor
Module function to get Average color from a tile imageData
@params : imgData => Canvas imagedata of tile
@return : <String> Average Hex Value of the tile 
*/

MosaicModule.prototype.getAverageColor = function (imgData) {
    'use strict';
    var length = imgData.length,
        rgb = {r: 0, g: 0, b: 0},
        i = -4,
        count = 0;
    while ((i += 4) < length) {
        count = count + 1;
        rgb.r += imgData[i];
        rgb.g += imgData[i + 1];
        rgb.b += imgData[i + 2];
    }
  
    // floor the average values to give correct rgb values (ie: round number values)
    rgb.r = Math.floor(rgb.r / count);
    rgb.g = Math.floor(rgb.g / count);
    rgb.b = Math.floor(rgb.b / count);

    // get Hex value from RGB 
    return rgbToHex(rgb.r, rgb.g, rgb.b);
};

/*
Function : renderImage
Module function to render uploaded image on the canvas using FileReader API
@params : imgFile => File uploaded on app client by the user
*/

MosaicModule.prototype.renderImage = function (imgFile) {
    'use strict';
    var mosaicObj = this,
        FR = new window.FileReader();
    
    // Load function for filereader when image src is ready
    FR.onload = function (e) {
        var height = 0,
            width = 0,
            img = new Image();

        // Load function when image is successfully loaded from the given src
        img.onload = function () {
            mosaicObj.canvasElem.height = img.naturalHeight || img.offsetHeight || img.height;
            mosaicObj.canvasElem.width = img.naturalWidth || img.offsetWidth || img.width;
            mosaicObj.tileXcount = Math.ceil(mosaicObj.canvasElem.width / mosaicObj.tileWidth);
            mosaicObj.tileYcount = Math.ceil(mosaicObj.canvasElem.height / mosaicObj.tileHeight);
            mosaicObj.context.drawImage(img, 0, 0);
/*
            mosaicObj.processImage();
*/
        };
        img.src = e.target.result;
    };
    
    // Read image file using FileReader
    FR.readAsDataURL(imgFile);
};

/*
Function : fetchTileFromServer
Module function to fetch tile of corresponding hex value provided
@params :   hexVal   => HexValue computed by the app
            callback => Callback Function for the server response
*/

MosaicModule.prototype.fetchTileFromServer = function (hexVal, callback) {
    'use strict';
    var xhr = new XMLHttpRequest();
    xhr.open("GET", "./color/" + hexVal, true);
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4 && xhr.status === 200) {
            callback(xhr.response, xhr.responseXML);
        }
    };
    xhr.send();
};

/*
Function : processTile
Module function to process a tile of the original uploaded image
@params :   tileData    => ImageData of the rectangular tile area of original image
            tileXPos    => X Coordinate of the tile reference to the complete image
            tileYPos    => Y Coordinate of the tile reference to the complete image
*/

MosaicModule.prototype.processTile = function (tileData, tileXPos, tileYPos) {
    'use strict';
    var hexValue = '000000',
        mosaicObj = this,
        xIndex = Math.ceil(tileXPos/this.tileWidth),
        yIndex = Math.ceil(tileYPos/this.tileHeight);
    if (typeof this.mosaicData[yIndex] == "undefined") {
        this.mosaicData[yIndex] = new Array(this.tileXcount);
    }
    if (typeof this.mosaicRows[yIndex] == "undefined") {
        this.mosaicRows[yIndex] = 0;
    }
    
    // get Average Hex value of the tile image
    hexValue = this.getAverageColor(tileData);
    
    // fetch corresponding tile from the server
    this.fetchTileFromServer(hexValue, function (responseText, responseXml) {
        // Update mapping arrays from the response
        mosaicObj.mosaicData[yIndex][xIndex] = responseText;
        mosaicObj.mosaicRows[yIndex] = mosaicObj.mosaicRows[yIndex] + 1;

        // Check whether a complete row is ready to be rendered when its all tiles are fetched from the server
        if (mosaicObj.mosaicRows[yIndex] === mosaicObj.tileXcount) {
            mosaicObj.updateRows(yIndex);
        }
    });
};

/*
Function : updateRows
Module function to check whether row is ready to be rendered
@params :   initIndex   => Row index whose tiles are fetched completely
*/

MosaicModule.prototype.updateRows = function (initIndex) {
    var i;
    for(i =0; i<= initIndex;i++) {
        if (this.mosaicRows[i] !== -1) { // If row is not already rendered
            if (this.mosaicRows[i] >= this.tileXcount) {  // If row has fetched all tiles 
                this.renderRow(i);  // render this row
                this.mosaicRows[i] = -1;    // update mapping array that corresponding row has been rendered
            } else {
                break;
            }
        }
    }
};

/*
Function : renderRow
Module function to render all tiles of a row
@params :   renderIndex   => Row index whose tiles are to be rendered
*/

MosaicModule.prototype.renderRow = function (renderIndex) {
    var i, mosaicObj = this;
    for (i = 0;i < this.tileXcount; i++) {
        var data = this.mosaicData[renderIndex][i], // get data from mapping array

            // create a blob Url from the data
            DOMURL = window.URL || window.webkitURL || window,
            img = new window.Image(),
            svg = new window.Blob([data], {type: 'image/svg+xml;charset=utf-8'}),
            url = DOMURL.createObjectURL(svg),
            tileXPos = i * this.tileWidth,
            tileYPos = renderIndex * this.tileHeight;
        img.onload = function () {
            // Clear area on the canvas for new tile
            mosaicObj.context.clearRect(this.getAttribute('data-x'), this.getAttribute('data-y'), mosaicObj.tileWidth, mosaicObj.tileHeight);
            
            // Draw image at the specified location
            mosaicObj.context.drawImage(this, this.getAttribute('data-x'), this.getAttribute('data-y'));
            DOMURL.revokeObjectURL(url);
        };
        
        // set the blob url to a image object 
        img.src = url;
        
        // set position coordinates for the image
        img.setAttribute('data-x',tileXPos);
        img.setAttribute('data-y',tileYPos);
    }
};

/*
Function : processImage
Module function to process the image. (Entry point for the mosaic creation)
*/

MosaicModule.prototype.processImage = function () {
    'use strict';
    var data, xPos = 0, yPos = 0;
    
    // Update mapping array
    this.mosaicData = new Array(this.tileYcount);
    this.mosaicRows = new Array(this.tileYcount);

    // Process Image tile by tile 
    while (yPos <= this.canvasElem.height) {
        while (xPos < this.canvasElem.width) {
            data = this.context.getImageData(xPos, yPos, this.tileWidth, this.tileHeight);
            this.processTile(data.data, xPos, yPos);
            xPos = xPos + this.tileWidth;
        }
        yPos = yPos + this.tileHeight;
        xPos = 0;
    }
};
/*
Function to convert rgb component value to hex
*/
function componentToHex(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}
/*
Function to convert rgb value to hex
*/
function rgbToHex(r, g, b) {
    return componentToHex(r) + componentToHex(g) + componentToHex(b);
}

// Add eventlistener to input button
var mosaic = new MosaicModule();
var upBtn = document.getElementById('uploadButton');
upBtn.addEventListener('change', function () {
    'use strict';

    // Render uploaded Image 
    mosaic.renderImage(upBtn.files[0]);
    mosBtn.style.display = 'inline-block';
});

// Add eventlistener to create Mosaic button
var mosBtn = document.getElementById('processButton');
mosBtn.addEventListener('click', function () {
    'use strict';
    mosaic.processImage();
});
