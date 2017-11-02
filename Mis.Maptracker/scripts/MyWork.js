function Coords() { }

Coords.prototype.init = function () {
    if (!arguments.length) {
        throw new Error('no arguments');
    }
    else if (arguments[0].lat && arguments[0].lng) {
        this.lat = arguments[0].lat;
        this.lon = arguments[0].lng;
    }
    else if (typeof arguments[0] === "string") {
        var strarr = arguments[0].split(",");
        this.lat = parseFloat(strarr[0].trim());
        this.lon = parseFloat(strarr[1].trim());
    }
    else if (Object.prototype.toString.call(arguments[0]) === "[object Array]") {
        var arr = arguments[0];
        if (arguments[1] === true) {
            this.lat = arr[1];
            this.lon = arr[0];
        } else {
            this.lat = arr[0];
            this.lon = arr[1];
        }
    }
    else if (arguments[2] === true) {
        this.lat = arguments[1];
        this.lon = arguments[0];
    }
    else {
        this.lat = arguments[0];
        this.lon = arguments[1];
    }

    this.compute();
};

Coords.prototype.compute = function () {
    this.north = this.lat > 0;
    this.east = this.lon > 0;
    this.latValues = computeFor(this.lat);
    this.lonValues = computeFor(this.lon);

    function computeFor(initValue) {
        var values = {};
        values.initValue = initValue;
        values.degrees = Math.abs(initValue);
        values.degreesInt = Math.floor(values.degrees);
        values.degreesFrac = values.degrees - values.degreesInt;
        values.secondsTotal = 3600 * values.degreesFrac;
        values.minutes = values.secondsTotal / 60;
        values.minutesInt = Math.floor(values.minutes);
        values.seconds = values.secondsTotal - (values.minutesInt * 60);
        return values;
    }
};

var shortFormats = {
    'FFf': 'DD MM ss X',
    'Ff': 'DD mm X',
    'f': 'dd X'
};

var units = {
    degrees: '°',
    minutes: '′',
    seconds: '″'
};

Coords.prototype.format = function (format, options) {
    if (typeof format === 'object') {
        var submittedFormat = format;
        options = format;
        format = 'FFf';
    }
    if (typeof format === 'undefined') {
        format = 'FFf';
    }
    if (typeof options === 'undefined') {
        options = {};
    }
    if (typeof options === 'string') {
        var submittedString = options;
        options = {
            latLonSeparator: submittedString
        };
    }
    if (typeof options.latLonSeparator === 'undefined') {
        options.latLonSeparator = ' ';
    }
    if (typeof options.decimalPlaces === 'undefined') {
        options.decimalPlaces = 5;
    }
    else {
        options.decimalPlaces = parseInt(options.decimalPlaces);
    }


    if (Object.keys(shortFormats).indexOf(format) > -1) {
        format = shortFormats[format];
    }

    var lat = formatFor(this.latValues, (this.north) ? 'N' : 'S');
    var lon = formatFor(this.lonValues, (this.east) ? 'E' : 'W');

    function formatFor(values, X) {
        var formatted = format;
        formatted = formatted.replace(/DD/g, values.degreesInt + units.degrees);
        formatted = formatted.replace(/dd/g, values.degrees.toFixed(options.decimalPlaces) + units.degrees);
        formatted = formatted.replace(/D/g, values.degreesInt);
        formatted = formatted.replace(/d/g, values.degrees.toFixed(options.decimalPlaces));
        formatted = formatted.replace(/MM/g, values.minutesInt + units.minutes);
        formatted = formatted.replace(/mm/g, values.minutes.toFixed(options.decimalPlaces) + units.minutes);
        formatted = formatted.replace(/M/g, values.minutesInt);
        formatted = formatted.replace(/m/g, values.minutes.toFixed(options.decimalPlaces));
        formatted = formatted.replace(/ss/g, values.seconds.toFixed(options.decimalPlaces) + units.seconds);
        formatted = formatted.replace(/s/g, values.seconds.toFixed(options.decimalPlaces));

        formatted = formatted.replace(/-/g, (values.initValue < 0) ? '-' : '');

        formatted = formatted.replace(/X/g, X);

        return formatted;
    }

    return lat + options.latLonSeparator + lon;
};

function formatcoords() {
    var c = new Coords();
    c.init.apply(c, arguments);
    return c;
}

//module.exports = formatcoords;
// We’ll add a tile layer to add to our map, in this case it’s a OSM tile layer.
// Creating a tile layer usually involves setting the URL template for the tile images
var osmUrl = 'http://{s}.tile.osm.org/{z}/{x}/{y}.png',
    osmAttrib = '&copy; <a href="http://openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    osm = L.tileLayer(osmUrl, {
        maxZoom: 18,
        attribution: osmAttrib
    });

// initialize the map on the "map" div with a given center and zoom
var map = L.map('map').setView([48.61438889, -122.99666667], 12).addLayer(osm);
//SouthEastGame
// N 48 34' 42.3'' = 48.57841667
// W 122 57' 22.1'' = -122.95611111
//NorthWestGame
// N 48 38' 28.9'' = 48.64136111
// W 123 3' 3.6'' = -123.05083333
//NorthEastGame -- new
// N 48 38' 28.9'' = 48.64136111
// W 122 57' 22.1'' = -122.95611111
//SouthWestGame - new
// N 48 34' 42.3'' = 48.57841667
// W 123 3' 3.6'' = -123.05083333

//CenterGame
// N 48 36' 51.8'' = 48.61438889
// W 122 59' 48.3'' = -122.99666667
//48.645856074564975
//var nwGame = L.latLng(48.64136111, -123.05083333); - Old
var nwGame = L.latLng(48.64136111, -123.05083333);
var cwGame = L.latLng(48.61438889, -123.05083333);
var swGame = L.latLng(48.57841667, -123.05083333);
var seGame = L.latLng(48.57841667, -122.95611111);
var ceGame = L.latLng(48.61438889, -122.95611111);
var neGame = L.latLng(48.64136111, -122.95611111);
var centerGame = L.latLng(48.61438889, -122.99666667);
console.log('NW to Center :' + nwGame.distanceTo(centerGame));
console.log('NW to CW :' + nwGame.distanceTo(cwGame));
console.log('CW to SW :' + cwGame.distanceTo(swGame));
console.log('NW to SW :' + nwGame.distanceTo(swGame));
console.log('SW to Center :' + swGame.distanceTo(centerGame));
console.log('CW to Center :' + cwGame.distanceTo(centerGame));

console.log('NE to Center :' + neGame.distanceTo(centerGame));
console.log('NE to CE :' + neGame.distanceTo(ceGame));
console.log('CE to SE :' + ceGame.distanceTo(seGame));
console.log('NE to SE :' + neGame.distanceTo(seGame));
console.log('SE to Center :' + seGame.distanceTo(centerGame));
console.log('CE to Center :' + ceGame.distanceTo(centerGame));
var distanceoffset = (cwGame.distanceTo(swGame)) - (nwGame.distanceTo(cwGame));
var newCenterBasedBounds = centerGame.toBounds(8000);
console.log('New C Bounds New North: ' + newCenterBasedBounds.getNorth());
var newBounds = nwGame.toBounds(distanceoffset);
console.log('New Bounds New North: ' + newBounds.getNorth());
console.log('Distance Variance :' + distanceoffset);
var bnds = [nwGame, seGame, neGame, swGame];
console.log(bnds);
var gmbounds = L.latLngBounds(bnds);
var gm2bounds = L.latLngBounds(nwGame, seGame);
var gmLLbounds = new L.LatLngBounds(nwGame, seGame);
console.log('Center :' + gmLLbounds.getCenter());
console.log('GM NE ' + gm2bounds.getNorthEast());
console.log('GM SW ' + gm2bounds.getSouthWest());
var map2 = L.map('map2', {
    minZoom: 1,
    // maxZoom: 1,
    // zoom: 1,
    crs: L.CRS.Simple
});
var w = 4095,
    h = 4095,
    url = 'http://www.csprance.com/shots/islands_sat.jpg';
var southWest = map2.unproject([0, h], map2.getMaxZoom() - 1);
var northEast = map2.unproject([w, 0], map2.getMaxZoom() - 1);
var bounds = new L.LatLngBounds(southWest, northEast);
console.log('Image Diag Distance :' + southWest.distanceTo(northEast));
console.log('Diag Distance :' + seGame.distanceTo(neGame));
L.imageOverlay(url, newCenterBasedBounds).addTo(map2);
map2.fitBounds(newCenterBasedBounds);
//map2.setMaxBounds(gm2bounds);
console.log(southWest);
console.log(northEast);
console.log(bounds);
L.circle([50.5, 30.5], { radius: 200 }).addTo(map);
// Script for adding marker on map click
var coords = formatcoords(centerGame.lat, centerGame.lng).format();
var marker = L.marker(centerGame, {
    draggable: false,
    title: "GameCenter at: " + coords,
    alt: coords,
    riseOnHover: true
}).addTo(map2);
var testPoint = L.latLng(48.589805556, -122.99611111);
coords = formatcoords(testPoint.lat, testPoint.lng).format();
marker = L.marker(testPoint, {
    draggable: false,
    title: "Test at: " + coords,
    alt: "TEST",
    riseOnHover: true
}).addTo(map2);
L.rectangle(centerGame.toBounds(2000), { color: "#ff7800", weight: 1 }).addTo(map2);
//var nwedistance = map.distance(nwGame,neGame);
console.log('North Distance :' + nwGame.distanceTo(neGame));
console.log('South Distance :' + seGame.distanceTo(swGame));


function onMapClick(e) {
    var coords = formatcoords(e.lat, e.lng).format();
    var marker = L.marker(e.latlng, {
        draggable: true,
        title: "Resource location",
        alt: "Resource Location",
        riseOnHover: true
    }).addTo(map)
        .bindPopup(e.latlng.toString() + 'or' + coords).openPopup();

    // Update marker on changing it's position
    marker.on("dragend", function (ev) {

        var chagedPos = ev.target.getLatLng();
        this.bindPopup(chagedPos.toString()).openPopup();

    });
}

function onMap2Click(e) {
    var coords = formatcoords(e.latlng.lat, e.latlng.lng).format();
    var marker = L.marker(e.latlng, {
        draggable: true,
        title: "Resource location",
        alt: "Resource Location",
        riseOnHover: true
    }).addTo(map2)
        .bindPopup(e.latlng.toString() + ' or ' + coords).openPopup();

    // Update marker on changing it's position
    marker.on("dragend", function (ev) {

        var chagedPos = ev.target.getLatLng();
        this.bindPopup(chagedPos.toString()).openPopup();

    });
}

map2.on('click', onMap2Click);
map.on('click', onMapClick);
