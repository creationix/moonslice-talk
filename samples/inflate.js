module.exports = inflate;

function inflate(emit, $done) {

  var cmf = 0;
  var final = 0;
  var type = 0;
  var bit = 0;          // Current bit offset in byte
  var digit = 0;        // Current bit in value
  var value = 0;        // Current bit value
  var bitsLeft = 0;
  var oldByte;
  var nextState = null;

  return $cmf;  // Start out parsing the zlib deflate headers

  // Compression method and flags
  function $cmf(byte) {
    cmf = byte;
    // bits 0 to 3 Compression method
    if ((cmf & 0xf) !== 8) {
      throw new Error("Only compression method 8 (deflate) supported");
    }
    // bits 4 to 7 Compression info
    if ((cmf >> 4 & 0xf) !== 7) {
      throw new Error("Sorry, only 32K LZ77 windows are supported");
    }
    return $flg;
  }

  // FLaGs
  function $flg(byte) {
    if (((cmf << 8) + byte) % 31) {
      throw new Error("Invalid fcheck in zlib header");
    }
    // bit 5 (preset dictionary)
    return (byte >> 5 & 0x1) ? $dict : want(1, _bfinal);
  }

  function $dict(byte) {
    throw new Error("TODO: Implement parsing preset dictionary");
  }

  function want(num, state) {
    bitsLeft = num;
    nextState = state;
    digit = 0;
    value = 0;
    return bit ? $consume(oldByte) : $consume;
  }

  function $consume(byte) {
    oldByte = byte;
    while (bitsLeft--) {
      value |= ((byte >> bit++) & 1) << digit++;
      if (bit === 8) {
        bit = 0;
        if (bitsLeft) return $consume;
      }
    }
    console.log(nextState.name, value.toString(2));
    return nextState(value);
  }

  function _bfinal(bits) {
    final = bits;
    return want(2, _btype);
  }

  function _btype(bits) {
    type = bits;
    console.log({
      final: final,
      type: type
    });
  }

}



var data = require('fs').readFileSync(__dirname + "/sample.def");
var state = inflate(console.log);
for (var i = 0, l = data.length; i < l && state; i++) {
  console.log(state.name, data[i].toString(2))
  state = state(data[i]);
}