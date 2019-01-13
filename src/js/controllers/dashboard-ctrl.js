angular.module('RDash')
	.controller('DashboardCtrl', ['$scope', '$rootScope', '$window', '$http', '$q', '$interval', 'leafletData', 'FileSaver', DashboardCtrl]);

function DashboardCtrl($scope, $rootScope, $window, $http, $q, leafletData, FileSaver) {
    $scope.virtualMachines = [];
    $scope.failMessage = "";

    $scope.vmImages = ["centos-7-v20181210",
        "debian-9-stretch-v20181210",
        "ubuntu-1604-xenial-v20190112",
        "windows-server-2019-dc-v20190108",
        "sql-2017-web-windows-2016-dc-v20190108"];
    $scope.zones = ['us-central1-a', 'us-central1-b', 'us-central1-c', 'us-central1-f'];


    $scope.getVMs = function() {
        $http({method: 'GET', url: 'http://localhost:8081/api/vm/all'}).
        then(function(response) {
            $scope.virtualMachines = response.data;
        });

    }
    $scope.getVMs();


    $scope.addVM = function(image) {

        var index = $scope.vmImages.indexOf(inputImage);
;
        var newVM = {
            vmName : $scope.inputVMName,
            zone : $scope.inputZone,
            image : $scope.inputImage
        };

        if (vmName == null || vmName == ""
            || zone == null || zone == ""
            || image == null || image == ""
        ) {
            window.alert("Va rugam completati toate campurile!")
            return;
        }

        $http({method: 'POST', data: newVM, url: 'http://localhost:8081/api/vm/add'}).
        then(function(response) {
            if (response.status == 200) {
                $scope.failMessage = "";
                $scope.getVMs();
                $scope.inputVMName = "";
                $scope.inputZone = "";
                $scope.inputImage = "";
            } else if(response.status == 500) {
                $scope.failMessage = response.data;
                window.alert($scope.failMessage);
                window.alert("Error!")
            }
        });

        $scope.getVMs();
    }

    $scope.deleteVM = function(vmName, zone) {
        $http({method: 'DELETE', url: 'http://localhost:8081/api/vm/delete?vmName=' + vmName + '&zone=' + zone}).
        then(function(response) {
            $scope.getVMs();
            $scope.polling();
        });

    }

    $scope.stopVM = function(vmName, zone) {
        $http({method: 'GET', url: 'http://localhost:8081/api/vm/stop?vmName=' + vmName + '&zone=' + zone}).
        then(function(response) {
            $scope.getVMs();
            $scope.polling();
        });
    }

    $scope.resetVM = function(vmName, zone) {
        $http({method: 'GET', url: 'http://localhost:8081/api/vm/reset?vmName=' + vmName + '&zone=' + zone}).
        then(function(response) {
            $scope.getVMs();
            $scope.polling();
        });
    }

    $scope.startVM = function(vmName, zone) {
        $http({method: 'GET', url: 'http://localhost:8081/api/vm/start?vmName=' + vmName + '&zone=' + zone}).
        then(function(response) {
            $scope.getVMs();
            $scope.polling();
        });
    }

    $scope.getVM = function(vmName, zone) {
        $http({method: 'GET', url: 'http://localhost:8081/api/vm/get?vmName=' + vmName + '&zone=' + zone}).
        then(function(response) {
            return response.data
        });
    }

    $scope.getVM();

    $scope.polling = function() {
        $interval(function() {
            alert("test");
            if (state !== scope.getVM().status) {
                $scope.getVMs();
                $interval.cancel($interval);
            }
        }, 1000);
    }
}
