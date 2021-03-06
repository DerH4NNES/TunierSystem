var app = angular.module("masterApp",[]);

app.controller("mainCtrl",function($scope,$http){
    $scope.key = "";
    $scope.config = {};
    $scope.activeRefereeTab={};
    $scope.activeCompetitionsTab={};

    $scope.onload = function()
    {
        var regexP = /<!--#(\w+)#-->/g;
        $scope.key = regexP.exec(document.documentElement.outerHTML)[1];

        $http({method:"GET",url:"/api/master/"+$scope.key+"/data"}).then(function(res){
            $scope.config = res.data;
            $scope.initSocket(res.data.socketSecret);
            $scope.activeRefereeTab=$scope.config.referees[0];
            $scope.activeCompetitionsTab=$scope.config.competitions[0];
        },function(err){
            alert("Fataler Fehler beim abrufen der Daten!\n"+err);
        });
    };

    $scope.initSocket = function(ss)
    {
        $scope.socket = io();

        $scope.socket.on("authConfirm",function(msg){
            var data = JSON.tryParse(msg);
            if(data.status=="OK"){
                console.log("Auth Confirmed. Socket active");
                new QRCode(document.getElementById("qrReferee"),$scope.combineRefUrl($scope.activeRefereeTab.secret));
            }
            else{
                alert("Konnte nicht Authentifizieren!\nDieser Versuch wird gemeldet!");
            }
        });
        $scope.socket.on("competitionLayerConfirm",function(msg){
            var data = JSON.tryParse(msg);
            if(data.status=="OK"){
                console.log("Layer Ended");
                location.reload();
            }
            else{
                alert("Konnte Ebene nicht beenden!");
            }
        });

        $scope.socket.on("gameStart",function(msg){
            var data = JSON.tryParse(msg);
            console.log(data);
            if(data.status=="OK"){
                $scope.config.competitions.forEach(function(c){
                    c.games.forEach(function(g){
                        if(g.id==data.game.id){
                            g.started=true;
                            g.timestamp=data.game.timestamp;
                        }
                    });
                });
                if(!$scope.$$phase)$scope.$apply();
            }
        });
        
        $scope.socket.on("gameSet",function(msg){
            var data = JSON.tryParse(msg);
            console.log(data);
            if(data.status=="OK"){
                //console.log("1");
                $scope.config.competitions.forEach(function(c,ind){
                    //console.log("comp");
                    c.games.forEach(function(g){
                        //console.log("game");
                        //console.log(g.id,data.game,data.game);
                        if(g.id==data.game){
                            //console.log("Game FOUND");
                            $scope.config.referees[data.referee].actualGame=g;
                            g.blocked=true;
                            g.competition=ind;
                        }
                    });
                });
                if(!$scope.$$phase)$scope.$apply();
            }
        });

        $scope.socket.on("addPoint",function(msg){
            var data = JSON.tryParse(msg);
            if(data){
                console.log(data);
                //$scope.config.referees[data.referee].actualGame.Points[data.team]++;
                $scope.config.competitions[data.competition].games.find(function(g){return g.id==data.game}).Points[data.team]++;
                //if($scope.config.competitions[data.competition].layer.layer==0)$scope.config.competitions[data.competition].groups.find(function(g){console.log(g);return g.games.find(function(ga){if(ga.id==data.game){ga.Points[data.team]++;return true;}else return false;});});
                if(!$scope.$$phase)$scope.$apply();
            }
        });
		
		$scope.socket.on("remPoint",function(msg){
            var data = JSON.tryParse(msg);
            if(data){
                console.log(data);
                //$scope.config.referees[data.referee].actualGame.Points[data.team]--;
                $scope.config.competitions[data.competition].games.find(function(g){return g.id==data.game}).Points[data.team]--;
                //if($scope.config.competitions[data.competition].layer.layer==0)$scope.config.competitions[data.competition].groups.find(function(g){console.log(g);return g.games.find(function(ga){if(ga.id==data.game){ga.Points[data.team]++;return true;}else return false;});});
                if(!$scope.$$phase)$scope.$apply();
             }
        });

        $scope.socket.on("endGameDone",(msg)=>{
            var data = JSON.tryParse(msg);
            if(data){
                $scope.config.referees.forEach(function(r){if(r.actualGame&&r.actualGame.id==data.game)r.actualGame=null;});
                $scope.config.competitions.forEach(function(c){
                    c.games.forEach(function(g){
                        if(g.id==data.game)g.finished=true;
                    });
                });
                //$scope.activeCompetitionsTab.games.forEach(function(g){if(g.id==data.game)g.finished=true;});
                if(!$scope.$$phase)$scope.$apply();
            }
        });

        $scope.socket.on("competitionEnded",(msg)=>{
            var data = JSON.tryParse(msg);
            if(data){
                $scope.config.competitions[data.competition].finished=true;
                $scope.config.competitions[data.competition].additional=data.additional;
                if(!$scope.$$phase)$scope.$apply();
            }
        });

        $scope.socket.emit("auth",JSON.stringify({
            "type":"master",
            "secret":ss
        }));
    };

    $scope.combineRefUrl = function(rs)
    {
        return "http://"+document.location.hostname+"/referee/"+rs;
    };

    $scope.getTeamGroup = function(tid)
    {
        if($scope.activeCompetitionsTab.layer.layer==0){
            return $scope.activeCompetitionsTab.groups.find(function(g){return g.teams.find(function(t){return t.id==tid;});});
        }
        else{
            return "";
        }
    };

    $scope.setActiveTab = function(t)
    {
        $scope.activeRefereeTab = t;
        document.getElementById("qrReferee").innerHTML ="";
        new QRCode(document.getElementById("qrReferee"),$scope.combineRefUrl($scope.activeRefereeTab.secret));
    };
    $scope.setActiveTab2 = function(t)
    {
        $scope.activeCompetitionsTab = t;
    };

    $scope.gamesToPlayLeft = function()
    {
        if($scope.activeCompetitionsTab.games)return $scope.activeCompetitionsTab.games.find(function(g){return g.finished==false;});
    };

    $scope.stopGame = function(ref)
    {
        $scope.socket.emit("endGame",JSON.stringify({competition:$scope.activeRefereeTab.actualGame.competition,game:$scope.activeRefereeTab.actualGame.id}));
    };

    $scope.endRound =function()
    {
        if(!$scope.gamesToPlayLeft()){
            console.log(JSON.stringify({competition:$scope.config.competitions.indexOf($scope.activeCompetitionsTab)}));
            $scope.socket.emit("endRound",JSON.stringify({competition:$scope.config.competitions.indexOf($scope.activeCompetitionsTab)}));
        }
    };

    $scope.getTimestampDisplay = function(ts){
        //var dur = moment.duration(moment().diff(moment(ts)));
        //console.log(dur);
        //return dur.minutes()+":"+dur.seconds();
        var ds = (Date.now()-parseInt(ts))/1000;
        var t1= Math.floor(ds/60);
        var t2 = Math.floor(ds%60);
        if(t1==0)t1="00";else if(t1<10)t1="0"+t1;
        if(t2==0)t2="00"; else if(t2<10)t2="0"+t2;
        return t1+":"+t2;
    };

    $scope.getNewGameForReferee = function()
    {   
        if($scope.gamesToPlayLeft())
            $scope.socket.emit("pickNewGame",JSON.stringify({type:"master","competition":Math.floor(Math.random()*$scope.config.competitions.length),"referee":$scope.config.referees.indexOf($scope.activeRefereeTab)}));
    };

    $scope.startRefereeGame = function()
    {
        $scope.socket.emit("startRefereeGame",JSON.stringify({type:"master","referee":$scope.config.referees.indexOf($scope.activeRefereeTab)}));
    };

    $scope.gameStateFilter = function(state){
        return function(item){
            return state=="inprog"&&item.started==false&&item.finished==false||state=="queued"&&item.started==true&&item.finished==false;
        };
    };

    //PUNKTE ETC
    $scope.addPointT1= function(){
        var game = $scope.activeRefereeTab.actualGame;
        $scope.socket.emit("addPoint",JSON.stringify({competition:$scope.activeRefereeTab.actualGame.competition,id:game.id,team:0}));
    };
    $scope.addPointT2= function(){
        var game = $scope.activeRefereeTab.actualGame;
        $scope.socket.emit("addPoint",JSON.stringify({competition:$scope.activeRefereeTab.actualGame.competition,id:game.id,team:1}));
    };
	
	$scope.remPointT1= function(){
        var game = $scope.activeRefereeTab.actualGame;
        $scope.socket.emit("remPoint",JSON.stringify({competition:$scope.activeRefereeTab.actualGame.competition,id:game.id,team:0}));
    };
    $scope.remPointT2= function(){
        var game = $scope.activeRefereeTab.actualGame;
        $scope.socket.emit("remPoint",JSON.stringify({competition:$scope.activeRefereeTab.actualGame.competition,id:game.id,team:1}));
    };

    //Start Controller
    $scope.onload();
    setInterval((function(){if(!$scope.$$phase)$scope.$apply();}).bind(this),1000);

});

JSON.tryParse = function(str){
    try{
        return JSON.parse(str);
    }
    catch(ex){
        //alert("FATALER PARSE ERROR!\n"+ex);
        return {};
    }
};