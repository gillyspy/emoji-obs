Array.prototype.unique = function (property = false, firstWins = true) {
  var a = this.concat();
  if (!!property) {
    if (firstWins) {


      for (var i = 0; i < a.length; ++i) {
        a[i].position = i;
        for (var j = i + 1; j < a.length; ++j) {
          if (a[i][property] === a[j][property])
            a.splice(j--, 1) //: a.splice(--j, 1))
        }
      }
    } else {
      for (var i = a.length - 1; i >= 0; --i) {
        a[i].position = i;
        for (var j = i - 1; j >= 0; --j) {
          if (a[i][property] === a[j][property])
            a.splice(j--, 1);
        }
      }
    }
  } else {
    if (firstWins) {
      for (var i = 0; i < a.length; ++i) {
        for (var j = i + 1; j < a.length; ++j) {
          if (a[i] === a[j])
            a.splice(j--, 1);
        }
      }
    } else {
      for (var i = a.length - 1; i >= 0; --i) {
        for (var j = i - 1; j >= 0; --j) {
          if (a[i] === a[j])
            a.splice(j--, 1);
        }
      }
    }
  }
  return a;
} // unique

Array.prototype.move = function (from, to) {
  this.splice(to, 0, this.splice(from, 1)[0]);
};
export {};