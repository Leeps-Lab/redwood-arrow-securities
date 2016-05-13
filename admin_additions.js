RedwoodRevealedPreferences.controller("ASAdminAdditionsController", ["Admin", "$scope", function(ra, $scope) {
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
