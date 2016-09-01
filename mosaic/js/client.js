// Edit me. Feel free to create additional .js files.
function MosaicModule() {
    'use strict';
    this.tileHeight = TILE_HEIGHT;
    this.tileWidth = TILE_WIDTH;
    this.canvasElem = document.getElementById('mosaic-canvas');
    this.context = this.canvasElem.getContext('2d');
}
MosaicModule.prototype.getAverageColor = function (imgData) {
    'use strict';
    var length = imgData.length, rgb = {r: 0, g: 0, b: 0}, i = -4, count = 0;
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

    return rgb;

};
MosaicModule.prototype.renderImage = function (imgFile) {
    'use strict';
    var mosaicObj = this, FR = new window.FileReader();
    FR.onload = function (e) {
        var height, width, img = new Image();
        img.onload = function () {
            mosaicObj.canvasElem.height = img.naturalHeight || img.offsetHeight || img.height;
            mosaicObj.canvasElem.width = img.naturalWidth || img.offsetWidth || img.width;
            mosaicObj.context.drawImage(img, 0, 0);
            mosaicObj.processImage();
        };
        img.src = e.target.result;
    };
    FR.readAsDataURL(imgFile);
};
MosaicModule.prototype.processImage = function () {
    'use strict';
    var data = this.context.getImageData(0, 0, this.tileWidth, this.tileHeight);
    data = data.data;
    alert(this.getAverageColor(data));
};
var upBtn = document.getElementById('uploadButton');
upBtn.addEventListener('change', function () {
    'use strict';
    var mosaic = new MosaicModule();
    mosaic.renderImage(upBtn.files[0]);
});