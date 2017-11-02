    class MapLocation {
        Desc: string;
        Lat: string;
        Long: string;
        Notes: string;
        Type: string;
        dtAdded: string;
        dtExpire: number;
        createdBy: string;
        mapMode: number;
        
        constructor(desc: string, lat: string, lng: string,notes:string,type:string,user:string){
            this.Desc = desc;
            this.dtExpire = 0;
            this.Lat = lat;
            this.Long = lng;
            this.Notes = notes;
            this.Type = type;
            this.createdBy = user;
            this.mapMode = 1; //Default for old MapMode
        }
        isNewMapping(): boolean {
            if (this.mapMode === undefined || this.mapMode == 1)
                return false;
            else
                return true;
        }
        setTimeout(timeoutEpoc: number)
        {
            this.dtExpire = timeoutEpoc;
        }
    }
