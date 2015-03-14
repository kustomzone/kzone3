#!/usr/bin/env node

var Env, IndexScene, Reflector, Scene, Server, WebsocketServer, cors, express, fs, glob, http, path, scenePath,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

var _ 			= require('underscore');

Reflector 		= require('./js/lib/reflector');
WebsocketServer = require('./js/lib/websocket_server');
Scene 			= require('./js/objects/scene');
IndexScene 		= require('./js/lib/index_scene');
Env 			= require('./js/lib/env');

// core mods?
path 			= require('path');
fs 				= require('fs');
glob 			= require('glob');
express 		= require('express');
http 			= require('http');
cors 			= require('cors');

// var routes = require("./routes");

// loader.. ( node mods?)

// var normalizedPath = require("path").join(__dirname, "routes");
// require("fs").readdirSync(normalizedPath).forEach(function(file) {
// 		require("./routes/" + file);
// });

// alt loader..
// var requireDir = require('require-dir');
// var dir = requireDir('./path/to/dir');


function Server(folder, port) {
  this.folder = folder;
  this.port = port;
  this.restartServer = __bind(this.restartServer, this);
  this.onLoaded = __bind(this.onLoaded, this);

  console.log("[server] Serving scenes in '" + this.folder + "' on port " + this.port + "...");

  this.webServer = express();
  this.webServer.use(cors());
  this.webServer.use(express["static"](this.folder));

  var httpServer = http.createServer(this.webServer);
  httpServer.listen(port);

  this.websocketServer = new WebsocketServer(httpServer);
  this.websocketServer.listen();

  if(Env.supportsAutoReload()){
    this.restart = _.throttle(this.restartServer, 1000, {trailing: false});
  }

  this.loadAllScenes();

  if(Env.isDevelopment()){
    require('dns').lookup(require('os').hostname(), function (err, add, fam) { 
      console.log('\nOpen the following url to view your scenes:\n\thttp://client.scenevr.com/?connect=' + add + ':' + port + '/index.xml\n'); 
    })
  }
}

Server.prototype.loadAllScenes = function() {
  var _this = this;

  glob(this.folder + "/*.xml", {}, function(er, files){

    if(files.length == 0){
      console.log("[server] Error. No scene files found in " + _this.folder);
      if(Env.isDevelopment()){
        process.exit(-1);
      }
    }

    var indexXml = new IndexScene(files).toXml();

    Scene.load(indexXml, function(scene) {
      _this.onLoaded(scene, '/index.xml');
    });

    files.forEach(function(filename) {
      Scene.load(filename, function(scene){
        _this.onLoaded(scene, '/' + path.basename(filename));

        if(Env.supportsAutoReload()){
          fs.watch(filename, _this.restart);
        }
      });
    });
  });
};

Server.prototype.onLoaded = function(scene, filename) {
  console.log("[server]  * Loaded '" + filename + "'");

  var reflector = new Reflector(scene, filename);
  this.websocketServer.reflectors[filename] = reflector;
  reflector.start();
};

if(Env.supportsAutoReload()){
  Server.prototype.restartServer = function() {
    var filename, reflector, _ref;
    console.log("[server] Restarting server on file change.");
    _ref = this.websocketServer.reflectors;
    for (filename in _ref) {
      reflector = _ref[filename];
      reflector.emit('<event name="restart" />');
      reflector.stop();
      reflector.scene.stop();
      delete reflector.scene;
    }
    return setTimeout((function(_this) {
      return function() {
        _this.websocketServer.clearReflectors();
        return _this.loadAllScenes();
      };
    })(this), 250);
  };
}

scenePath = process.argv[2];

if (!scenePath) {
  console.log("Usage: scenevr [scenedirectory]");
  process.exit(-1);
}

new Server(scenePath, Env.getPort());
