using Mis.Maptracker.Helpers;
using Mis.Maptracker.Helpers.SteamQuery;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;

namespace Mis.Maptracker.Controllers
{
    public class ServersController : ApiController
    {
        public List<Helpers.SteamQuery.Server> GetAll()
        {
            var client = new MasterServer();
            //var t = client.GetServers(MasterServerRegion.All, MasterServerFilter.Dedicated());// MasterServerFilter.Gamedir("miscreated"));
            var t = client.GetServers(MasterServerRegion.All, MasterServerFilter.Gamedir("arma2arrowpc"));
            t.Wait(TimeSpan.FromSeconds(30));
            var num_servers = t.Result.Count();
            return new List<Helpers.SteamQuery.Server>();
        }
    }
}