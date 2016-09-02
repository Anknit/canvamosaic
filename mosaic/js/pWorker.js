/*global postMessage */
/*
Function to convert rgb component value to hex
*/
function componentToHex(c) {
    'use strict';
    var hex = c.toString(16);
    return hex.length === 1 ? "0" + hex : hex;
}
/*
Function to convert rgb value to hex
*/
function rgbToHex(rgb) {
    'use strict';
    return componentToHex(rgb.r) + componentToHex(rgb.g) + componentToHex(rgb.b);
}
function getAverageHex(imgData) {
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
    return rgbToHex(rgb);
}

onmessage = function (e) {
    'use strict';
    var hexValue = getAverageHex(e.data[0]);
    postMessage([hexValue, e.data[1], e.data[2]]);
};