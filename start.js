RedwoodArrowSecurities.controller("ASStartController",
	["$scope",
	 "RedwoodSubject",
	 "ConfigManager",
	 "SynchronizedStopWatch",
	 function ($scope, rs, configManager, SynchronizedStopWatch) {

		rs.on_load(function() {
			$scope.config = configManager.loadPerSubject(rs, {
				Px                : 0.5,
				Py                : 0.5,
				cash              : 75,
				ProbX             : 0.5,
				cashexhausted     : true,
				durationInSeconds : 300
			});

			$scope.price = {
				x: $scope.config.Px,
				y: $scope.config.Py
			}

			$scope.cash = $scope.config.cash;
			$scope.cashexhaustion = $scope.config.cashexhausted;
			$scope.togglebutton();

			$scope.probX = $scope.config.ProbX;
			$scope.probY = 1 - $scope.probX;

			$scope.rounds = $scope.config.rounds
	 		$scope.round = 0;

	    rs.trigger("next_round");
	 	});



	 	rs.on("next_round", function() {
	 		if ($scope.rounds && $scope.round >= $scope.rounds) {
	 			rs.next_period();
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

			$(".ui-state-default").css('padding-bottom', $(".ui-state-default").height() / 2)
														.height($(".ui-state-default").height() / 3)
														.css('opacity', '0.6');
	 	});

		rs.on("as.selection", function(selection) {
			$scope.selection = selection;
		});

		$scope.timeoutvalues = function() {
			if ($scope.cash - ($scope.x_cost + $scope.y_cost) !== 0 && $scope.cashexhaustion) {
		    rs.set("as.results", {
					"x": 0,
					"y": 0,
					"cash": $scope.cash,
					"period": rs.period,
					"subject": parseInt(rs.user_id),
					"cashexhaustion": $scope.cashexhaustion,
					"Px": rs.config.Px,
					"Py": rs.config.Py,
					"cash": rs.config.cash,
					"endcash": rs.config.cash,
					"ProbX": rs.config.ProbX
		    });
			} else {
		    rs.set("as.results", {
					"x": $scope.x_cost,
					"y": $scope.y_cost,
					"cash": $scope.cash - ($scope.x_cost + $scope.y_cost),
					"period": rs.period,
					"subject": parseInt(rs.user_id),
					"cashexhaustion": $scope.cashexhaustion,
					"Px": rs.config.Px,
					"Py": rs.config.Py,
					"cash": rs.config.cash,
					"endcash": $scope.cash - ($scope.x_cost + $scope.y_cost),
					"ProbX": rs.config.ProbX
		    });
			}
			rs.next_period();
		};
		$scope.submitvalues = function() {
			$(".asset-x").slider("option", "disabled", true);
			$(".asset-y").slider("option", "disabled", true);
			$("#submitbutton").attr("disabled", "disabled");
      rs.trigger("as.confirm", {
          "round": $scope.currentRound,
          "x": $scope.x_cost,
          "y": $scope.y_cost
      });
	    rs.set("as.results", {
				"x": $scope.x_cost,
				"y": $scope.y_cost,
				"cash": $scope.cash - ($scope.x_cost + $scope.y_cost),
				"period": rs.period,
				"subject": parseInt(rs.user_id),
				"cashexhaustion": $scope.cashexhaustion,
				"Px": rs.config.Px,
				"Py": rs.config.Py,
				"cash": rs.config.cash,
				"endcash": $scope.cash - ($scope.x_cost + $scope.y_cost),
				"ProbX": rs.config.ProbX
	    });
			rs.next_period();
		};
		$scope.disablebutton = function() {
			$("#submitbutton").attr("disabled", "disabled");
		};
		$scope.enablebutton = function() {
			$("#submitbutton").removeAttr("disabled");
		};
		$scope.togglebutton = function() {
			if ($scope.cashPayoff === 0 && $scope.cashexhaustion) {
				$scope.enablebutton();
			} else if ($scope.cashexhaustion){
				$scope.disablebutton();
			}
		};


 		/******************************
 		* .cashbar progressbar functions
 		*******************************/

		$(".cashbar").on("progressbarcreate", function(event, ui) {
			$scope.cashPayoff = $scope.cash;
		});

		$(".cashbar").on("progressbarchange", function(event, ui) {});


 		/******************************
 		* .asset-x slider functions
 		*******************************/

 		$(".asset-x").on("slidecreate", function(event, ui) {
		});

		$(".asset-x").on("slide", function (event, ui) {
			$scope.x_selection = ui.value;
			$scope.x_cost = $scope.x_selection * $scope.price.x;

			// If the cost of x and y combined is more than the
			// amount of cash available, do not allow the slider to move
			if ($scope.cash - ($scope.x_cost + $scope.y_cost) < 0){
				return false;
			} else { // Otherwise set the new value of x
				$scope.cashPayoff = $scope.cash - ($scope.x_cost + $scope.y_cost);
				$(".cashbar").progressbar("option", "value", $scope.cashPayoff);

				$scope.$apply();
				$scope.togglebutton();
			}
		});

 		$(".asset-x").on("slidechange", function(event, ui) {
			$scope.x_selection = ui.value;
			$scope.x_cost = $scope.x_selection * $scope.price.x;


			$scope.x_total = $scope.x_selection + $scope.cashPayoff;
			$scope.y_total = $scope.y_selection + $scope.cashPayoff;
			$scope.cashPayoff = $scope.cash - ($scope.y_cost + $scope.x_cost);

			$(".cashbar").progressbar("option", "value", $scope.cashPayoff);

			$scope.$apply();
			rs.trigger("as.selection", [$scope.x_total, $scope.y_total]);
		});


 		/******************************
 		* .asset-y slider functions
 		*******************************/

		$(".asset-y").on("slidecreate", function(event, ui) {
		});

		$(".asset-y").on("slide", function (event, ui) {
			$scope.y_selection = ui.value;
			$scope.y_cost = $scope.y_selection * $scope.price.y;

			// If the cost of y and x combined is more than the
			// amount of cash available, do not allow the slider to move
			if ($scope.cash - ($scope.y_cost + $scope.x_cost) < 0){
				return false;
			} else { // Otherwise set the new value of y
				$scope.cashPayoff = $scope.cash - ($scope.y_cost + $scope.x_cost);
				$(".cashbar").progressbar("option", "value", $scope.cashPayoff);

				$scope.$apply();
				$scope.togglebutton();
			}
		});

		$(".asset-y").on("slidechange", function(event, ui) {
			$scope.y_selection = ui.value;
			$scope.y_cost = $scope.y_selection * $scope.price.y;

			$scope.x_total = $scope.x_selection + $scope.cashPayoff;
			$scope.y_total = $scope.y_selection + $scope.cashPayoff;

			$scope.cashPayoff = $scope.cash - ($scope.y_cost + $scope.x_cost);
			$(".cashbar").progressbar("option", "value", $scope.cashPayoff);

			$scope.$apply();
			rs.trigger("as.selection", [$scope.x_total, $scope.y_total]);
		});

}]);
