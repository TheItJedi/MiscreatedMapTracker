var myApp = angular.module('myApp', ["firebase", "ngCookies"]);

//myApp.directive('myDirective', function() {});
//myApp.factory('myService', function() {});

myApp.controller('MyCtrl', ['$scope', '$firebaseArray', '$timeout', '$cookies', '$http', function MyCtrl($scope, $firebaseArray, $timeout, $cookies, $http) {
    $scope.checkInterval = 60000;
    $scope.checkIntervalCnt = 1;
    $scope.timeInMs = 0;
    var types = firebase.database().ref().child("lookups/locTypes");
    var zooms = firebase.database().ref().child("lookups/zoomLevels");
    var ref = firebase.database().ref().child("locations");
    var srvs = firebase.database().ref().child("servers");
    // download the data into a local object
    $scope.Desc = "";
    $scope.Lat = '0.0';
    $scope.Long = '0.0';
    $scope.locType = "Base";
    $scope.Notes = "";
    $scope.mapMarkers = {};
    $scope.mapMarkerGroups = {};

    firebase.auth().onAuthStateChanged(function (user) {
        window.user = user; // user is undefined if no user signed in
        $scope.checkLogin();
    });

    $scope.mapIcons = {};
    $scope.mapClicked = false;
    $scope.showToastr = false;
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
        if ($scope.checkIntervalCnt > 10)
            $scope.checkIntervalCnt = 1;
        $scope.timeInMs += $scope.checkInterval;
        console.log('Checking Timed Out Locations Total#: ' + $scope.locations.length);
        angular.forEach($scope.locations, function (location) {
            if (location.dtExpire && location.dtExpire > 0) {
                var now = moment();
                if (location.dtExpire <= now.unix() && $scope.isLoggedIn) {
                    console.log('Location is Expired ' + location.$id);
                    $scope.removeLocation(location.$id);
                }
            }
        });
        angular.forEach($scope.servers, function (server) {
            if ($scope.checkIntervalCnt >= server.refreshInterval) {
                var numPlayerBefore = server.NumPlayers;
                console.log('Checking Server Population: ' + server.$id + ' ' + $scope.checkIntervalCnt + ' >=' + server.refreshInterval);
                $scope.refreshServer(server.$id, true);
            }
            else
            {
                console.log('Skipping Check on : ' + server.$id + ' ' + $scope.checkIntervalCnt + ' >=' + server.refreshInterval);
            }

        });
        $scope.checkIntervalCnt++;
        $timeout(checkTimedout, $scope.checkInterval);
    };
    $scope.checkLogin = function () {
        var user = firebase.auth().currentUser;

        if (user) {
            $scope.isLoggedIn = true;
            $scope.userName = user.displayName;
        } else {
            $scope.isLoggedIn = false;
            $scope.userName = "";
        }

        $scope.selectedGroups = {
            group: {}
        };
    };
    $scope.checkLogin();
    //Intial Start
    $timeout(checkTimedout, $scope.checkInterval);
    $scope.zooms = $firebaseArray(zooms);
    $scope.locTypes = $firebaseArray(types);
    $scope.locations = $firebaseArray(ref);
    $scope.servers = $firebaseArray(srvs);
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
        if (event.event === "child_added") {
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
        if (event.event === "child_changed") {
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
    $scope.openAddServer = function () {
        $('#addServerModal').modal('show');
    };
    $scope.addServer = function (isValid) {
        if (isValid) {
            $http({
                method: 'GET',
                url: '/api/ServerInfo/?Port=' + $scope.serverPort + '&IP=' + $scope.serverIP
            }).then(function successCallback(response) {
                //console.log(response.data);
                // this callback will be called asynchronously
                // when the response is available
                $scope.servers.$add({
                    MaxPlayers: response.data.MaxPlayers,
                    NumPlayers: response.data.NumPlayers,
                    DtLastUpdated: moment().toString(),
                    Name: response.data.Name,
                    IP: $scope.serverIP,
                    Port: $scope.serverPort
                }).then(function (ref) {
                    //console.log(ref);
                    $('#addServerModal').modal('hide');
                });

            }, function errorCallback(response) {
                console.log('Error ' + resposne);
                // called asynchronously if an error occurs
                // or server returns response with an error status.
            });
        }
    };
    $scope.refreshServer = function (key, alertIfChanged) {
        var serverLoc = $scope.servers.$getRecord(key);
        console.log('Refreshing Server ' + key);
        if (serverLoc) {
            $http({
                method: 'GET',
                url: '/api/ServerInfo/?Port=' + serverLoc.Port + '&IP=' + serverLoc.IP
            }).then(function successCallback(response) {
                //console.log(response.data);
                // this callback will be called asynchronously
                // when the response is available
                if (alertIfChanged) {
                    if (response.data.NumPlayers > serverLoc.NumPlayers) {
                        toastr.warning(response.data.Name + ' Population rose to ' + response.data.NumPlayers + '/' + response.data.MaxPlayers);
                    }
                    else if (response.data.NumPlayers < serverLoc.NumPlayers) {
                        toastr.info(response.data.Name + ' Population dropped to ' + response.data.NumPlayers + '/' + response.data.MaxPlayers);
                    }
                }
                if ($scope.isLoggedIn === true) {
                    var now = moment();
                    if (serverLoc.shortHistory === undefined) {
                        serverLoc.shortHistory = [];
                        serverLoc.shortHistory.push({ epoch: now.unix(), NumPlayers: response.data.NumPlayers });
                    }
                    else {
                        if (serverLoc.shortHistory.length >= 20) {
                            serverLoc.shortHistory.pop(); // pull last 1 off;
                        }
                        serverLoc.shortHistory.push({ epoch: now.unix(), NumPlayers: response.data.NumPlayers });
                    }
                    var fbServer = firebase.database().ref().child("history").child(key);
                    fbServer.child('history/' + now.unix()).set({ epoch: now.unix(), NumPlayers: response.data.NumPlayers, TimeOfDay: response.data.TimeOfDay, MaxPlayers: response.data.MaxPlayers });
                    serverLoc.MaxPlayers = response.data.MaxPlayers;
                    serverLoc.TimeOfDay = response.data.TimeOfDay;
                    serverLoc.NumPlayers = response.data.NumPlayers;
                    serverLoc.DtLastUpdated = moment().toString();
                    serverLoc.Name = response.data.Name;
                    $scope.servers.$save(serverLoc);
                }


            }, function errorCallback(response) {
                console.log('Error ' + resposne);
                // called asynchronously if an error occurs
                // or server returns response with an error status.
            });
        }
    };
    $scope.locations.$watch(function (event) {

        //console.log(event);
        if (event.event === "child_added") {
            // work here
            var rec = $scope.locations.$getRecord(event.key);
            //Fix to get PixelLocations then swtich to new mapping cord ssytems
            if (rec.mapMode === undefined || rec.mapMode === 0) {
                var ll = new L.latLng(rec.Lat, rec.Long);
                var pixelLoc = $scope.map.latLngToLayerPoint(ll);
                console.log(pixelLoc);
            }
            if ($scope.showToastr)
                console.log("Location Added " + event.key);
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

            var mkr = L.marker([rec.Lat, rec.Long], iconObj);//.addTo($scope.map);
            console.log('PixelLoc' + $scope.map.project(mkr.getLatLng(), 1));
            rec.marker = mkr;
            var mkrGroup = $scope.mapMarkerGroups[rec.Type];
            if (mkrGroup) {
                mkrGroup.addLayer(mkr);
                $scope.selectedGroups.group[rec.Type].count++;
            }
            else {
                mkrGroup = L.layerGroup();//.addTo($scope.map);
                mkrGroup.addLayer(mkr);
                mkrGroup.addTo($scope.map);
                $scope.selectedGroups.group[rec.Type] = { selected: 'true', count: 1 };
                $scope.mapMarkerGroups[rec.Type] = mkrGroup;

            }

            $scope.mapMarkers[event.key] = mkr;
            var notes = rec.Notes;
            if (notes === undefined)
                notes = "";

            var typeData = '<i class="' + $scope.cssLocType(rec.Type) + '"></i>  ' + $scope.locTypeDesc(rec.Type);
            //mkr.bindPopup('<b>' + rec.Desc + '</b> <br/> <i>' + notes + '</i><br/>Added: ' + $scope.displayDate(rec.dtAdded) + '<br/>' + typeData + "<button type='button' class='btn btn-sm btn-primary'data-toggle='modal' data-target='#editLocModal'>Edit</button>");
            mkr.on('click', L.bind($scope.openEdit, null, rec.$id));
            if ($scope.showToastr) {
                if ($scope.isLoggedIn && $scope.userName === rec.createdBy) {
                    console.log('Skipping toastr because I added it');
                }
                else {
                    toastr.options = {
                        "closeButton": true,
                        "timeOut": "20000",
                        "extendedTimeOut": "0",
                        preventDuplicates: true
                    };
                    toastr.options.onclick = function () {

                        $scope.map.setView([rec.Lat, rec.Long], $scope.map.maxZoom);
                    };
                    toastr.info(typeData + ' Added by ' + rec.createdBy);
                }
            }
        }
        if (event.event === "child_removed") {
            console.log("Location Updated " + event.key);
            var marker = $scope.mapMarkers[event.key];
            marker.remove();
        }

    });
    $scope.calcPercentage = function (cur, max) {
        var final = (cur / max) * 100;
        return 'width: ' + final.toFixed(2) + '%;';
    }
    $scope.removeLocation = function (key) {
        //console.log("Removing " + key);
        if ($scope.isLoggedIn === false) {
            $('#errorModal').modal('show');
            return;
        }
        var rec = $scope.locations.$getRecord(key);
        console.log(rec);
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

    $scope.addLocation = function (isValid) {
        if ($scope.isLoggedIn === false) {
            $('#errorModal').modal('show');
            return;
        }
        if (isValid) {
            //console.log('Adding' + $scope.Desc);
            var now = moment();
            var typ = $scope.getLocType($scope.locType.$id);
            var expDT = 0;
            var locObject = new MapLocation($scope.Desc, $scope.Lat, $scope.Long, $scope.Notes, $scope.locType.$id, window.user.displayName);

            if (typ.timeoutSec && typ.timeoutSec > 0) {
                locObject.setTimeout(moment().add(typ.timeoutSec, 's').unix());
            }
            locObject.dtAdded = now.unix();
            $scope.locations.$add(locObject).then(function (ref) {
                $('#addLocModal').modal('hide');
            });
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
    };
    $scope.cssLocType = function (type) {
        var icon = $scope.locTypes.$getRecord(type);
        return icon.prefix + ' ' + icon.prefix + '-' + icon.icon;


    };
    $scope.formatTime = function (gameTime) {
        var now = moment();
        var timeParts = gameTime.split(":");
        now.hours(timeParts[0]);
        now.minutes(timeParts[1]);
        return now.format("h:mm A");
    };
    $scope.locTypeDesc = function (type) {
        var icon = $scope.locTypes.$getRecord(type);
        return icon.Desc;
    };
    $scope.displayDate = function (epoc) {
        if (epoc === undefined) {
            return "";
        }
        else if (epoc === 0) {
            return "";
        }
        else {
            var dtAdded = moment.unix(epoc);
            return dtAdded.format("dddd, MMMM Do YYYY, h:mm:ss a");
        }


    };
    $scope.displayDateFromNow = function (epoc) {
        if (epoc === undefined) {
            return "";
        }
        else if (epoc === 0) {
            return "never";
        }
        else {
            var dtAdded = moment.unix(epoc);
            return dtAdded.fromNow();
        }


    };
    $scope.zoomTo = function (lat, long, zl) {
        $scope.map.setView([lat, long], zl);

    };
    $scope.getTypeCount = function (type) {
        var typeGroup = $scope.selectedGroups.group[type];
        if (typeGroup)// && typeGroup.count)
        {
            //console.log(typeGroup);
            return typeGroup.count;
        }
        else
            return 0;
        //return $scope.selectedGroups.group[type].count;
    };
    $scope.displayServerHistory = function (key, rngType) {
        $('#serverHistoryModal').modal('show');
        var limitTo = 20;
        if (rngType && rngType === "full") {
            itemSource = history;
            $scope.serverHistoryTitle = 'Server History : Full';
            limitTo = 5012;
        }
        else
            $scope.serverHistoryTitle = 'Server History : Last ' + limitTo;
        var fbServerHistory = firebase.database().ref().child("history").child(key).child('history');

        var history = $firebaseArray(fbServerHistory.orderByChild('epoch').limitToFirst(limitTo) );
        history.$loaded().then(function (data) {
            console.log(data);
            var container = document.getElementById('visualization');
            container.innerHTML = "";
            var items = [];
            var maxTime = 0;
            var minTime = 0;
            var itemSource = data;
            
            console.log('Graphing History with Num items = ' + itemSource.length)
            angular.forEach(itemSource, function (history) {
                var time = moment.unix(history.epoch);
                var item = { x: time.toDate(), y: history.NumPlayers, label: history.NumPlayers };
                items.push(item);
                if (time.unix() <= minTime || minTime === 0)
                    minTime = history.epoch;
                if (time.unix() >= maxTime)
                    maxTime = history.epoch;
            });
            console.log(items);
            //    { x: '2014-06-11', y: 10 },
            //    { x: '2014-06-12', y: 25 },
            //    { x: '2014-06-13', y: 30 },
            //    { x: '2014-06-14', y: 10 },
            //    { x: '2014-06-15', y: 15 },
            //    { x: '2014-06-16', y: 30 }
            //];
            var mnMin = moment.unix(minTime);
            var mnMax = moment.unix(maxTime);
            var dataset = new vis.DataSet(items);
            var options = {
                start: mnMin.toDate(),
                end: mnMax.toDate()
                //end: '2014-06-18'
            };
            var graph2d = new vis.Graph2d(container, dataset, options);
        });
        console.log('DONE!');
        
    }
    $scope.toggleType = function (type) {
        //alert('Toggling Type' + type);
        var groupLayer = $scope.selectedGroups.group[type];
        var group = $scope.mapMarkerGroups[type];
        if (groupLayer.selected === 'true') {
            if (group) {
                group.remove();
                group.addTo($scope.map);
            }
        }
        else {
            if (group) {
                group.remove();
            }

        }
    };
    $scope.doLogin = function () {
        var provider = new firebase.auth.GoogleAuthProvider();
        firebase.auth().signInWithPopup(provider).then(function (result) {
            // This gives you a Google Access Token. You can use it to access the Google API.
            var token = result.credential.accessToken;
            // The signed-in user info.
            var user = result.user;
            // ...
            console.log('Username Before ' + $scope.userName);
            $scope.userName = user.displayName;
            console.log('Username After ' + $scope.userName);
            $scope.isLoggedIn = true;
            $('#errorModal').modal('hide');
            $scope.$apply();

        }).catch(function (error) {
            // Handle Errors here.
            var errorCode = error.code;
            var errorMessage = error.message;
            // The email of the user's account used.
            var email = error.email;
            // The firebase.auth.AuthCredential type that was used.
            var credential = error.credential;
            // ...
        });

    };
    //L.imageOverlay(url, newCenterBasedBounds).addTo(map2);
    //map2.fitBounds(newCenterBasedBounds);
    var map = L.map('image-map', {
        minZoom: 13,
        maxZoom: 20,
        zoom: 14,
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
        //{
        //    text: 'ReCenter MAP',
        //    callback: recenterMap
        //},
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

    //var map = L.map('image-map', {
    //    minZoom: 1,
    //    maxZoom: 5,
    //    center: [-150.83333, 121],
    //    zoom: 2,
    //    crs: L.CRS.Simple,
    //    contextmenu: true,
    //    contextmenuWidth: 170,
    //    contextmenuItems: [{
    //        text: 'Show coordinates',
    //        callback: showCoordinates
    //    }, {
    //        text: 'Center map here',
    //        callback: centerMap
    //    },
    //    {
    //        text: 'Add Location',
    //        iconCls: 'plus',
    //        iconPrefix: 'fa',
    //        callback: $scope.openAddLocation
    //    },
    //        '-', {
    //        text: 'Zoom in',
    //        iconCls: 'search-plus',
    //        iconPrefix: 'fa',
    //        callback: zoomIn
    //    }, {
    //        text: 'Zoom out',
    //        iconCls: 'search-minus',
    //        iconPrefix: 'fa',
    //        callback: zoomOut
    //    }, {
    //        separator: true
    //    }]
    //});
    $scope.formatDMSCoords = function (lat, lng) {
        return formatcoords(parseFloat(lat), parseFloat(lng)).format('DD MM ss X', { decimalPlaces: 2 });
    };

    function showCoordinates(e) {
        var msg = e.latlng.toString() + ' \n\nDMS:' + $scope.formatDMSCoords(e.latlng.lat, e.latlng.lng);
        alert(msg);
    }

    function centerMap(e) {
        $scope.map.panTo(e.latlng);
    }
    function recenterMap(e) {
        var centerGame = e.latlng;
        //var centerGame = L.latLng(48.614,-122.996);

        var radiusBounds = centerGame.toBounds(8000);
        url = 'http://www.csprance.com/shots/islands_sat.jpg';
        var imgOverlay = L.imageOverlay(url, radiusBounds).addTo($scope.map);
        $scope.map.fitBounds(radiusBounds);
    }

    function zoomIn(e) {
        $scope.map.zoomIn();
    }

    function zoomOut(e) {
        $scope.map.zoomOut();
    }
    function editLocation(e, v) {
        if ($scope.isLoggedIn === false) {
            $('#errorModal').modal('show');
            return;
        }
        alert('Not Implemneted yet');
    }
    function quickDelete(e, v) {
        if ($scope.isLoggedIn === false) {
            $('#errorModal').modal('show');
            return;
        }
        console.log('QuickDelete ', e);
        console.log('Context Key ', v);
        $scope.removeLocation(v);
    }
    function quickAdd(e, v) {
        if ($scope.isLoggedIn === false) {
            $('#errorModal').modal('show');
            return;
        }
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
            dtExpire: expDT,
            createdBy: window.user.displayName
        }).then(function (ref) {
            //console.log(ref);
            //$('#addModal').modal('hide');
        });
    }
    var w = 4095,
        h = 4095,
        url = 'http://www.csprance.com/shots/islands_sat.jpg';
    //var southWest = map.unproject([0, h], map.getMaxZoom() - 1);
    //var northEast = map.unproject([w, 0], map.getMaxZoom() - 1);
    //var bounds = new L.LatLngBounds(southWest, northEast);

    $scope.map = map;
    var centerGame = L.latLng(48.61438889, -122.99666667);
    //var centerGame = L.latLng(48.614,-122.996);

    var radiusBounds = centerGame.toBounds(8001);
    var imgOverlay = L.imageOverlay(url, radiusBounds).addTo(map);
    map.fitBounds(radiusBounds);
    //var testPoint = L.latLng(48.589805556, -122.99611111);
    //coords = formatcoords(testPoint.lat, testPoint.lng).format();
    //marker = L.marker(testPoint, {
    //    draggable: false,
    //    title: "Test at: " + coords,
    //    alt: "TEST",
    //    riseOnHover: true
    //}).addTo(map);

    

    // add the image overlay,

    var popup = L.popup();
    $scope.map = map;

    //map.on('contextmenu', $scope.dblClickMap);

}]);