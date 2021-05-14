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
  if (XY instanceof Element) {
    XY = Object.assign({}, getXY(XY));
  } else {
    throw TypeError('accepts and object or Node');
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
  /*Array */ maxHW = [50, 50]) => {
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


export default {
  diffXY : diffXY,
  getXY : getXY,
  getSpecificXY: getSpecificXY
}