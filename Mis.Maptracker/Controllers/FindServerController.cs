using Mis.Maptracker.Helpers;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;

namespace Mis.Maptracker.Controllers
{
    public class FindServerController : ApiController
    {
        [Route("servers/ByIP/{IP}")]
        [HttpGet]
        public List<MiscreatedServer> ByIP(string IP = "162.244.55.44")
        {
            ServerFinder finder = new ServerFinder();
            var servers = finder.FindAtIP(IP);
            return servers;
        }
    }
}
