var app = angular.module("initApp",[]);

app.controller("mainCtrl",function($scope,$http){
    

    $scope.competitions = [{
        "teams":[

        ],
        "name":"{UNKNOWN}",
        "levels":[
            {
                name:"Vorrunde",
                type:"VR",
                teamGroupAmount:2,
                teamWinnerAmount:1
            }
        ],
        "disabled":false
    }];
    $scope.activeTab=$scope.competitions[0];
    $scope.newTeam = "";

    $scope.config = {
        competitionAmount: 1,
        placesAmount:3
    };

    $scope.rawTabsConfig = {
        "teams":[

        ],
        "name":"{UNKNOWN}",
        "levels":[
            {
                name:"Vorrunde",
                type:"VR",
                teamGroupAmount:2,
                teamWinnerAmount:1
            }
        ],
        "disabled":false
    };
    $scope.changeTArr = function()
    {
        if($scope.competitions.length<$scope.config.competitionAmount){
            for(var i=$scope.competitions.length; i<$scope.config.competitionAmount;i++)$scope.competitions.push(Object.assign({},$scope.rawTabsConfig));
        }
        else if($scope.competitions.length>$scope.config.competitionAmount){
            for(var i=$scope.competitions.length; i>$scope.config.competitionAmount;i--)$scope.competitions.pop();
        }
        
    };

    $scope.setActiveTab = function(tb){
        $scope.activeTab=tb;
    };

    $scope.addTeam = function()
    {
        $scope.activeTab.teams.push({name:$scope.newTeam});
        $scope.newTeam="";
    };
    $scope.delTeam = function(t)
    {
        $scope.activeTab.teams.splice($scope.activeTab.teams.indexOf(t),1);
    };
    $scope.submitConfig = function()
    {   
        $http({method:"POST",url:"/api/init", data:JSON.stringify({"places":$scope.config.placesAmount,"competitions":$scope.competitions})}).then(function(data){
            console.log(data.data);
            //console.log();
            window.location.pathname=data.data;

        },function(err){
            alert("FATAL ERROR! Can't start Game!\n"+JSON.stringify(err,null,2));
        });

    };

});