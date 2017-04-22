var app = angular.module("refereeApp",[]);

app.controller("mainCtrl",function($scope,$http){
    $scope.key = "";
    $scope.config = {};

    $scope.onload = function()
    {
        var regexP = /<!--#(\w+)#-->/g;
        $scope.key = regexP.exec(document.documentElement.outerHTML)[1];

        $http({method:"GET",url:"/api/referee/"+$scope.key+"/data"}).then(function(res){
            $scope.config = res.data;
            $scope.initSocket(res.data.socketSecret);
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
            }
            else{
                alert("Konnte nicht Authentifizieren!\nDieser Versuch wird gemeldet!");
            }
        });

        $scope.socket.on("gameSet",function(msg){
            var data = JSON.tryParse(msg);
            if(data.status=="OK"){
                $scope.config.actualGame = data.game;
            }
            else if(data.status == "NOLEFT"){
                alert("Keine Spiele der aktuellen Ebene verbleibend!");
            }
        });

        $scope.socket.on("gameStart",function(msg){
            var data = JSON.tryParse(msg);
            if(data.status=="OK"){
                $scope.config.actualGame=data.game;
            }
        });

        $scope.socket.on("addPoint",function(msg){
            var data = JSON.tryParse(msg);
            if(data){
                console.log(data);
                $scope.config.actualGame.Points[data.team]++;
                //if($scope.config.competitions[data.competition].layer.layer==0)$scope.config.competitions[data.competition].groups.find(function(g){console.log(g);return g.games.find(function(ga){if(ga.id==data.game){ga.Points[data.team]++;return true;}else return false;});});
            }
        });
		
		$scope.socket.on("remPoint",function(msg){
            var data = JSON.tryParse(msg);
            if(data){
                console.log(data);
                $scope.config.actualGame.Points[data.team]--;
                //if($scope.config.competitions[data.competition].layer.layer==0)$scope.config.competitions[data.competition].groups.find(function(g){console.log(g);return g.games.find(function(ga){if(ga.id==data.game){ga.Points[data.team]++;return true;}else return false;});});
            }
        });

        $scope.socket.on("endGameDone",(msg)=>{
            var data = JSON.tryParse(msg);
            if(data){
                $scope.config.actualGame=null;
                if(!$scope.$$phase)$scope.$apply();
            }
        });

        $scope.socket.emit("auth",JSON.stringify({
            "type":"referee",
            "secret":ss
        }));
    };

    $scope.stopGame = function(ref)
    {
        $scope.socket.emit("endGame",JSON.stringify({competition:$scope.config.actualGame.competition,game:$scope.config.actualGame.id}));
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
        $scope.socket.emit("pickNewGame",JSON.stringify({type:"referee","meId":$scope.config.id}));
    };

    $scope.startRefereeGame = function()
    {
        $scope.socket.emit("startRefereeGame",JSON.stringify({type:"referee","referee":$scope.config.id}));
    };

    //PUNKTE ETC
    $scope.addPointT1= function(){
        var game = $scope.config.actualGame;
        $scope.socket.emit("addPoint",JSON.stringify({competition:$scope.config.actualGame.competition,id:game.id,team:0}));
    };
    $scope.addPointT2= function(){
        var game = $scope.config.actualGame;
        $scope.socket.emit("addPoint",JSON.stringify({competition:$scope.config.actualGame.competition,id:game.id,team:1}));
    };
	
	$scope.remPointT1= function(){
        var game = $scope.config.actualGame;
        $scope.socket.emit("remPoint",JSON.stringify({competition:$scope.config.actualGame.competition,id:game.id,team:0}));
    };
    $scope.remPointT2= function(){
        var game = $scope.config.actualGame;
        $scope.socket.emit("remPoint",JSON.stringify({competition:$scope.config.actualGame.competition,id:game.id,team:1}));
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
        alert("FATALER PARSE ERROR!\n"+ex);
        return {};
    }
};