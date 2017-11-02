var MapLocation = (function () {
    function MapLocation(desc, lat, lng, notes, type, user) {
        this.Desc = desc;
        this.dtExpire = 0;
        this.Lat = lat;
        this.Long = lng;
        this.Notes = notes;
        this.Type = type;
        this.createdBy = user;
        this.mapMode = 1; //Default for old MapMode
    }
    MapLocation.prototype.isNewMapping = function () {
        if (this.mapMode === undefined || this.mapMode == 1)
            return false;
        else
            return true;
    };
    MapLocation.prototype.setTimeout = function (timeoutEpoc) {
        this.dtExpire = timeoutEpoc;
    };
    return MapLocation;
}());
//# sourceMappingURL=Location.js.map