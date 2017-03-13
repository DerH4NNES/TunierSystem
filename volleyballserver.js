"use strict";

const fs = require("fs");
const express = require("express");
const helmet = require("helmet");
const compression = require("compression");
const app = express();
const http = require("http").Server(app);
const io = require("socket.io")(http);
const async = require("async");
const bodyparser = require("body-parser");
const md5 = require("md5");

const manager = require("./modules/manager.js");

process.chdir(__dirname);

var config = {};
var clients = [];
var runningConfig = {
    started:false
};

function init()
{

    var next = ()=>{
        http.listen(config.port,()=>{
            console.log("HTTP Server started. Listening on Port: "+config.port);

            app.use(helmet());
            app.use(compression());
            app.use(bodyparser.urlencoded({ extended: true }))
            app.use(bodyparser.json())
            app.use("/cdn",express.static("htdocs/"));
            async.each(config.staticFiles,(item,_next)=>{
                fs.readFile(item.localePath,(err,content)=>{
                    if(err){
                        _next(err);
                    }
                    else{
                        app.get(item.webUrl,((req,res)=>{
                            res.status(200);
                            res.setHeader("Content-Type",this.contentType);
                            res.send(this.content);
                            res.end();
                        }).bind({"contentType":item.contentType,"content":content}));
                        _next();
                    }
                });
            },(err)=>{
                if(err){
                    console.error("FATAL STATIC FILES ERROR!");
                    console.error(err);
                    throw Error("FATAL STATIC FILES ERROR");
                }
                else{
                    registerRoutes();
                    startSocket();
                }
            });

        });
    };

    fs.readFile("config.json",(err,data)=>{
        if(err){
            console.error("FATAL ERROR! CAN'T READ CONFIG");
            console.error(err);
        }
        else{
            try{
                config = JSON.parse(data);
                console.log("Config loaded...");
                next();
            }catch(ex){
                console.error("FATAL ERROR! CAN'T PARSE CONFIG");
                console.error(ex);
            }
        }
    });
}


init();


function registerRoutes()
{
    app.get("/init",(req,res)=>{
        if(runningConfig.started==false){
            res.redirect("/cdn/init.html");
        }
        else{
            httpForbidden(res);
        }
    });

    app.post("/api/init",(req,res)=>{
        if(runningConfig.started==false){
            if(req.body.competitions){

                runningConfig.competitions = [];
                /*req.body.competitions.forEach(()=>{

                });*/

                //Next Step 
                var _nextStep = ()=>{
                runningConfig.gameMaster = {
                    secret: md5(Date.now()+Math.random()),
                    socket:null,
                    masterHTML:""
                };
                runningConfig.referees=[];
                for(var i=0; i<req.body.places;i++)runningConfig.referees.push({
                    id:i,
                    secret:md5(Date.now()+Math.random()),
                    socket:null,
                    refereeHTML:"",
                    actualGame:null
                });
                fs.readFile(config.masterFile,(err,data)=>{
                    if(err){
                        console.error("Blocking INIT - File not found");
                        httpForbidden(res);
                    }
                    else{
                        runningConfig.gameMaster.masterHTML=data;
                        fs.readFile(config.refereeFile,(err2,data2)=>{
                            if(err2){
                                console.error("Blocking INIT - File2 not found!");
                                httpForbidden(res);
                            }
                            else{
                                runningConfig.referees.forEach((rf)=>{rf.refereeHTML=data2;});
                                //runningConfig.gameMaster.masterHTML=data;
                                console.log("Game Started. Turniere: "+runningConfig.competitions.length);
                                runningConfig.started=true;
                                res.status(200);
                                res.setHeader("Content-Type","text/plain");
                                res.send("/master/"+runningConfig.gameMaster.secret);
                                res.end();
                            }
                        });
                    }
                });};
                //END Next Step


                async.each(req.body.competitions,(comp,_next)=>{
                    runningConfig.competitions.push(new manager(comp));
                    _next();
                },(err)=>{
                    if(err){
                        console.error(err);
                        httpForbidden(res);
                    }
                    else{
                        _nextStep();
                    }
                });
            }
            else{
                console.error("Blocking INIT - no Data");
                httpForbidden(res);
            }
        }
        else{
            console.error("Blocking INIT - Game running");
            httpForbidden(res);
        }
    });

    app.get("/master/:key",(req,res)=>{
        if(runningConfig.started){
            if(req.params.key){
                if(runningConfig.gameMaster.secret == req.params.key){
                    runningConfig.gameMaster.socketSecret = md5(Date.now()+Math.random());
                    res.status(200);
                    res.setHeader("Content-Type","text/html");
                    res.send(runningConfig.gameMaster.masterHTML.toString().replace("#@KEYPLACE@#","<!--#"+runningConfig.gameMaster.secret+"#-->"));
                    res.end();
                }
                else{
                    console.error("MASTER ERROR: Key wrong");
                    httpForbidden(res);
                }
            }
            else{
                console.error("MASTER ERROR: no Key");
                httpForbidden(res);
            }
        }
        else{
            console.error("MASTER ERROR: game not started");
            httpForbidden(res);
        }
    });
    app.get("/api/master/:key/data",(req,res)=>{
        if(runningConfig.started){
            if(req.params.key){
                if(runningConfig.gameMaster.secret == req.params.key){
                    var toSend = {referees:[]};
                    async.each(runningConfig.referees,(ref,_next)=>{
                        toSend.referees.push({"id":ref.id,"actualGame":ref.actualGame});
                        _next();
                    },(err)=>{
                        if(err){
                            console.error(err);
                            httpForbidden(res);
                        }
                        else{
                            toSend.competitions=[];
                            toSend.socketSecret=runningConfig.gameMaster.socketSecret;

                            async.each(runningConfig.competitions,(comp,_next)=>{

                                toSend.competitions.push({"name":comp.getTurnierName,"games":comp.getGamesThisLayer,"teams":comp.getRemainingTeams,"layer":comp.getCurrentLayer});
                                if(toSend.competitions[toSend.competitions.length-1].layer.layer==0)toSend.competitions[toSend.competitions.length-1].groups=comp.getGroups;
                                _next();
                            },(err)=>{
                                if(err){
                                    console.error(err);
                                    httpForbidden(res);
                                }
                                else{
                                    res.status(200);
                                    res.setHeader("Content-Type","application/json");
                                    res.send(JSON.stringify(toSend));
                                }
                            });
                            
                        }
                    });
                }
                else{
                    console.error("MASTER API: wrong key");
                    httpForbidden(res);
                }
            }
            else{
                console.error("MASTER API: no key");
                httpForbidden(res);
            }
        }
        else{
            console.error("MASTER API: game not started");
            httpForbidden(res);
        }
    });


}

function httpForbidden(res)
{
    res.status(403);
    res.setHeader("Content-Type","text/plain");
    res.send("Error 403: Forbidden");
    res.end();
}

function startSocket()
{
    io.on("connection",(socket)=>{
        
        socket.on("auth",(msg)=>{
            var data = JSON.tryParse(msg);var tref = null;
            
            if(runningConfig.started&&data.type=="master"&&runningConfig.gameMaster.socket==null&&data.secret==runningConfig.gameMaster.socketSecret){
                runningConfig.gameMaster.socket=socket;
                console.log("GameMaster Auth Confirm");
                socket.emit("authConfirm",JSON.stringify({"status":"OK"}));
            }
            else if(runningConfig.started&&data.type=="referee"&&(tref=runningConfig.referees.find((rf)=>{rf.socketSecret==data.secret}))){
                tref.socket = socket;
                socket.emit("authConfirm",JSON.stringify({"status":"OK"}));
            }
            else{
                console.error("Socket Auth Error:");
                console.error(runningConfig.started,data.type,data.secret,"==",runningConfig.gameMaster.socketSecret);
                socket.emit("authConfirm",JSON.stringify({"status":"ERROR"}));
            }
        });

        socket.on("pickNewGame",(msg)=>{
            var data = JSON.tryParse(msg);
            if(data.type=="master"){

                if(runningConfig.referees[data.referee]&&runningConfig.referees[data.referee].actualGame==null){
                    var remG = runningConfig.competitions[data.competition].getRandomRemainingGame;
                    if(remG){
                        runningConfig.referees[data.referee].actualGame=remG;
                        if(runningConfig.referees[data.referee].socket){
                            runningConfig.referees[data.referee].socket.emit("gameSet",JSON.stringify({"status":"OK"}));
                        }
                        if(runningConfig.gameMaster.socket){
                            runningConfig.gameMaster.socket.emit("gameSet",JSON.stringify({"status":"OK"}));
                        }
                    }
                }

            } 
            else if(data.type=="referee"){
                var mer = runningConfig.referees.find((r)=>{return r.socket&&r.socket.id==socket.id;});
                if(mer.actualGame==null){
                    var remG = runningConfig.competitions[data.competition].getRandomRemainingGame;
                    if(remG){
                        mer.actualGame=remG;
                        if(mer.socket){
                            mer.socket.emit("gameSet",JSON.stringify({"status":"OK"}));
                        }
                        if(runningConfig.gameMaster.socket){
                            runningConfig.gameMaster.socket.emit("gameSet",JSON.stringify({"status":"OK"}));
                        }
                    }
                }
            }
        });

        socket.on("endRound",(msg)=>{
            var data = JSON.tryParse(msg);
            if(runningConfig.competitions[data.competition]){
                runningConfig.competitions[data.competition].finishLayer();
                socket.emit("competitionLayerConfirm",JSON.stringify({status:"OK"}));
                runningConfig.referees.forEach((r)=>{r.actualGame=null;});
            }
            else{
                socket.emit("competitionLayerConfirm",JSON.stringify({status:"ERROR"}));
            }
        });

        socket.on("disconnect",()=>{
            //console.log("disconnect");
            if(!runningConfig.gameMaster)return;
            runningConfig.gameMaster.socket.id==socket.id?runningConfig.gameMaster.socket=null:false;
            var ref = runningConfig.referees.find((rf)=>{return rf.socket&&rf.socket.id==socket.id;});
            if(ref)ref.socket=null;
        });
    });
}

function getClientBySocket(socket)
{
    if(clients.length>0){
        return clients.find((cl)=>{return cl.socket.id == socket.id;});
    }
    else return null;
}

function getClientBySecret(secret)
{
    if(clients.length>0){
        return clients.find((cl)=>{return cl.secret == secret;});
    }
    else return null;
} 

JSON.tryParse = function(inp)
{
    try{
        return JSON.parse(inp);
    }
    catch(ex){
        console.error("FATAL JSON EXCEPTION:");
        console.error(ex);
        return {};
    }
}