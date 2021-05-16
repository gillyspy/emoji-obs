/*
*
*/
const getXY = function (nodeXY) {
  let isInDom = true;
  if (nodeXY instanceof Element) {
    isInDom = (nodeXY.getClientRects().length !== 0)
    if (!isInDom) return null;
    //
    nodeXY = nodeXY.getBoundingClientRect();
  }
  try {
    return (({top, left, height, width, bottom, right}) => ({
      top    : top,
      left   : left,
      height : height,
      centerX: right - left,
      centerY: bottom - top,
      width  : width,
      bottom : bottom,
      right  : right
    }))(nodeXY);

  } catch (e) {
    console.log('getXY', e);
    return null
  }
} //getXY

const getSpecificXY = (XY, choices = ['left', 'top', 'width', 'height']) => {
  if (XY instanceof Element || typeof XY === 'object') {
    XY = Object.assign({}, getXY(XY));
  } else {
    throw TypeError('accepts an Object or Node');
  }
  if (choices && typeof choices === 'string') {
    choices = [choices];
  }

  const O = {};
  if (Array.isArray(choices)) {
    choices.forEach(choice => {
      O[choice] = XY[choice];
    });
    return O;
  }
  return XY;
} //getSpecificXY


const diffXY = (
  /* Element */ start,
  /* Element */  end,
  /*Array */ maxHW = [2000, 2000]) => {
  const diff = {};
  const _start = {};
  try {
    if (start instanceof Element && start.getClientRects().length) {
      start = start.getBoundingClientRect();
    }

    if (end instanceof Element && end.getClientRects().length) {
      end = end.getBoundingClientRect();
    }
    (({top, left, height, width, bottom, right},
      {
        top   : endT,
        height: endH,
        width : endW,
        left  : endL,
        bottom: endB,
        right : endR
      }) => {
      const centerY = bottom - height / 2;
      const centerX = right - width / 2;
      const endCY = endB - endH / 2;
      const endCX = endR - endW / 2;
      //end
      Object.assign(end, {
        centerX: endCY,
        centerY: endCY
      });
      //calc the center difference
      Object.assign(_start, {
        top    : top,
        left   : left,
        height : Math.min(height, maxHW[0]),
        width  : Math.min(width, maxHW[1]),
        centerX: centerX,
        centerY: centerY,
        bottom : bottom,
        right  : right
      });
      Object.assign(diff, {
        height : endH,
        width  : endW,
        bottom : endB - bottom,
        right  : endR - right,
        centerX: endCX - centerX,
        centerY: endCY - centerY,
        top    : endT - top, ///- height / 2,
        //   top: (endT - (endH / 2)) - top,

        //consider trashCan's future translateX ?
        left: endL - left // width / 2) // - _Can.pushTranslateX)
        //   left : (endL - (endW / 2 ) - _Can.pushTranslateX) - left
      });
    })(start, end);
    return {
      start: _start,
      end  : end,
      diff : diff
    };
  } catch
    (e) {
    return false;
  }
} //calcDiffXY

/*
  * use the co-ordinates of A and B to determine if they overlap
  *
  * fudge --> provide negative numbers to have a better chance of fitting
  * { left : -100p}
  *
  * fudge --> positive number to make it harder
  * { left : 100}
  *
  * fudge --> ratio (positive or negative) for similar effect
  *
   */
const isAwithinB = (
  A, B, fudge, doCenterOnly = false,
  ignore = ['left', 'right', 'top', 'bottom']) => {

  let isWithin = false;
  const diff = {};
  //thresholds
  const compare = {
    left   : 0,
    top    : 0,
    bottom : 0,
    right  : 0,
    centerX: 0,
    centerY: 0
  }
  if (typeof fudge === 'object') {
    //TODO: support ratios in fudge

    for (let f in fudge) {
      //make xy narrower to have a better chance of "fitting"
      compare[f] = 0 + fudge[f];
    }
  } else if (!fudge) {
    fudge = {};
  }

  // get XY for the A object / node
  const xyA = getXY(A);

  //update XY based upon what is in the fudge adjustments. defaults are 0 fudge
  Object.assign(compare, fudge);
  for (let c in compare) {
    xyA[c] += compare[c];
  }
  Object.assign(diff, diffXY(B, xyA, [2000, 2000]));

  if (!doCenterOnly) {
    isWithin = true;
    ignore.forEach(side => {
      if (isWithin) {
        if (side === 'left' || side === 'top')
          isWithin = (diff.diff[side] >= 0)
        if (side === 'right' || side === 'bottom')
          isWithin = (diff.diff[side] <= 0)
      }
    })
    return isWithin;
  } else if (doCenterOnly && !isNaN(diff.diff.centerX) && !isNaN(diff.diff.centerY)) {
    isWithin = true;
    if (ignore.indexOf('centerX') >= 0 || ignore.indexOf('centerY') >= 0) {
      //ignore = ignore
    } else {
      //default for center behaviours
      ignore = ['centerX', 'centerY']
    }
    ignore.forEach(side => {
      if (isWithin) {
        if (side === 'centerX')
          //if the center X line differences are smaller than the width of the container then it's good
          isWithin = (Math.abs(diff.diff[side]) <= diff.start.width)
        if (side === 'centerY')
          //if the center Y line differences are smaller than the height of the container then it's good
          isWithin = (Math.abs(diff.diff[side]) <= diff.start.height)
      }
    })
    return isWithin;

  } else {
    isWithin = false;
  }

  return false;
} //isAwithinB


export default {
  diffXY       : diffXY,
  getXY        : getXY,
  getSpecificXY: getSpecificXY,
  isAwithinB   : isAwithinB
}