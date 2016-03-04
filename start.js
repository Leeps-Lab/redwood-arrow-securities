RedwoodArrowSecurities.controller("ASStartController",
	["$scope",
	 "RedwoodSubject",
	 "ConfigManager",
	 "SynchronizedStopWatch",
	 function ($scope, rs, configManager, SynchronizedStopWatch) {

		rs.on_load(function() {

			$scope.config = configManager.loadPerSubject(rs, {
				priceX				: 0.5,
				priceY				: 0.5,
				cash 				: 50,
				probX				: 0.5
			});

			$scope.price = {
				x: $scope.config.priceX,
				y: $scope.config.priceY
			}

			$scope.cash = $scope.config.cash;
			$scope.cashexhaustion = rs.config.cashexhaustion;

			$scope.probX = $scope.config.probX;
			$scope.probY = 1 - $scope.probX;

			$scope.rounds = $scope.config.rounds

	    rs.trigger("next_round");
	 	});



	 	rs.on("next_round", function() {

	 		$scope.inputsEnabled = false;

	 		if ($scope.rounds && $scope.round >= $scope.rounds) {
	 			rs.trigger("next_period");
	 			return;
	 		}

	 		// Begin next round
	 		$scope.round++;
	 		$scope.selection = undefined;

	 		$scope.x_selection = 0;
	 		$scope.y_selection = 0;
	 		$scope.x_cost = 0;
	 		$scope.y_cost = 0;

			rs.trigger("as.selection", [$scope.cash, $scope.cash]);

			$(".price-x").text($scope.price.x);
			$(".price-y").text($scope.price.y);
			$(".prob-x").text($scope.probX);
			$(".prob-y").text($scope.probY);

			$scope.durationInSeconds = rs.config.durationInSeconds;
			$scope.ticknum = 0;
			var timerUpdate = function() {
				$scope.ticknum++;
			};
    	$scope.timer = SynchronizedStopWatch.instance()
        .frequency(1).onTick(timerUpdate)
        .duration($scope.durationInSeconds).onComplete(function() {
          rs.trigger("next_round");
        }
			).start();

			$(".cashbar").progressbar({
				max: $scope.cash,
	 			value: $scope.cash
	 		});
			$(".ui-progressbar-value.ui-widget-header.ui-corner-left").css("background", "green");

	 		$(".asset-x").slider({
	 			range: "min",
	 			min: 0,
	 			max: $scope.cash * (1 / $scope.price.x),
	 			value: 0,
	 			orientation: "vertical",
	 			width: 30,
	 			height: 300
	 		});

	 		$(".asset-y").slider({
	 			range: "min",
	 			min: 0,
	 			max: $scope.cash * (1 / $scope.price.y),
	 			value: 0,
	 			orientation: "vertical",
	 			width: 30,
	 			height: 300
	 		});

	 	});

		rs.on("as.selection", function(selection) {
			$scope.selection = selection;
		});

		$scope.submitvalues = function() {
			console.log("submit");
		};
		$scope.disablebutton = function() {
			$("#submitbutton").attr("disabled", "disabled");
		};
		$scope.enablebutton = function() {
			$("#submitbutton").removeAttr("disabled");
		};
		$scope.togglebutton = function() {
			console.log("cash: " + $scope.cash);
			console.log("x : " + $scope.x_cost + ", y : " + $scope.y_cost);
			console.log("cash remaining : " + $scope.cash - ($scope.x_cost + $scope.y_cost));
			if ($scope.cash - ($scope.x_cost + $scope.y_cost) === 0 && $scope.cashexhaustion) {
				$scope.disablebutton();
			} else if ($scope.cashexhaustion){
				$scope.enablebutton();
			}
		};


 		/******************************
 		* .cashbar progressbar functions
 		*******************************/

		$(".cashbar").on("progressbarcreate", function(event, ui) {
			$(".cash-payoff").val($scope.cash);
		});

		$(".cashbar").on("progressbarchange", function(event, ui) {
			$(".cash-payoff").val($(".cashbar").progressbar("option", "value"));
		});


 		/******************************
 		* .asset-x slider functions
 		*******************************/

 		$(".asset-x").on("slidecreate", function(event, ui) {
			$(".x-payoff").val(0);
		});

		$(".asset-x").on("slide", function (event, ui) {
			$scope.x_selection = ui.value;
			$scope.x_cost = $scope.x_selection * $scope.price.x;

			// If the cost of x and y combined is more than the
			// amount of cash available, do not allow the slider to move
			if ($scope.cash - ($scope.x_cost + $scope.y_cost) < 0){
				return false;
			} else { // Otherwise set the new value of x
				$(".x-payoff").val($scope.x_selection);
				$(".cashbar").progressbar("option", "value",
					($scope.cash - ($scope.x_cost + $scope.y_cost)));
				$scope.togglebutton();
			}
		});

 		$(".asset-x").on("slidechange", function(event, ui) {
			$scope.x_selection = ui.value;
			$scope.x_cost = $scope.x_selection * $scope.price.x;


			var x_total = $scope.x_selection + $(".cashbar").progressbar("option", "value");
			var y_total = $scope.y_selection + $(".cashbar").progressbar("option", "value");

			$(".x-payoff").val($scope.x_selection);
			$(".cashbar").progressbar("option", "value",
				($scope.cash - ($scope.y_cost + $scope.x_cost)));
			$(".total-x").val(x_total);
			$(".total-y").val(y_total);

			rs.trigger("as.selection", [x_total, y_total]);
		});


 		/******************************
 		* .asset-y slider functions
 		*******************************/

		$(".asset-y").on("slidecreate", function(event, ui) {
			$(".y-payoff").val(0);
		});

		$(".asset-y").on("slide", function (event, ui) {
			$scope.y_selection = ui.value;
			$scope.y_cost = $scope.y_selection * $scope.price.y;

			// If the cost of y and x combined is more than the
			// amount of cash available, do not allow the slider to move
			if ($scope.cash - ($scope.y_cost + $scope.x_cost) < 0){
				return false;
			} else { // Otherwise set the new value of y
				$(".y-payoff").val($scope.y_selection);
				$(".cashbar").progressbar("option", "value",
					($scope.cash - ($scope.y_cost + $scope.x_cost)));
				$scope.togglebutton();
			}
		});

		$(".asset-y").on("slidechange", function(event, ui) {
			$scope.y_selection = ui.value;
			$scope.y_cost = $scope.y_selection * $scope.price.y;

			var x_total = $scope.x_selection + $(".cashbar").progressbar("option", "value");
			var y_total = $scope.y_selection + $(".cashbar").progressbar("option", "value");

			$(".y-payoff").val($scope.y_selection);
			$(".cashbar").progressbar("option", "value",
				($scope.cash - ($scope.y_cost + $scope.x_cost)));
			$(".total-x").val(x_total);
			$(".total-y").val(y_total);

			rs.trigger("as.selection", [x_total, y_total]);
		});

}]);
