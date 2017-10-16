var myApp = angular.module('myApp', ["firebase", "ngCookies"]);

//myApp.directive('myDirective', function() {});
//myApp.factory('myService', function() {});

myApp.controller('MyCtrl', ['$scope', '$firebaseArray', '$timeout', '$cookies', function MyCtrl($scope, $firebaseArray, $timeout, $cookies) {
    $scope.checkInterval = 60000;
    $scope.timeInMs = 0;
    var types = firebase.database().ref().child("lookups/locTypes");
    var zooms = firebase.database().ref().child("lookups/zoomLevels");
    var ref = firebase.database().ref().child("locations");
    // download the data into a local object
    $scope.Desc = "";
    $scope.Lat = '0.0';
    $scope.Long = '0.0';
    $scope.locType = "Base";
    $scope.Notes = "";
    $scope.mapMarkers = {};
    $scope.mapIcons = {};
    $scope.mapClicked = false;
    $scope.showToastr = false;
    $scope.userName = $cookies.get('userName')
    if ($scope.userName) {

    }
    else {
        $scope.userName = 'Click to Set';
    }
    console.log('UserName: ' + $scope.userName);
    $scope.selectedLoc = {
        isSelected: false,
        Key: "",
        Desc: "",
        Lat: "",
        Long: "",
        Notes: "",
        Type: "",
        dtAdded: ""
    };
    var checkTimedout = function () {
        $scope.timeInMs += $scope.checkInterval;
        console.log('Checking Timed Out Locations Total#: ' + $scope.locations.length);
        angular.forEach($scope.locations, function (location) {
            if (location.dtExpire && location.dtExpire > 0) {
                var now = moment();
                if (location.dtExpire <= now.unix()) {
                    console.log('Location is Expired ' + location.$id);
                    $scope.removeLocation(location.$id);
                }
            }
        })
        $timeout(checkTimedout, $scope.checkInterval);
    }
    //Intial Start
    $timeout(checkTimedout, $scope.checkInterval)
    $scope.zooms = $firebaseArray(zooms);
    $scope.locTypes = $firebaseArray(types);
    $scope.locations = $firebaseArray(ref);
    $scope.getMarkerIcon = function (locTypeKey) {
        var icon = $scope.mapIcons[locTypeKey];
        //console.log(locTypeKey);
        if (icon === undefined) {
            return $scope.mapIcons['Base'];
        }
        else {
            return icon;
        }


    };
    $scope.locTypes.$watch(function (event) {
        //console.log(event);
        var rec = $scope.locTypes.$getRecord(event.key);
        if (event.event == "child_added") {
            if (rec.icon === undefined) {
                $scope.mapIcons[rec.$id] = {
                    icon: L.AwesomeMarkers.icon({
                        icon: 'star',
                        markerColor: 'blue',
                        iconColor: 'white',
                        prefix: 'ion'

                    })
                };

            }
            else {
                // add icons to list
                $scope.mapIcons[rec.$id] = {
                    icon: L.AwesomeMarkers.icon({
                        icon: rec.icon,
                        markerColor: rec.markerColor,
                        iconColor: rec.iconColor,
                        prefix: rec.prefix
                    })
                };
            }
        }
        if (event.event == "child_changed") {
            var rec = $scope.locTypes.$getRecord(event.key);
            var icon = $scope.mapIcons[rec.$id];
            icon.icon = rec.icon;
            icon.markerColor = rec.markerColor;
            icon.iconColor = rec.iconColor;
            icon.prefix = rec.prefix;
        }
    });
    $scope.locations.$loaded()
        .then(function (x) {
            console.log('Locations Loaded');
            $scope.showToastr = true;
        })
        .catch(function (error) {
            console.log("Error:Loading Locations", error);
        });
    $scope.locTypes.$loaded()
        .then(function (x) {
            console.log('Location Types Loaded');
            var legend = L.control({ position: 'topright' });

            legend.onAdd = function (map) {

                var div = L.DomUtil.create('div', 'info legend');

                // loop through our density intervals and generate a label with a colored square for each interval
                for (var i = 0; i < x.length; i++) {
                    div.innerHTML +=
                        '<i class="' + $scope.cssLocType(x[i].$id) + '"></i> ' + x[i].Desc + '<br>';
                    var key = x[i].$id;
                    var item = x[i];

                    $scope.map.contextmenu.addItem({
                        text: x[i].Desc,
                        iconCls: x[i].icon,
                        iconPrefix: x[i].prefix,
                        clickContextKey: item.$id.toString(),
                        callback: quickAdd

                    });
                }

                return div;
            };
            legend.addTo($scope.map);
        })
        .catch(function (error) {
            console.log("Error:Loading Location Types", error);
        });
    $scope.quickAddLocation = function (locType, locDetails) {
        console.log(locType, locDetails);
    }
    $scope.locations.$watch(function (event) {

        //console.log(event);
        if (event.event == "child_added") {
            // work here
            var rec = $scope.locations.$getRecord(event.key);
            console.log("Location Added " + event.key)
            var iconObj = $scope.mapIcons[rec.Type];
            //console.log(icon);
            iconObj.contextmenu = true;
            iconObj.contextmenuItems = [{
                text: rec.Desc + ': ',
                index: 0
            }, {
                text: 'Delete',
                index: 1,
                iconCls: 'trash',
                iconPrefix: 'fa',
                clickContextKey: event.key,
                callback: quickDelete
            }, {
                text: 'Edit',
                index: 2,
                iconCls: 'pencil',
                iconPrefix: 'fa',
                clickContextKey: event.key,
                callback: editLocation
            },
            {
                separator: true,
                index: 3
            }];
            var mkr = L.marker([rec.Lat, rec.Long], iconObj).addTo($scope.map);
            rec.marker = mkr;
            $scope.mapMarkers[event.key] = mkr;
            var notes = rec.Notes;
            if (notes === undefined)
                notes = "";

            var typeData = '<i class="' + $scope.cssLocType(rec.Type) + '"></i>  ' + $scope.locTypeDesc(rec.Type);
            //mkr.bindPopup('<b>' + rec.Desc + '</b> <br/> <i>' + notes + '</i><br/>Added: ' + $scope.displayDate(rec.dtAdded) + '<br/>' + typeData + "<button type='button' class='btn btn-sm btn-primary'data-toggle='modal' data-target='#editLocModal'>Edit</button>");
            mkr.on('click', L.bind($scope.openEdit, null, rec.$id));
            if ($scope.showToastr) {
                toastr.info('New Location Added');
            }
        }
        if (event.event == "child_removed") {
            console.log("Location Updated " + event.key)
            var marker = $scope.mapMarkers[event.key];
            var rec = $scope.locations.$getRecord(event.key);
            //console.log(marker);
            marker.remove();
        }

    });

    $scope.removeLocation = function (key) {
        //console.log("Removing " + key);
        var rec = $scope.locations.$getRecord(key);
        $scope.locations.$remove($scope.locations.$indexFor(key));
    };
    $scope.saveUsername = function (isValid) {
        var exp = moment().add(1, 'y').toDate();
        if (isValid) {
            $cookies.put('userName', $scope.userName, {
                expires: exp
            });
            $('#setUserNameModal').modal('hide');
        }
    };
    $scope.openGetUsername = function (isValid) {
        $('#setUserNameModal').modal('show');
    };
    $scope.addLocation = function (isValid) {
        if (isValid) {
            //console.log('Adding' + $scope.Desc);
            c
            var typ = $scope.getLocType($scope.locType.$id);
            var expDT = 0;
            if (typ.timeoutSec && typ.timeoutSec > 0) {
                expDT = moment().add(typ.timeoutSec, 's').unix();
            }
            $scope.locations.$add({
                Desc: $scope.Desc,
                Lat: $scope.Lat,
                Long: $scope.Long,
                Notes: $scope.Notes,
                Type: $scope.locType.$id,
                dtAdded: now.unix(),
                dtExpire: expDt
            }).then(function (ref) {
                //console.log(ref);
                $('#addModal').modal('hide');
            });
        }
        else {

        }
    };
    $scope.openEdit = function (key) {
        var rec = $scope.locations.$getRecord(key);
        $scope.selectedLoc.Key = key;
        $scope.selectedLoc.Desc = rec.Desc;
        $scope.selectedLoc.Lat = rec.Lat;
        $scope.selectedLoc.Long = rec.Long;
        $scope.selectedLoc.Type = rec.Type;
        $scope.selectedLoc.Notes = rec.Notes;
        //$scope.$apply();
        //$('#editModal').modal('show');
    };
    $scope.updateLocation = function (isValid) {
        console.log('Trying to update location');
        if (isValid) {
            var rec = $scope.locations.$getRecord($scope.selectedLoc.Key);
            console.log(rec);
            //rec.Type = $scope.selectedLoc.Type;
            //rec.Notes += $scope.selectedLoc.Notes;
            //rec.Desc = $scope.selectedLoc.Desc;
            //rec.Type = $scope.selectedLoc.Typ;
            $scope.locations.$save(rec).then(function (ref) {
                console.log('Location Saved');
            });;


        }
        else {

        }
    };
    $scope.hideMapPop = function () {
        $scope.map.closePopup();
    };
    $scope.openAddLocation = function (e) {
        $scope.Lat = e.latlng.lat.toString();
        $scope.Long = e.latlng.lng.toString();
        $scope.mapClicked = true;
        $scope.$apply();
        $('#addLocModal').modal('show');
        //popup.setLatLng(e.latlng)
        //    .setContent("Map Location <br/>" + e.latlng.toString() + "<br/> <button type='button' class='btn btn-sm btn-primary' data-toggle='modal' data-target='#addLocModal'>Add</button>")
        //    .openOn(map);

    };
    $scope.getLocType = function (typeKey) {
        var locType = $scope.locTypes.$getRecord(typeKey);
        return locType;
    }
    $scope.cssLocType = function (type) {
        var icon = $scope.locTypes.$getRecord(type);
        return icon.prefix + ' ' + icon.prefix + '-' + icon.icon;


    };
    $scope.locTypeDesc = function (type) {
        var icon = $scope.locTypes.$getRecord(type);
        return icon.Desc;
    };
    $scope.displayDate = function (epoc) {
        if (epoc === undefined) {
            return "n/a";
        }
        else {
            var dtAdded = moment.unix(epoc);
            return dtAdded.toString();
        }


    };
    $scope.displayDateFromNow = function (epoc) {
        if (epoc === undefined) {
            return "??";
        }
        else {
            var dtAdded = moment.unix(epoc);
            return dtAdded.fromNow();
        }


    };
    $scope.zoomTo = function (lat, long, zl) {
        $scope.map.setView([lat, long], zl);
    };

    var map = L.map('image-map', {
        minZoom: 1,
        maxZoom: 5,
        center: [-150.83333, 121],
        zoom: 2,
        crs: L.CRS.Simple,
        contextmenu: true,
        contextmenuWidth: 170,
        contextmenuItems: [{
            text: 'Show coordinates',
            callback: showCoordinates
        }, {
            text: 'Center map here',
            callback: centerMap
        },
        {
            text: 'Add Location',
            iconCls: 'plus',
            iconPrefix: 'fa',
            callback: $scope.openAddLocation
        },
            '-', {
            text: 'Zoom in',
            iconCls: 'search-plus',
            iconPrefix: 'fa',
            callback: zoomIn
        }, {
            text: 'Zoom out',
            iconCls: 'search-minus',
            iconPrefix: 'fa',
            callback: zoomOut
        }, {
            separator: true
        }]
    });
    //console.log(map.contextmenu);
    function showCoordinates(e) {
        alert(e.latlng);
    }

    function centerMap(e) {
        $scope.map.panTo(e.latlng);
    }

    function zoomIn(e) {
        $scope.map.zoomIn();
    }

    function zoomOut(e) {
        $scope.map.zoomOut();
    }
    function editLocation(e, v) {
        console.log('QuickDelete ', e);
        console.log('Context Key ', v);
        alert('Not Implemneted yet');
    }
    function quickDelete(e, v) {
        console.log('QuickDelete ', e);
        console.log('Context Key ', v);
        $scope.removeLocation(v);
    }
    function quickAdd(e, v) {
        console.log('QuickAdd ', e);
        console.log('Context Key ', v);
        var typ = $scope.getLocType(v);
        var now = moment();
        var expDT = 0;
        console.log('ExpireSecs ' + typ.timeoutSec);
        if (typ.timeoutSec && typ.timeoutSec > 0) {
            expDT = moment().add(typ.timeoutSec, 's').unix();
        }
        $scope.locations.$add({
            Desc: "Quick Add",
            Lat: e.latlng.lat,
            Long: e.latlng.lng,
            Notes: "",
            Type: v,
            dtAdded: now.unix(),
            dtExpire: expDT
        }).then(function (ref) {
            //console.log(ref);
            //$('#addModal').modal('hide');
        });
    }
    var w = 4095,
        h = 4095,
        url = 'http://www.csprance.com/shots/islands_sat.jpg';
    var southWest = map.unproject([0, h], map.getMaxZoom() - 1);
    var northEast = map.unproject([w, 0], map.getMaxZoom() - 1);
    var bounds = new L.LatLngBounds(southWest, northEast);
    $scope.map = map;

    // add the image overlay,
    // so that it covers the entire map
    L.imageOverlay(url, bounds).addTo(map);
    L.AwesomeMarkers.Icon.prototype.options.prefix = '';
    // tell leaflet that the map is exactly as big as the image
    map.setMaxBounds(bounds);
    var popup = L.popup();

    $scope.map = map;

    //map.on('contextmenu', $scope.dblClickMap);

}]);

angular.element(document).ready(function () {
    angular.bootstrap(document, ['myApp'], { strictDi: false });
});