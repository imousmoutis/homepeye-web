angular.module('home-peye', ['ionic'])

.run(function($ionicPlatform) {
  $ionicPlatform.ready(function() {
    if(window.cordova && window.cordova.plugins.Keyboard) {
      // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
      // for form inputs)
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);

      // Don't remove this line unless you know what you are doing. It stops the viewport
      // from snapping when text inputs are focused. Ionic handles this internally for
      // a much nicer keyboard experience.
      cordova.plugins.Keyboard.disableScroll(true);
    }
    if(window.StatusBar) {
      StatusBar.styleDefault();
    }
  });
}).controller('HomeController', function($scope, $timeout) {

  $scope.mqtt_connected = false;
  $scope.system_on = false;
  $scope.breach_alert = false;

  var message;
  var client = new Paho.MQTT.Client('ws://iot.eclipse.org/ws', 'home-peye_client+'+new Date().getMilliseconds());

  // set callback handlers
  client.onConnectionLost = onConnectionLost;
  client.onMessageArrived = onMessageArrived;

  // connect the client
  client.connect({onSuccess:onConnect});

  // called when the client connects
  function onConnect() {
    
    client.subscribe('/home-peye/client/#');

    $scope.mqtt_connected = true;
    $scope.$apply();

    message = new Paho.MQTT.Message("");
    message.destinationName = "/home-peye/server/status/id/";
    client.send(message);
  }

  // called when the client loses its connection
  function onConnectionLost(responseObject) {
    if (responseObject.errorCode !== 0) {
      console.log("onConnectionLost:"+responseObject.errorMessage);
    }
  }

  // called when a message arrives
  function onMessageArrived(message) {
    console.log("message");

    if(message.destinationName === '/home-peye/client/status/id/'){

      if (message.payloadString === 'true')
        $scope.system_on = true;
      else
        $scope.system_on = false;

    }else if (message.destinationName === '/home-peye/client/breach/'){

      $scope.image_received = 'data:image/png;base64,' +message.payloadString; 

      message = new Paho.MQTT.Message("");
      message.destinationName = "/home-peye/server/breach/";
      client.send(message);

      $scope.breach_alert = true;
      $scope.system_on = false;
    }else if (message.destinationName === '/home-peye/client/stream/')
      $timeout(function() {
          $scope.liveStreamingOn = true;
      }, 1000);;

      $scope.$apply();
  };

  $scope.changeSystem = function (status){
    
    message = new Paho.MQTT.Message(""+status);
    message.destinationName = "/home-peye/server/status/";
    client.send(message);
  };

  $scope.soundOff = function(){
    
    message = new Paho.MQTT.Message("");
    message.destinationName = "/home-peye/server/sound/";
    client.send(message);
  };

   $scope.stream = function(option){

    $scope.liveStreamingOn = false;

    message = new Paho.MQTT.Message(""+option);
    message.destinationName = "/home-peye/server/stream/";
    client.send(message);
  };


})
