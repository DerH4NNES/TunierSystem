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

                //TODO INITIIERE SASCHAS KLASSE etc..
                runningConfig.turnier = {};

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
                                runningConfig.started=true;
                                res.status(200);
                                res.setHeader("Content-Type","text/plain");
                                res.send("/master/"+runningConfig.gameMaster.secret);
                                res.end();
                            }
                        });
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
                            toSend.competitions=runningConfig.competitions;
                            toSend.socketSecret=runningConfig.gameMaster.socketSecret;
                            //TODO SEND INFORMATIVE DATA
                            res.status(200);
                            res.setHeader("Content-Type","application/json");
                            res.send(JSON.stringify(toSend));
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
            var data = JSON.tryParse(msg);
            if(runningConfig.started&&data.type=="master"&&runningConfig.gameMaster.socket==null&&data.key==runningConfig.gameMaster.secret){
                runningConfig.gameMaster.socket=socket;
                socket.emit("authConfirm",JSON.stringify({"status":"OK"}));
            }
            else{
                socket.emit("authConfirm",JSON.stringify({"status":"ERROR"}));
            }
        });



        io.on("disconnect",()=>{
            runningConfig.referees.find((rf)=>{rf.socket.id==socket.id}).socket=null;
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