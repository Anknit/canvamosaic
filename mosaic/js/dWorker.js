function dataRequest(hexVal, xIndex, yIndex) {
    'use strict';
    var xhr = new XMLHttpRequest();
    xhr.open("GET", "./../color/" + hexVal, true);
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4 && xhr.status === 200) {
            postMessage([xhr.response, xIndex, yIndex]);
        }
    };
    xhr.send();
}

onmessage = function (e) {
    'use strict';
    dataRequest(e.data[0], e.data[1], e.data[2]);
};