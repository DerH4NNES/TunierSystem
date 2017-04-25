var app = angular.module("anzeigeApp",[]);

app.controller("mainCtrl",function($scope,$http){
    //$scope.config = {};
    $scope.activeGameTab={};
    $scope.activeCompetitionsTab={};
	$scope.competitions = [];
	$scope.runningGames = [];

    /*$scope.initSocket = function(ss)
    {
        $scope.socket = io();
		$scope.socket.emit("auth",JSON.stringify({"type":"anzeige"}));
		//$scope.authTimeout = setTimeout(($scope.wiedumoechtest).bind(this),5000);
		$scope.socket.on("authConfirm",function(msg){
			var data = JSON.tryParse(msg);
			if(data.status == "OK"){
				//FERTIG
				
			}
			else{
				console.error("konnte nicht authentifizieren '"+msg+"'");
				//AUTH Fehler
			
			}
		});
		$scope.socket.on("disconnect",function(){
			console.log("Client disconnected");
		});
    };
	*/

    $scope.onload = function()
    {
        $http({method:"GET",url:"/api/anzeige/data"}).then(function(res){
            $scope.config = res.data;
            $scope.competitions=res.data.competitions;
            $scope.runningGames = res.data.runningGames;
            $scope.activeGameTab=$scope.runningGames[0];
            $scope.activeCompetitionsTab=$scope.competitions[0];
            //console.log($scope.activeCompetitionsTab.groups);
            $scope.initSocket();
        },function(err){
            alert("Fataler Fehler beim abrufen der Daten!\n"+err);
        });
    };

    $scope.getRGame = function(agt)
    {   console.log(agt.currentGame);
        return agt.currentGame?
            $scope.competitions[agt.currentGame.competitionIndex].games.find(function(g){return g.id==agt.currentGame.gameId;})
            :null;
    };

    $scope.initSocket = function()
    {
        $scope.socket = io();

        $scope.socket.on("authConfirm",function(msg){
            var data = JSON.tryParse(msg);
            if(data.status=="OK"){
                console.log("Auth Confirmed. Socket active");
            }
            else{
                console.log("Socket Auth Error. Using Auto-Refresh...");
                setTimeout(function(){location.reload();},10000);
            }
        });
        $scope.socket.on("competitionLayerConfirm",function(msg){
            var data = JSON.tryParse(msg);
            if(data.status=="OK"){
                console.log("Layer Ended");
                location.reload();
            }
            else{
                console.error("FATAL ERROR SERVERSIDE. IGNORING");
            }
        });

        $scope.socket.on("gameSet",function(msg){
            var data = JSON.tryParse(msg);
            if(data.status=="OK")location.reload();
        });

        $scope.socket.on("addPoint",function(msg){
            var data = JSON.tryParse(msg);
            if(data){
                console.log(data);
                //$scope.config.referees[data.referee].actualGame.Points[data.team]++;
                $scope.competitions[data.competition].games.find(function(g){return g.id==data.game}).Points[data.team]++;
                //if($scope.config.competitions[data.competition].layer.layer==0)$scope.config.competitions[data.competition].groups.find(function(g){console.log(g);return g.games.find(function(ga){if(ga.id==data.game){ga.Points[data.team]++;return true;}else return false;});});
                if(!$scope.$$phase)$scope.$apply();
            }
        });
        
        $scope.socket.on("remPoint",function(msg){
            var data = JSON.tryParse(msg);
            if(data){
                console.log(data);
                //$scope.config.referees[data.referee].actualGame.Points[data.team]--;
                $scope.competitions[data.competition].games.find(function(g){return g.id==data.game}).Points[data.team]--;
                //if($scope.config.competitions[data.competition].layer.layer==0)$scope.config.competitions[data.competition].groups.find(function(g){console.log(g);return g.games.find(function(ga){if(ga.id==data.game){ga.Points[data.team]++;return true;}else return false;});});
                if(!$scope.$$phase)$scope.$apply();
            }
        });

        $scope.socket.on("competitionEnded",(msg)=>{
            var data = JSON.tryParse(msg);
            if(data){
                $scope.competitions[data.competition].finished=true;
                $scope.competitions[data.competition].additional=data.additional;
                if(!$scope.$$phase)$scope.$apply();
            }
        });

        $scope.socket.on("endGameDone",function(msg){
            location.reload();
        });

        $scope.socket.emit("auth",JSON.stringify({
            "type":"anzeige"
        }));
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
        $scope.activeGameTab = t;
    };
    $scope.setActiveTab2 = function(t)
    {
        $scope.activeCompetitionsTab = t;
    };

    $scope.gamesToPlayLeft = function()
    {
        if($scope.activeCompetitionsTab.games)return $scope.activeCompetitionsTab.games.find(function(g){return g.finished==false;});
    };

    $scope.getTimestampDisplay = function(ts){
        var dur = moment.duration(moment().diff(moment(ts)));
        return dur.minutes()+":"+dur.seconds();
    };

    $scope.gameStateFilter = function(state){
        return function(item){
            return state=="inprog"&&item.started==false&&item.finished==false||state=="queued"&&item.started==true&&item.finished==false;
        };
    };

    //Start Controller
    $scope.onload();
    setInterval(function(){if(!$scope.$$phase)$scope.$apply();},1000);

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