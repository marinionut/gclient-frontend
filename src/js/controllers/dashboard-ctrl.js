angular.module('RDash')
	.controller('DashboardCtrl', ['$scope', '$rootScope', '$window', '$http', '$q', '$interval', 'leafletData', 'FileSaver', DashboardCtrl]);

function DashboardCtrl($scope, $rootScope, $window, $http, $q, $interval, leafletData, FileSaver) {
    $scope.virtualMachines = [];
    $scope.failMessage = "";

    $scope.hideAdd = function () {
        if ($rootScope.memberinfo.role == "read")
            return true;
        if ($rootScope.memberinfo.role == "partial")
            return true;
        if ($rootScope.memberinfo.role == "admin")
            return false;
        if ($rootScope.memberinfo.role == "owner")
            return false;
        return false;
    };

    $scope.hideStart = function () {
        if ($rootScope.memberinfo.role == "read")
            return true;
        if ($rootScope.memberinfo.role == "partial")
            return false;
        if ($rootScope.memberinfo.role == "admin")
            return false;
        if ($rootScope.memberinfo.role == "owner")
            return false;
        return false;
    };

    $scope.hideStop = function () {
        if ($rootScope.memberinfo.role == "read")
            return true;
        if ($rootScope.memberinfo.role == "partial")
            return false;
        if ($rootScope.memberinfo.role == "admin")
            return false;
        if ($rootScope.memberinfo.role == "owner")
            return false;
        return false;
    };

    $scope.hideReset = function () {
        if ($rootScope.memberinfo.role == "read")
            return true;
        if ($rootScope.memberinfo.role == "partial")
            return false;
        if ($rootScope.memberinfo.role == "admin")
            return false;
        if ($rootScope.memberinfo.role == "owner")
            return false;
        return false;
    };

    $scope.hideDelete = function () {
        if ($rootScope.memberinfo.role == "read")
            return true;
        if ($rootScope.memberinfo.role == "partial")
            return true;
        if ($rootScope.memberinfo.role == "admin")
            return false;
        if ($rootScope.memberinfo.role == "owner")
            return false;
        return false;
    };


    $scope.hideAllActions = function() {
        if ($rootScope.memberinfo.role == "read")
            return true;
        return false;
    };

    $scope.vmImages = ["centos-7-v20181210",
        "debian-9-stretch-v20181210",
        "ubuntu-1604-xenial-v20190112",
        "windows-server-2019-dc-v20190108",
        "sql-2017-web-windows-2016-dc-v20190108"];
    $scope.zones = ['us-central1-a', 'us-central1-b', 'us-central1-c', 'us-central1-f'];
    $scope.inputImage = $scope.vmImages[0];
    $scope.inputZone = $scope.zones[0];

    $scope.getVMs = function () {
        $http({method: 'GET', url: 'http://localhost:8081/api/vm/all'}).then(function (response) {
            $scope.virtualMachines = response.data;
        });

    };
    $scope.getVMs();


    $scope.addVM = function () {

        var newVM = {
            vmName: $scope.inputVMName,
            zone: $scope.inputZone,
            image: $scope.inputImage
        };

        // alert(newVM.vmName + " " + newVM.zone + " " + newVM.image);
        if (newVM.vmName == null || newVM.vmName == ""
            || newVM.zone == null || newVM.zone == ""
            || newVM.image == null || newVM.image == "") {
            window.alert("Va rugam completati toate campurile!")
            return;
        }

        $http({method: 'POST', data: newVM, url: 'http://localhost:8081/api/vm/add'}).then(function (response) {
            if (response.status == 200) {
                $scope.getVMs();
                $scope.failMessage = "";
                $scope.getVMs();
                $scope.inputVMName = "";
                $scope.inputZone = "";
                $scope.inputImage = "";
            } else if (response.status == 500) {
                $scope.failMessage = response.data;
                window.alert($scope.failMessage);
                window.alert("Error!")
            }
        });

        $scope.getVMs();
    }

    $scope.deleteVM = function (vmName, zone, status) {
        $http({
            method: 'DELETE',
            url: 'http://localhost:8081/api/vm/delete?vmName=' + vmName + '&zone=' + zone
        }).then(function (response) {
            $scope.getVMs();
        });

    };

    $scope.stopVM = function (vmName, zone, status) {
        $http({
            method: 'GET',
            url: 'http://localhost:8081/api/vm/stop?vmName=' + vmName + '&zone=' + zone
        }).then(function (response) {
            $scope.getVMs();
        });
    };

    $scope.resetVM = function (vmName, zone, status) {
        $http({
            method: 'GET',
            url: 'http://localhost:8081/api/vm/reset?vmName=' + vmName + '&zone=' + zone
        }).then(function (response) {
            $scope.getVMs();
        });
    }

    $scope.startVM = function (vmName, zone, status) {
        $http({
            method: 'GET',
            url: 'http://localhost:8081/api/vm/start?vmName=' + vmName + '&zone=' + zone
        }).then(function (response) {
            $scope.getVMs();
        });
    }

    $scope.getVM = function (vmName, zone) {
        $http({
            method: 'GET',
            url: 'http://localhost:8081/api/vm/get?vmName=' + vmName + '&zone=' + zone
        }).then(function (response) {
            return response.data
        });
    };

    setInterval(function () {
        $scope.getVMs();
    }, 5000);
}
