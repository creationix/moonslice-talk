var readStream = require('simple-fs').readStream;
var pushToPull = require('push-to-pull');
var run = require('gen-run');
var convert = pushToPull(transform);
var inspect = require('util').inspect;

dump("/dev/input/js0");
dump("/dev/input/js1");

function dump(path) {
  run(function* () {
    var joy = yield readStream(path);
    joy = convert(joy);

    var item;
    do {
      item = yield joy.read;
      console.log(path, inspect(item, {colors:true}));
    } while (item);

  });
}



/////////////////////////////////////////////

function transform(emit) {
  return function (chunk) {
    // Forward end of stream marker
    if (!chunk) return emit(chunk);
    for (var i = 0; i < chunk.length; i += 8) {
      emit(parse(chunk.slice(i, i + 8)));
    }
  };
}

function parse(buffer) {
  var event = {
    time: buffer.readUInt32LE(0),
    value: buffer.readInt16LE(4),
    number: buffer[7],
  };
  var type = buffer[6];
  if (type & 0x80) event.init = true;
  if (type & 0x01) event.type = "button";
  if (type & 0x02) event.type = "axis";
  return event;
}
