/*global TILE_HEIGHT, TILE_WIDTH*/

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
        xIndex = Math.ceil(tileXPos / this.tileWidth),
        yIndex = Math.ceil(tileYPos / this.tileHeight);
    if (typeof this.mosaicData[yIndex] === "undefined") {
        this.mosaicData[yIndex] = [];
        this.mosaicData[yIndex].length = this.tileXcount;
    }
    if (typeof this.mosaicRows[yIndex] === "undefined") {
        this.mosaicRows[yIndex] = 0;
    }
    computeWorker.postMessage([tileData, xIndex, yIndex]);
};

/*
Function : updateRows
Module function to check whether row is ready to be rendered
@params :   initIndex   => Row index whose tiles are fetched completely
*/

MosaicModule.prototype.updateRows = function (initIndex) {
    'use strict';
    var i;
    var startPoint = this.mosaicRows.lastIndexOf(-1);
    if (startPoint !== -1 || initIndex === 0) {
        for (i = startPoint + 1 ; i <= initIndex; i = i + 1) {
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
    'use strict';
    var i, mosaicObj = this;
    for (i = 0; i < this.tileXcount; i = i + 1) {
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
        img.setAttribute('data-x', tileXPos);
        img.setAttribute('data-y', tileYPos);
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

var mosaic = new MosaicModule();
var upBtn = document.getElementById('uploadButton');
var mosBtn = document.getElementById('processButton');

// Add eventlistener to input button
upBtn.addEventListener('change', function () {
    'use strict';

    // Render uploaded Image 
    mosaic.renderImage(upBtn.files[0]);
    mosBtn.style.display = 'inline-block';
});

// Add eventlistener to create Mosaic button
mosBtn.addEventListener('click', function () {
    'use strict';
    mosaic.processImage();
});

// Web worker Implementation
// Requries script name as input
var dataWorker = new window.Worker("js/dWorker.js");
var computeWorker = new window.Worker("js/pWorker.js");
var callback = function (responseText, xIndex, yIndex) {
    'use strict';

    // Update mapping arrays from the response
    mosaic.mosaicData[yIndex][xIndex] = responseText;
    mosaic.mosaicRows[yIndex] = mosaic.mosaicRows[yIndex] + 1;

    // Check whether a complete row is ready to be rendered when its all tiles are fetched from the server
    if (mosaic.mosaicRows[yIndex] === mosaic.tileXcount) {
        mosaic.updateRows(yIndex);
    }
};

dataWorker.onmessage = function (e) {
    'use strict';
    callback(e.data[0], e.data[1], e.data[2]);
};
computeWorker.onmessage = function (e) {
    dataWorker.postMessage([e.data[0], e.data[1], e.data[2]]);
}