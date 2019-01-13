angular.module('RDash')
    .controller('UsersCtrl', ['$scope', '$rootScope', '$http', '$window', UsersCtrl]);

function UsersCtrl($scope, $rootScope, $http, $window) {

    console.log($rootScope.memberinfo);

    $scope.failMessage = "";
    $scope.users = [];
    $scope.roles = ["admin", "partial", "read"];
    $scope.role = $scope.roles[0];

    $scope.getUsers = function() {
        $http({method: 'GET', url: 'http://localhost:8081/api/user/all'}).
        then(function(response) {
            $scope.users = response.data;
        });

    }
    $scope.getUsers();

    $scope.addUser = function() {
        var newUser = {
            username : $scope.username,
            password : $scope.password,
            role : $scope.role
        };
        console.log("adding " + newUser.username + " " + newUser.password + " " + newUser.role);

        if (newUser.username == null || newUser.username == ""
            || newUser.password == null || newUser.password == ""
            || newUser.role == null || newUser.role == ""
        ) {
            window.alert("Va rugam completati toate campurile!")
            return;
        }

        $http({method: 'POST', data: newUser, url: 'http://localhost:8081/api/user/add'}).
        then(function(response) {
            if (response.status == 200) {
                $scope.failMessage = "";
                $scope.getUsers();
                $scope.username = "";
                $scope.password = "";
                $scope.role = "";
            } else if(response.status == 500) {
                $scope.failMessage = response.message;
                window.alert($scope.failMessage);
                $window.alert("Utilizatorul nu a putut fi adaugat");
            }
        });
    }

    $scope.deleteUser = function(id) {
        $http({method: 'DELETE', url: 'http://localhost:8081/api/user/delete?id='+id}).
        then(function(response) {
            $scope.getUsers();
        });
    }
}
