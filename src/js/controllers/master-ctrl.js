/**
 * Master Controller
 */

angular.module('RDash')
    .controller('MasterCtrl', ['$scope', '$cookieStore', '$rootScope', '$http', '$state', 'AuthService', 'AUTH', MasterCtrl]);

function MasterCtrl($scope, $cookieStore, $rootScope, $http, $state, AuthService, AUTH) {
    /**
     * Sidebar Toggle & Cookie Control
     */
    var mobileView = 992;

    $scope.getWidth = function() {
        return window.innerWidth;
    };

    $scope.$watch($scope.getWidth, function(newValue, oldValue) {
        if (newValue >= mobileView) {
            if (angular.isDefined($cookieStore.get('toggle'))) {
                $scope.toggle = ! $cookieStore.get('toggle') ? false : true;
            } else {
                $scope.toggle = true;
            }
        } else {
            $scope.toggle = false;
        }

    });

    $scope.toggleSidebar = function() {
        $scope.toggle = !$scope.toggle;
        $cookieStore.put('toggle', $scope.toggle);
    };

    window.onresize = function() {
        $scope.$apply();
    };

    $scope.logout = function(){
        AuthService.logout();
        $rootScope.memberinfo = undefined;
        $state.go('login');
    };

    $scope.$on(AUTH.notAuthenticated, function(event){
        AuthService.logout();
        $state.go('login');
    });

    $scope.$on(AUTH.authenticated, function(){
        $http.get('http://localhost:8081/api/memberinfo').then(function(result){
            if(result.data.success){
                $rootScope.memberinfo = angular.fromJson(result.data.msg);
                console.log("memberinfo  " + $rootScope.memberinfo);
            }
        });
    });

    $scope.isLogged = function(){
        if (AuthService.isAuthenticated()){
            $http.get('http://localhost:8081/api/memberinfo').then(function(result){
                if(result.data.success){
                    $rootScope.memberinfo = angular.fromJson(result.data.msg);
                    console.log("memberinfo  " + $rootScope.memberinfo);
                }
            });
        }
    };
    $scope.isLogged();

    $scope.pageName = "";
    $rootScope.$on('$stateChangeStart', function (event, next) {
        if(next.name === 'index') {
            $scope.pageName = "GCloud Console";
        }  else if(next.name === 'users') {
            $scope.pageName = "GCloud Console";
        } else {
            $scope.pageName = "";
        }
    });
}