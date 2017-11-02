using Mis.Maptracker.Helpers;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;

namespace Mis.Maptracker.Controllers
{
    public class ServerInfoController : ApiController
    {
        public ServerInfo Get(string IP = "162.244.55.44", int Port = 64152)
        {
            var serverINfo = new A2S_INFO(new IPEndPoint(IPAddress.Parse(IP), Port));
            if (serverINfo.IsValid)
                return new ServerInfo(serverINfo);
            else
                return null;
        }
    }

    public class ServerInfo
    {
        public string Name { get; set; }
        public int MaxPlayers { get; set; }
        public int NumPlayers { get; set; }

        public string TimeOfDay { get; set; }
        public ServerInfo(A2S_INFO from)
        {
            var tags = from.Keywords.Split(';').ToArray();
            Name = from.Name;
            MaxPlayers = from.MaxPlayers;
            NumPlayers = from.Players;
            TimeOfDay = tags[0];
            int numPlayers = 0;
            if (Int32.TryParse(tags[1], out numPlayers))
                if (NumPlayers != numPlayers)
                    NumPlayers = numPlayers;
        }
    }
}
