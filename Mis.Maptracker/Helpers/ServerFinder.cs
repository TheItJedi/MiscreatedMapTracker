using RestSharp;
using System;
using System.Collections.Generic;
using System.Net;

namespace Mis.Maptracker.Helpers
{
    public class ServerFinder
    {
        private const string APIKey = "C963993730C30D4E20ED668FA7259C90";
        private const int MaxInGetAll = 1000;
        public List<MiscreatedServer> FindAll()
        {
            //https://api.steampowered.com/IGameServersService/GetServerList/v1/?key=C963993730C30D4E20ED668FA7259C90&filter=appid\299740&limit=1000

            var client = new RestClient("https://api.steampowered.com/");
            var request = new RestRequest("/IGameServersService/GetServerList/v1/?key={key}&filter={appID}&limit={limit}&format=json", Method.GET);
            request.AddUrlSegment("key", APIKey); // replaces matching token in request.Resource
            request.AddUrlSegment("appID", "appid\\299740");
            request.AddUrlSegment("limit", MaxInGetAll.ToString());
            var response = client.Execute<SteamServerListResponse>(request);
            if (response.Data.response.servers.Count > 0)
            {
                var validServers = new List<MiscreatedServer>();
                foreach (var srv in response.Data.response.servers)
                {
                    if (srv.appid == 299740)
                    {
                        validServers.Add(new MiscreatedServer() { IPAddress = srv.AddrIP, Port = srv.AddrPort.ToString(), Name = srv.name, Success = true });
                    }
                }
                return validServers;
            }
            else
            {
                return new List<MiscreatedServer>();
            }
            //https://api.steampowered.com/IGameServersService/GetServerList/v1/?key=C963993730C30D4E20ED668FA7259C90&filter=appid\299740&limit=1000
        }
        public List<MiscreatedServer> FindAtIP(string ipaddress)
        {
            var client = new RestClient("https://api.steampowered.com/");
            var request = new RestRequest("/ISteamApps/GetServersAtAddress/v1/?addr={ip}&key={key}&format=json", Method.GET);
            request.AddUrlSegment("ip", ipaddress); // adds to POST or URL querystring based on Method
            request.AddUrlSegment("key", APIKey); // replaces matching token in request.Resource
            var response = client.Execute<SteamServerAtAddressResponse>(request);
            if (response.Data.response.success)
            {
                var validServers = new List<MiscreatedServer>();
                foreach (var srv in response.Data.response.servers)
                {
                    if (srv.appid == 299740)
                    {
                        var serverINfo = new A2S_INFO(new IPEndPoint(IPAddress.Parse(srv.AddrIP), srv.AddrPort));
                        validServers.Add(new MiscreatedServer() { IPAddress = srv.AddrIP, Port = srv.AddrPort.ToString(), Name = serverINfo.Name, Success = true });
                    }
                }
                return validServers;
            }
            else
            {
                return new List<MiscreatedServer>();
            }
        }
    }
    public class AtAddressResponse
    {
        public bool success { get; set; }
        public List<SteamServerItem> servers { get; set; }
    }
    public class ServerListResponse
    {
        public List<SteamServerItemEnhanced> servers { get; set; }
    }
    public class SteamServerAtAddressResponse
    {
        public AtAddressResponse response { get; set; }
    }
    public class SteamServerListResponse
    {
        public ServerListResponse response { get; set; }
    }
    public class SteamServerItemEnhanced : SteamServerItem
    {
        public string steamid { get; set; }
        public string name { get; set; }
        public string product { get; set; }
        public string players { get; set; }
        public string max_players { get; set; }
        public string gametype { get; set; }
    }
        public class SteamServerItem
    {
        /*
         * "addr": "162.244.55.44:64092",
				"gmsindex": 65534,
				"appid": 299740,
				"gamedir": "miscreated",
				"region": -1,
				"secure": true,
				"lan": false,
				"gameport": 64090,
				"specport": 0
                */
        public string addr { get; set; }
        public int gmsindex { get; set; }
        public int appid { get; set; }
        public string gamedir { get; set; }
        public string region { get; set; }
        public bool secure { get; set; }
        public bool lan { get; set; }
        public int gameport { get; set; }
        public int specport { get; set; }
        public string AddrIP
        {
            get
            {
                if (String.IsNullOrEmpty(addr))
                    return String.Empty;
                else
                {
                    var addrParts = addr.Split(':');
                    return addrParts[0];
                }
            }
        }
        public int AddrPort
        {
            get
            {
                if (String.IsNullOrEmpty(addr))
                    return 0;
                else
                {
                    var addrParts = addr.Split(':');
                    int port = 0;
                    Int32.TryParse(addrParts[1], out port);
                    return port;
                }
            }
        }
    }
    public class MiscreatedServer
    {
        public string IPAddress { get; set; }
        public string Port { get; set; }
        public string Name { get; set; }
        public bool Success { get; set; }
    }
}