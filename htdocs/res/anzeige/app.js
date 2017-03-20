var app = angular.module("anzeigeAPP",[]);

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
		$scope.socket.emit("auth",JSON.stringify({"type":"anzeige"});
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