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
const cycler = require("cycler");
const manager = require("./modules/manager.js");

process.chdir(__dirname);

var config = {};
var clients = [];
var runningConfig = {
    started:false,
	anzeige: {html:""}
};

process.on('SIGINT', exitHandler);
process.on("uncaughtException",exitHandler);
//process.on("exit",exitHandler);
function exitHandler(err){
    if(err){
        console.error(err);
    }
    //fs.writeFileSync("dump.dat",JSON.stringify(cycler.decycle(runningConfig,null)));
    process.exit();
}

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

function importDump(_goAhead)
{
    fs.readFile("dump.dat",(err,file)=>{
        if(err){
            _goAhead(null);
        }
        else{
            try{
                var obj = JSON.parse(cycler.retrocycle(file,{manager:manager}));
                console.log(obj);
            }
            catch(ex){
                return _goAhead();
            }
            
            runningConfig = obj;
            if(runningConfig.anzeige){runningConfig.anzeige.html=runningConfig.anzeige.html;}
            if(runningConfig.gameMaster){runningConfig.gameMaster.html=runningConfig.gameMaster.masterHTML;}
            if(runningConfig.referees){
                runningConfig.referees.forEach((r)=>{
                    r.refereeHTML=r.refereeHTML;
                });
            }
            if(runningConfig.competitions){
                for(var i=0; i<runningConfig.competitions.length;i++){
                    runningConfig.competitions[i] = new manager(null,runningConfig.competitions[i]);
                }
            }
            runningConfig.gameMaster.socket=null;
            runningConfig.anzeigen.forEach((a)=>{a.socket=null;});
            runningConfig.referees.forEach((r)=>{r.socket=null;});
            _goAhead(runningConfig.gameMaster.secret);
        }
    });
}


init();


function registerRoutes()
{
    app.get("/",(req,res)=>{
        if(runningConfig.started==false)res.redirect("/cdn/init.html");
        else res.redirect("/anzeige");
    });
    app.get("/init",(req,res)=>{
        if(runningConfig.started==false){
            res.redirect("/cdn/init.html");
        }
        else{
            httpForbidden(res);
        }
    });
	app.get("/anzeige",(req,res)=>{
        if(runningConfig.started){
			res.status(200);
			res.setHeader("Content-Type","text/html");
			res.send(runningConfig.anzeige.html.toString());
			res.end();
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
                runningConfig.anzeigen=[];
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
                        runningConfig.gameMaster.masterHTML=data.toString();
                        fs.readFile(config.refereeFile,(err2,data2)=>{
                            if(err2){
                                console.error("Blocking INIT - File2 not found!");
                                httpForbidden(res);
                            }
                            else{
                                runningConfig.referees.forEach((rf)=>{rf.refereeHTML=data2.toString();});
                                //runningConfig.gameMaster.masterHTML=data;
								fs.readFile(config.anzeigenFile,(erro2,datao2)=>{
								if(erro2){
									console.error("Blocking INIT - File3 not found!");
									httpForbidden(res);
								}
								else{
									runningConfig.anzeige.html=datao2.toString();
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

    app.get("/referee/:key",(req,res)=>{
        if(runningConfig.started){
            if(req.params.key){
                var found = false;
                //console.log(runningConfig.referees);
                runningConfig.referees.forEach((referee,ind)=>{
                    if(referee.secret == req.params.key)
                    {
                        found=true;
                        referee.socketSecret = md5(Date.now()+Math.random());
                        res.status(200);
                        res.setHeader("Content-Type","text/html");
                        res.send(referee.refereeHTML.replace("#@KEYPLACE@#","<!--#"+referee.secret+"#-->"));
                        res.end();
                    }
                    if(ind==runningConfig.referees.length-1&&!found){
                        console.error("REFEREE ERROR: wrong key");
                        httpForbidden(res);
                    }
                });
            }
            else{
                console.error("REFEREE ERROR: no Key");
                httpForbidden(res);
            }
        }
        else{
            console.error("REFEREE ERROR: game not started");
            httpForbidden(res);
        }
    });
    app.get("/api/master/:key/data",(req,res)=>{
        if(runningConfig.started){
            if(req.params.key){
                if(runningConfig.gameMaster.secret == req.params.key){
                    var toSend = {referees:[]};
                    async.each(runningConfig.referees,(ref,_next)=>{
                        toSend.referees.push({"id":ref.id,"actualGame":ref.actualGame,"secret":ref.secret});
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
                                if(comp.isFinished){
                                    toSend.competitions.push({"name":comp.getTurnierName,"finished":true,"additional":comp.getFcache});
                                }
                                else{
                                    toSend.competitions.push({"name":comp.getTurnierName,"games":comp.getGamesThisLayer,"teams":comp.getRemainingTeams,"layer":comp.getCurrentLayer});
                                    if(toSend.competitions[toSend.competitions.length-1].layer.layer==0)toSend.competitions[toSend.competitions.length-1].groups=comp.getGroups;
                                }
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

    app.get("/api/referee/:key/data",(req,res)=>{
        if(runningConfig.started){
            if(req.params.key){
                var ref = runningConfig.referees.find((r)=>{return r.secret == req.params.key;});
                if(ref){
                    var toSend = {id:ref.id,actualGame:ref.actualGame,socketSecret:ref.socketSecret};
                    res.status(200);
                    res.setHeader("Content-Type","application/json");
                    res.send(JSON.stringify(toSend));
                }
                else{
                    console.error("REFEREE API: wrong key");
                    httpForbidden(res);
                }
            }
            else{
                console.error("REFEREE API: no key");
                httpForbidden(res);
            }
        }
        else{
            console.error("REFEREE API: game not started");
            httpForbidden(res);
        }
    });

	app.get("/api/anzeige/data",
		function(req,res){
			if(runningConfig.started){
				var toSend={competitions:[],runningGames:[]};
				async.each(runningConfig.competitions,(comp,_next)=>{
                    if(comp.isFinished){
                        toSend.competitions.push({"name":comp.getTurnierName,"finished":true,"additional":comp.getFcache});
                    }
                    else{
                        toSend.competitions.push({"name":comp.getTurnierName,"games":comp.getGamesThisLayer,"teams":comp.getTeams,"layer":comp.getCurrentLayer});
					    if(toSend.competitions[toSend.competitions.length-1].layer.layer==0)toSend.competitions[toSend.competitions.length-1].groups=comp.getGroups;
                    }
					_next();
				},(err)=>{
					if(err){
						console.error(err);
						httpForbidden(res);
					}
					else{
                        runningConfig.referees.forEach((r)=>{
                            toSend.runningGames.push({id:r.id,currentGame:r.actualGame?getGameLayerAndId(r.actualGame):null});
                        });
						res.status(200);
						res.setHeader("Content-Type","application/json");
						res.send(JSON.stringify(toSend));
					}
				});
				}
				else{
					httpForbidden(res);
				}
		}
	);

    app.get("/reset",(req,res)=>{
        process.exit();
    });

    importDump((key)=>{
        if(key){
            console.log("Imported Dump Data...");
            console.log("MasterKey: "+key);
        }
    });
}

function getGameLayerAndId(game)
{
    var toR = null;
    runningConfig.competitions.forEach((c,ind)=>{
        //console.log("==",c.games);
        c.getGamesThisLayer.forEach((g,ind2)=>{
            //console.log("~#",ind,g,g.id,game.id);
            if(g.id==game.id){
                toR = {competitionIndex:ind,competitionId:c.id,gameIndex:ind2,gameId:g.id};
            }
        });
    });
    return toR;
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
            /*tref=runningConfig.referees.find((rf)=>{return rf.socketSecret==data.secret});
            console.log(tref);*/
            if(runningConfig.started&&data.type=="master"&&runningConfig.gameMaster.socket==null&&data.secret==runningConfig.gameMaster.socketSecret){
                runningConfig.gameMaster.socket=socket;
                console.log("GameMaster Auth Confirm");
                socket.emit("authConfirm",JSON.stringify({"status":"OK"}));
            }
            else if(runningConfig.started&&data.type=="referee"&&(tref=runningConfig.referees.find((rf)=>{return rf.socketSecret==data.secret}))){
                tref.socket = socket;
                socket.emit("authConfirm",JSON.stringify({"status":"OK"}));
            }
			else if(runningConfig.started && data.type=="anzeige"){
				runningConfig.anzeigen.push({socket:socket});
				socket.emit("authConfirm",JSON.stringify({status:"OK"}));
				
			}
            else{
                console.error("Socket Auth Error:");
                console.error(runningConfig.started,data.type,data.secret,"==",runningConfig.gameMaster.socketSecret);
                socket.emit("authConfirm",JSON.stringify({"status":"ERROR"}));
            }
        });

        socket.on("pickNewGame",(msg)=>{
            if(!checkIfPermission(socket.id))return;
            var data = JSON.tryParse(msg);
            if(data.type=="master"){

                if(runningConfig.referees[data.referee]&&runningConfig.referees[data.referee].actualGame==null){
                    var remG = runningConfig.competitions[data.competition].getRandomRemainingGame;
                    if(remG){
                        remG.competition=data.competition;
                        runningConfig.referees[data.referee].actualGame=remG;
                        if(runningConfig.referees[data.referee].socket){
                            runningConfig.referees[data.referee].socket.emit("gameSet",JSON.stringify({"game":runningConfig.referees[data.referee].actualGame,"referee":runningConfig.referees.indexOf(runningConfig.referees[data.referee]),"status":"OK"}));
                        }
                        if(runningConfig.gameMaster.socket){
                            runningConfig.gameMaster.socket.emit("gameSet",JSON.stringify({"game":remG.id,"referee":runningConfig.referees.indexOf(runningConfig.referees[data.referee]),"status":"OK"}));
                        }
                    }
                }

            } 
            else if(data.type=="referee"){
                var mer = runningConfig.referees.find((r)=>{return r.socket&&r.socket.id==socket.id;});
                if(mer.actualGame==null){
                    var rndC = randomIntFromInterval(0,runningConfig.competitions.length-1);
                    var remG = runningConfig.competitions[rndC].getRandomRemainingGame;
                    if(remG){
                        remG.competition=rndC;
                        mer.actualGame=remG;
                        if(mer.socket){
                            mer.socket.emit("gameSet",JSON.stringify({"game":mer.actualGame,"referee":runningConfig.referees.indexOf(mer),"status":"OK"}));
                        }
                        if(runningConfig.gameMaster.socket){
                            runningConfig.gameMaster.socket.emit("gameSet",JSON.stringify({"game":remG.id,"referee":runningConfig.referees.indexOf(mer),"status":"OK"}));
                        }
                    }
                    else{
                        mer.socket.emit("gameSet",JSON.stringify({"status":"NOLEFT"}));
                    }
                }
            }
        });

        socket.on("startRefereeGame",(msg)=>{
            var data = JSON.tryParse(msg);
            if(!checkIfPermission(socket.id))return;
            if(data.type=="master"){
                var rf = runningConfig.referees[data.referee];
                var bv = Object.assign({},rf.actualGame);
                runningConfig.competitions[rf.actualGame.competition].startGame(rf.actualGame.id);
                rf.actualGame = runningConfig.competitions[rf.actualGame.competition].getGamesThisLayer.find((g)=>{return g.id==bv.id});
                
                rf.actualGame.competition=bv.competition;
                var mer = runningConfig.referees[data.referee];
                if(mer.socket){
                    mer.socket.emit("gameStart",JSON.stringify({"game":rf.actualGame,"status":"OK"}));
                }
                if(runningConfig.gameMaster.socket){
                    runningConfig.gameMaster.socket.emit("gameStart",JSON.stringify({"game":rf.actualGame,"status":"OK"}));
                }
            }
            else if(data.type=="referee"){
                var rf = runningConfig.referees.find((r)=>{return r.socket.id==socket.id});
                var bv = Object.assign({},rf.actualGame);
                console.log(rf);
                runningConfig.competitions[rf.actualGame.competition].startGame(rf.actualGame.id);
                rf.actualGame = runningConfig.competitions[rf.actualGame.competition].getGamesThisLayer.find((g)=>{return g.id==bv.id});
                console.log(rf.actualGame);
                rf.actualGame.competition=bv.competition;
                var mer = rf;
                if(mer.socket){
                    mer.socket.emit("gameStart",JSON.stringify({"game":rf.actualGame,"status":"OK"}));
                }
                if(runningConfig.gameMaster.socket){
                    runningConfig.gameMaster.socket.emit("gameStart",JSON.stringify({"game":rf.actualGame,"status":"OK"}));
                }
            }
            runningConfig.anzeigen.forEach((a)=>{
                if(a.socket)a.socket.emit("gameSet",JSON.stringify({"game":rf.actualGame,"status":"OK"}));
            });
        });

        socket.on("addPoint",(msg)=>{
            var data = JSON.tryParse(msg);
            console.log(data);
            if(!checkIfPermission(socket.id))return;
            runningConfig.competitions[data.competition].gamePoint(data.id,data.team);
            runningConfig.referees.forEach((rf)=>{if(rf.socket&&rf.actualGame&&rf.actualGame.id==data.id)rf.socket.emit("addPoint",JSON.stringify({game:data.id,team:data.team}));});
            if(runningConfig.gameMaster.socket)
                runningConfig.gameMaster.socket.emit("addPoint",JSON.stringify({competition:data.competition,game:data.id,team:data.team,referee:runningConfig.referees.indexOf(runningConfig.referees.find((r)=>{return r.actualGame&&r.actualGame.id==data.id;}))}));
			runningConfig.anzeigen.forEach(function(anz){
				if(anz.socket != null){
					anz.socket.emit("addPoint",JSON.stringify({game:data.id,team:data.team,competition:data.competition}));
				}
			});
		});
		
		socket.on("remPoint",(msg)=>{
            var data = JSON.tryParse(msg);
            console.log(data);
            if(!checkIfPermission(socket.id))return;
            runningConfig.competitions[data.competition].gameRemovePoint(data.id,data.team);
            runningConfig.referees.forEach((rf)=>{if(rf.socket&&rf.actualGame&&rf.actualGame.id==data.id)rf.socket.emit("remPoint",JSON.stringify({game:data.id,team:data.team}));});
            if(runningConfig.gameMaster.socket)
                runningConfig.gameMaster.socket.emit("remPoint",JSON.stringify({competition:data.competition,game:data.id,team:data.team,referee:runningConfig.referees.indexOf(runningConfig.referees.find((r)=>{return r.actualGame&&r.actualGame.id==data.id;}))}));
        
			runningConfig.anzeigen.forEach(function(anz){
				if(anz.socket != null){
					anz.socket.emit("remPoint",JSON.stringify({game:data.id,team:data.team,competition:data.competition}));
				}
			});
		});

        socket.on("endGame",(msg)=>{
            var data = JSON.tryParse(msg);
            console.log(data);
            if(!checkIfPermission(socket.id))return;            
            if(runningConfig.competitions[data.competition]){
                var game = runningConfig.competitions[data.competition].getGamesThisLayer.find((g)=>{return g.id == data.game});
                if(game){
                    game.finished=true;
                    if(runningConfig.gameMaster.socket)runningConfig.gameMaster.socket.emit("endGameDone",JSON.stringify({competition:data.competition,game:data.game,status:"OK"}));
                    runningConfig.referees.forEach((r)=>{
                        if(r.socket&&r.actualGame&&r.actualGame.id==game.id)
                            r.socket.emit("endGameDone",JSON.stringify({competition:data.competition,game:data.game,status:"OK"}));
                    });
                    runningConfig.anzeigen.forEach((r)=>{
                        if(r.socket)
                            r.socket.emit("endGameDone",JSON.stringify({competition:data.competition,game:data.game,status:"OK"}));
                    });
                    //socket.emit("endGameDone",JSON.stringify({competition:data.competition,game:data.game,status:"OK"}));
                    runningConfig.referees.forEach((r)=>{if(r.actualGame&&r.actualGame.id==data.game)r.actualGame=null;});
                }
            }
            else{
                socket.emit("endGameDone",JSON.stringify({status:"ERROR"}));
            }
        });

        socket.on("endRound",(msg)=>{
            if(!checkIfPermission(socket.id))return;
            var data = JSON.tryParse(msg);
            if(runningConfig.competitions[data.competition]){
                var ret = runningConfig.competitions[data.competition].finishLayer();
                if(ret.competitionEnd){
                    runningConfig.competitions[data.competition].tournierFinished(ret);
                    socket.emit("competitionEnded",JSON.stringify({"competition":data.competition,"additional":runningConfig.competitions[data.competition].getFcache}));
                    runningConfig.anzeigen.forEach((a)=>{if(a.socket)a.socket.emit("competitionEnded",JSON.stringify({"competition":data.competition,"addition":runningConfig.competitions[data.competition].getFcache}));});
                }
                else{
                    socket.emit("competitionLayerConfirm",JSON.stringify({status:"OK"}));
                    runningConfig.referees.forEach((r)=>{r.actualGame=null;});
                    runningConfig.anzeigen.forEach((a)=>{if(a.socket)a.socket.emit("competitionLayerConfirm",JSON.stringify({status:"OK"}));});
                }
            }
            else{
                socket.emit("competitionLayerConfirm",JSON.stringify({status:"ERROR"}));
            }
        });

        socket.on("disconnect",()=>{
            //console.log("disconnect");
            if(!runningConfig.gameMaster)return;
            if(runningConfig.gameMaster.socket)runningConfig.gameMaster.socket.id==socket.id?runningConfig.gameMaster.socket=null:false;
            var ref = runningConfig.referees.find((rf)=>{return rf.socket&&rf.socket.id==socket.id;});
            if(ref)ref.socket=null;
			var anzt = runningConfig.anzeigen.find(function(anz){return anz.socket.id==socket.id});
			if(anzt)runningConfig.anzeigen.splice(runningConfig.anzeigen.indexOf(anzt),1);
        });
    });
}

function checkIfPermission(socketId)
{
    if(runningConfig.gameMaster&&runningConfig.gameMaster.socket&&runningConfig.gameMaster.socket.id==socketId||
    runningConfig.referees&&runningConfig.referees.find((r)=>{return r.socket && r.socket.id==socketId;})){
        return true;
    }
    else{
        return false;
    }
}

function randomIntFromInterval(min,max)
{
    return Math.floor(Math.random()*(max-min+1)+min);
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