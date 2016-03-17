RedwoodArrowSecurities.controller("ASStartController",
	["$scope",
	 "RedwoodSubject",
	 "ConfigManager",
	 "SynchronizedStopWatch",
	 function ($scope, rs, configManager, SynchronizedStopWatch) {

		rs.on_load(function() {

			$scope.config = configManager.loadPerSubject(rs, {
				Px				: 0.5,
				Py				: 0.5,
				cash 				: 50,
				ProbX				: 0.5
			});

			$scope.price = {
				x: $scope.config.Px,
				y: $scope.config.Py
			}

			$scope.cash = $scope.config.cash;
			$scope.cashexhaustion = rs.config.cashexhaustion;

			$scope.probX = $scope.config.ProbX;
			$scope.probY = 1 - $scope.probX;

			$scope.rounds = $scope.config.rounds

	    rs.trigger("next_round");
	 	});



	 	rs.on("next_round", function() {

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
					$scope.timeoutvalues();
          rs.trigger("next_round");
        }
			).start();

			$(".cashbar").progressbar({
				max: $scope.cash,
	 			value: $scope.cash
	 		});
			$(".ui-progressbar-value.ui-widget-header.ui-corner-left").css("background", "green");

			var xprice = $scope.cash * (1 / $scope.price.x);
			var yprice = $scope.cash * (1 / $scope.price.y);
	 		$(".asset-x").slider({
	 			range: "min",
	 			min: 0,
	 			max: Math.max(xprice, yprice),
	 			value: 0,
	 			orientation: "vertical",
	 			width: 30,
	 			height: 300
	 		});

	 		$(".asset-y").slider({
	 			range: "min",
	 			min: 0,
	 			max: Math.max(xprice, yprice),
	 			value: 0,
	 			orientation: "vertical",
	 			width: 30,
	 			height: 300
	 		});

	 	});

		rs.on("as.selection", function(selection) {
			$scope.selection = selection;
		});

		$scope.timeoutvalues = function() {
			console.log("timeout");
			$(".asset-x").slider("option", "disabled", true);
			$(".asset-y").slider("option", "disabled", true);
			$("#submitbutton").attr("disabled", "disabled");
			if ($scope.cash - ($scope.x_cost + $scope.y_cost) !== 0 ) {
	      rs.trigger("as.confirm", {
	          "round": $scope.currentRound,
	          "x": 0,
	          "y": 0
	      });
			} else {
	      rs.trigger("as.confirm", {
	          "round": $scope.currentRound,
	          "x": $scope.x_cost,
	          "y": $scope.y_cost
	      });
			}
		};
		$scope.submitvalues = function() {
			console.log("submit");
			$(".asset-x").slider("option", "disabled", true);
			$(".asset-y").slider("option", "disabled", true);
			$("#submitbutton").attr("disabled", "disabled");
      rs.trigger("as.confirm", {
          "round": $scope.currentRound,
          "x": $scope.x_cost,
          "y": $scope.y_cost
      });
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
			console.log("cash remaining : " + ($scope.cash - ($scope.x_cost + $scope.y_cost)));
			if ($scope.cash - ($scope.x_cost + $scope.y_cost) === 0 && $scope.cashexhaustion) {
				$scope.enablebutton();
			} else if ($scope.cashexhaustion){
				$scope.disablebutton();
			}
		};


 		/******************************
 		* .cashbar progressbar functions
 		*******************************/

		$(".cashbar").on("progressbarcreate", function(event, ui) {
			$(".cash-payoff").text($scope.cash);
		});

		$(".cashbar").on("progressbarchange", function(event, ui) {
			$(".cash-payoff").text($(".cashbar").progressbar("option", "value"));
		});


 		/******************************
 		* .asset-x slider functions
 		*******************************/

 		$(".asset-x").on("slidecreate", function(event, ui) {
			$(".x-payoff").text(0);
		});

		$(".asset-x").on("slide", function (event, ui) {
			$scope.x_selection = ui.value;
			$scope.x_cost = $scope.x_selection * $scope.price.x;

			// If the cost of x and y combined is more than the
			// amount of cash available, do not allow the slider to move
			if ($scope.cash - ($scope.x_cost + $scope.y_cost) < 0){
				return false;
			} else { // Otherwise set the new value of x
				$(".x-payoff").text($scope.x_selection);
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

			$(".x-payoff").text($scope.x_selection);
			$(".cashbar").progressbar("option", "value", ($scope.cash - ($scope.y_cost + $scope.x_cost)));
			$(".total-x").text(x_total);
			$(".total-y").text(y_total);

			rs.trigger("as.selection", [x_total, y_total]);
		});


 		/******************************
 		* .asset-y slider functions
 		*******************************/

		$(".asset-y").on("slidecreate", function(event, ui) {
			$(".y-payoff").text(0);
		});

		$(".asset-y").on("slide", function (event, ui) {
			$scope.y_selection = ui.value;
			$scope.y_cost = $scope.y_selection * $scope.price.y;

			// If the cost of y and x combined is more than the
			// amount of cash available, do not allow the slider to move
			if ($scope.cash - ($scope.y_cost + $scope.x_cost) < 0){
				return false;
			} else { // Otherwise set the new value of y
				$(".y-payoff").text($scope.y_selection);
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

			$(".y-payoff").text($scope.y_selection);
			$(".cashbar").progressbar("option", "value",
				($scope.cash - ($scope.y_cost + $scope.x_cost)));
			$(".total-x").text(x_total);
			$(".total-y").text(y_total);

			rs.trigger("as.selection", [x_total, y_total]);
		});

}]);
