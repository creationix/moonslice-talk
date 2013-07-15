# MoonSlice

## Continuing Innovation in node.js API Design

By Tim Caswell


<img style="border:0;box-shadow:inherit;background:inherit" src="creationix-logo.png" alt="Creationix Innovations">



# State Machines

## The bread and butter of protocol streams.


## Decoupled Codecs

 - Codecs are parsers, decoders, encoders, etc...
 - Basically anything that translates from one protocol or representation to another.
 - Codecs should not care or even know about your program's I/O model.
 - They only care about consuming data and emitting data.


## Streaming JSON Decoder

```javascript
var decoder = JSON.createDecoder(emit);

decoder.write('{"name":"Tim');
decoder.write(' Caswell"}[1');
decoder.write(',2,3][4,5,6]');

decoder.end();
```

```javascript
{ name: 'Tim Caswell' }
[ 1, 2, 3 ]
[ 4, 5, 6 ]
```


## Streaming JSON Encoder

```javascript
var encoder = JSON.createEncoder(console.log);

encoder.write({ name: 'Tim Caswell' });
encoder.write([ 1, 2, 3 ]);
encoder.write([ 4, 5, 6 ]);

encoder.end();
```

```javascript
'{"name":"Tim Caswell"}'
'[1,2,3]'
'[4,5,6]'
```


## JSON Encoder

```javascript
json = JSON.stringify({name: 'Tim Caswell'});
json = JSON.stringify([1, 2, 3]);
json = JSON.stringify([4, 5, 6]);
```

 - Use the right tool for the job.
 - Input to output is 1:1, so a plain function is fine.


## Streaming HTTP Parser

```javascript
var parser = HTTP.createParser(console.log);

parser.write('GET / HTTP/1.1\r\nHost: ');
parser.write('creationix.com\r\nConnec');
parser.write('tion: Keep-Alive\r\n\r\n');
parser.write('GET /favicon.ico HTTP/1.');
parser.write('1\r\nHost: creationix.co');
parser.write('m\r\nConnection: Close\r');
parser.write('\n\r\n');

parser.end();
```


## Sample HTTP Output

```javascript
{
  method: 'GET', path: '/',
  headers: [
    [ 'Host', 'creationix.com' ],
    [ 'Connection', 'Keep-Alive' ]
  ]
}
{
  method: 'GET', path: '/favicon.ico',
  headers: [
    [ 'Host', 'creationix.com' ],
    [ 'Connection', 'Close' ]
  ]
}
```


## Writing a push style transformer.

```javascript
// (push-stream) -> push-stream
function transformer(output) {
  // Once per stream setup area.
  return { write: write, end: end };

  function write(item) {
    // Once per item
    // here we can call output.emit 0-n times.
  }
  function end() {
    // Optionally cleanup state machine.
    // We can still emit and/or output.end.
  }
}
```


## Writing a push style transformer.

```javascript
// (emit) -> emit
function transformer(emit) {
  // Once per stream setup area.

  return function (item) {
    // Once per item area.
    // here we can call emit 0-n times.
  };

}
```


## Byte Oriented Parser

```javascript
// Get the starting state from a byte oriented
// parser.  It emits bytes back to us.
var state = inflate(onByte);

// When we get data, feed it in.
for (var i = 0; i < data.length; i++) {
  state = state(data[i]);
  // When the state machine is done,
  // it can return a falsy state.
  if (!state) return onParserDone();
}
```


## Nested Byte Parsers

```javascript
// An example state in our machine
function $before(byte) {
  // handle input
  // Hand control to the sub machine.
  return inflate(onInflate, $after);
}

function $after(byte) {
  // Inflate was done parsing and handed
  // control back to us.
  // ...
  return $someOtherState;
}
```


## Implementing a Byte Parser

```javascript
// Sub state machine for hex escaped characters
function hexMachine(emit) {
  var left = 4, num = 0;

  return $hex;

  function $hex(byte) {
    num |= parseHex(byte) << (--left * 4);
    if (left) return $hex;
    return emit(num);
  }

}
```


## How do I know which to use?

 - Use whichever format expresses your problem most closely.
 - Keep it minimal and only use dependencies for basic functionality.
 - People can always wrap your core logic in whatever interface they need.
 - Document and unit-test well.



# Continuables


## Continuables

```javascript
var continuable = fs.readFile("myFile.txt");
continuable(function (err, data) {
  if (err) throw err;
  // handle data.
})
```

 - Continuables are functions that accept a continuation body.
 - A cross between node-style callbacks and promises.
 - 100% simple convention.  No library required.


## Composable Helpers

```js
function init(conf, description, exclude) {
  return serial(
    fs.mkdir("."),
    parallel(
      fs.mkdir("branches"),
      write("config", conf),
      write("description", description),
      serial(
        fs.mkdir("info"),
        write("info/exclude", exclude)
      )
    )
  );
}
```


## Implementation of a Helper

```js
function serial() {
  var items = Arrayslice.call(arguments);
  return function (callback) {
    check();
    function check(err) {
      if (err) return callback(err);
      var next = items.shift();
      if (!next) return callback();
      next(check);
    }
  };
}
```


# Generators


## Generators

 - ES6 has a new feature called generators.
 - A generator function can yield a value and then later resume where it left off.
 - Combining generators with continuables allows for blocking code within an event loop!
 - Node.JS 0.11.3+ has generators built in behind a `--harmony_generators` flag.


## A Simple Generator

```javascript
function* fib() {
  var a = 1, b = 0;
  while (true) {
    yield a
    var temp = a;
    a = a + b;
    b = temp;
  }
}
```

 - Every time the generator is resumed, it will yield the next fibonacci value resuming where it left off.


## Generator Flow Control

```javascript
run(function* () {
  var repo = yield jsgit.repo("/path/to/repo");
  var head = yield repo.readRef("HEAD");
  var commit = yield repo.load(head);
  var tree = yield repo.load(commit.tree);
});
```

 - `run` is a tiny function that consumes continuables passing in callbacks to them and resumes the generator when the callback gets called.


## Generators are Shallow

```javascript
run(function* () {
  var names = yield fs.readdir("mydir");
  names.forEach(function (name) {
    var path = path.join("mydir/", name);
    var data = yield fs.readFile(path, "utf8");
    console.log(path, data);
  });
});
```

- This will **not** work.  You can't yield from the callback it's not a generator.


## Delegating Yield

```javascript
run(function* () {
  var names = yield fs.readdir("mydir");
  yield* each(names, function* (name) {
    var path = path.join("mydir/", name);
    var data = yield fs.readFile(path, "utf8");
    console.log(path, data);
  });
});

function* each(array, callback) {
  for (var i = 0, i < array.length; i++) {
    yield* callback(array[i]);
  }
}
```



# Simple Streams




## HTTP without I/O

## Websocket without I/O

