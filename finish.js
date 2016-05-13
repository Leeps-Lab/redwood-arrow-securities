RedwoodArrowSecurities.controller("ASFinishController",
	["$scope",
	 "RedwoodSubject",
	 function ($scope, rs) {
		 $scope.results = [];

		 rs.on_load(function() {
			 var results = rs.subject[rs.user_id].data["as.results"];

			 if (!results) {
				 return;
			 }
			 for (var i = 0; i < results.length; i++) {
				 var result = results[i];
				 var period = result.period;

				 $scope.results.push({
					 period: period,
					 x: result.x / result.Px,
					 y: result.y / result.Py,
					 chosen: "",
					 choosenLabel: "",
					 selected: false
				 });
				 rs.send("__set_points__", {period: period, points: 0});
			 }

			 rs.send("__set_show_up_fee__", {show_up_fee: 7.0});
			 rs.send("__set_conversion_rate__", {conversion_rate: 1/3});

			 $scope.labelX = rs.configs[rs.configs.length - 1].labelX || "X";
			 $scope.labelY = rs.configs[rs.configs.length - 1].labelY || "Y";
		 });
		 
		 rs.on("as.selected_x_or_y", function(xOrY) {
			 var result = $scope.results.filter(function(result) {
				 return result.period === $scope.selected_period;
			 })[0];

			 if (result) {
				 result.chosen = xOrY;
				 result.chosenLabel = xOrY === "x" ? $scope.labelX : $scope.labelY;
				 rs.send("__set_points__", {
					 period: $scope.selected_period,
					 points: xOrY === "x" ? result.x : result.Yy
				 });
			 }
		 });
}]);
