var app = angular.module("anzeigeApp",[]);

app.controller("mainCtrl",function($scope,$http){
    $scope.key = "";
    $scope.config = {};
    $scope.activeRefereeTab={};
    $scope.activeCompetitionsTab={};
	$scope.competitions = [];
	$scope.wiedumoechtest = function(){
		$scope.socket.disconnect();
		console.error("Timout by Client");
	};
	$scope.init = function(){
		$http({url: "/api/anzeige/data","method":"get"}
		).than(function(response){
			$scope.competitions = response.data.competitions;
		},function(error){
			//error
			console.log("Marcel ist schuld!");
		});
	}
	
    $scope.initSocket = function(ss)
    {
        $scope.socket = io();
		$scope.socket.emit("auth",JSON.stringify({"type":"anzeige"}));
		$scope.authTimeout = setTimeout(($scope.wiedumoechtest).bind(this),5000);
		$scope.socket.on("authConfirm",function(msg){
			var data = JSON.tryParse(msg);
			if(data.status == "OK"){
				//FETTIG
				
			}
			else{
				console.error("konnte nicht authentifizieren '"+msg+"'");
				//FEHLA MELDUBG
			
			}
		});
		$scope.socket.on("disconnect",function(){
			console.log("Client disconnected");
		});
    };
	$scope.socket.on("addPoint",function(msg){
		var data = JSON.tryParse(msg);
		if(data){
			console.log(data);
			//$scope.config.referees[data.referee].actualGame.Points[data.team]++;
			$scope.competitions[data.competition].games.find(function(g){return g.id==data.game}).Points[data.team]++;
			//if($scope.config.competitions[data.competition].layer.layer==0)$scope.config.competitions[data.competition].groups.find(function(g){console.log(g);return g.games.find(function(ga){if(ga.id==data.game){ga.Points[data.team]++;return true;}else return false;});});
		}
	});
	
	$scope.socket.on("remPoint",function(msg){
		var data = JSON.tryParse(msg);
		if(data){
			console.log(data);
			//$scope.config.referees[data.referee].actualGame.Points[data.team]--;
			$scope.competitions[data.competition].games.find(function(g){return g.id==data.game}).Points[data.team]--;
			//if($scope.config.competitions[data.competition].layer.layer==0)$scope.config.competitions[data.competition].groups.find(function(g){console.log(g);return g.games.find(function(ga){if(ga.id==data.game){ga.Points[data.team]++;return true;}else return false;});});
		}
	});

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

        $scope.socket.on("gameSet",function(msg){
            var data = JSON.tryParse(msg);
            if(data.status=="OK")location.reload();
        });

        $scope.socket.emit("auth",JSON.stringify({
            "type":"master",
            "secret":ss
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
        $scope.activeRefereeTab = t;
    };
    $scope.setActiveTab2 = function(t)
    {
        $scope.activeCompetitionsTab = t;
    };

    $scope.gamesToPlayLeft = function()
    {
        if($scope.activeCompetitionsTab.games)return $scope.activeCompetitionsTab.games.find(function(g){return g.finished==false;});
    };

    $scope.endRound =function()
    {
        if(!$scope.gamesToPlayLeft()){
            console.log(JSON.stringify({competition:$scope.config.competitions.indexOf($scope.activeCompetitionsTab)}));
            $scope.socket.emit("endRound",JSON.stringify({competition:$scope.config.competitions.indexOf($scope.activeCompetitionsTab)}));
        }
    };

    $scope.getTimestampDisplay = function(ts){
        var dur = moment.duration(moment().diff(moment(ts)));
        return dur.minutes()+":"+dur.seconds();
    };

    $scope.getNewGameForReferee = function()
    {   
        if($scope.gamesToPlayLeft())
            $scope.socket.emit("pickNewGame",JSON.stringify({type:"master","competition":Math.floor(Math.random()*$scope.config.competitions.length),"referee":$scope.config.referees.indexOf($scope.activeRefereeTab)}));
    };

    $scope.startRefereeGame = function()
    {
        $scope.socket.emit("pickNewGame",JSON.stringify({type:"master","referee":$scope.config.referees.indexOf($scope.activeRefereeTab)}));
    };

    $scope.gameStateFilter = function(state){
        return function(item){
            return state=="inprog"&&item.started==false&&item.finished==false||state=="queued"&&item.started==true&&item.finished==false;
        };
    };

    //Start Controller
    $scope.onload();
    setTimeout(function(){if(!$scope.$$phase)$scope.$apply();},1000);

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