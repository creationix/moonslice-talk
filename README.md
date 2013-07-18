# MoonSlice

## Continuing Innovation in node.js API Design

By Tim Caswell


<img style="border:0;box-shadow:inherit;background:inherit" src="creationix-logo.png" alt="Creationix Innovations">


## Background

 - [Node.JS](http://nodejs.org/)
 - [Luvit](http://luvit.io/)
 - [JS-Git](https://github.com/creationix/js-git)


<img style="border:0;box-shadow:inherit;background:inherit" src="js-git-logo.png" alt="JS-Git">


## Discoveries

 - Conventions
 - Swappable Abstractions
 - Minimal Dependencies



# Continuables

## Simple Flow Control Primitives


### A Simple Convention

```javascript
var continuable = fs.readFile("myFile.txt");

continuable(function (err, data) { ... });
```


## Composable Helpers

 - parallal(continuable, ...) &rarr; continuable
 - serial(continuable, ...) &rarr; continuable


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

## Resumable Function Bodies


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


```javascript
run(function* () {
  var repo = yield jsgit.repo("/path/to/repo");
  var head = yield repo.readRef("HEAD");
  var commit = yield repo.load(head);
  var tree = yield repo.load(commit.tree);
});
```


```javascript
run(function* () {
  var names = yield fs.readdir("mydir");
  names.forEach(function (name) {
    var path = path.join("mydir/", name);
    // ERROR!!!
    var data = yield fs.readFile(path, "utf8");
    console.log(path, data);
  });
});
```


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

## A Simpler Stream Interface


```javascript
var stream = {
  read: function (callback) { /*...*/ },
  abort: function (callback) { /*...*/ },
};
```


```javascript
var stream = fs.readStream("/path/to/file");
```


```javascript
var sink = fs.writeStream("/path/to/newFile");

sink(stream);
```


```javascript
var objectStream = parse(jsonStream);
```


```javascript
tcp.createServer(8080, function (stream) {

  stream.sink(stream);

});
```


## Stream Demo

<img style="border:0;box-shadow:inherit;background:inherit" src="f310.png" alt="Logictech Gamepad F310">



# State Machines

## The bread and butter of protocol streams.


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


```javascript
json = JSON.stringify({name: 'Tim Caswell'});
json = JSON.stringify([1, 2, 3]);
json = JSON.stringify([4, 5, 6]);
```


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


```javascript
function transformer(emit) {

  return function (item) {

  };

}
```


```javascript
var state = inflate(onByte, $after);

for (var i = 0; i < data.length; i++) {
  state = state(data[i]);
}
```


```javascript
function $before(byte) {
  return inflate(onByte, $after);
}

function $after(byte) {
  return $someOtherState;
}
```


```javascript
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


## How do I know which style to use?


## Decoupling I/O from Protocol


## Reasons to Decouple

 - Tests!
 - Multi-platform web apps.
 - Less dependencies


```javascript
var tcp = require('simple-tcp');
tcp.createServer(8080, function (socket) {
  // A client connected
  // socket = { read, abort, sink }
});
```


```javascript
var tcp = require('simple-tcp');
var parser = require('http-request-parser');
var encoder = require('http-response-encoder');
tcp.createServer(8080, function (socket) {
  var httpSocket = parser(socket);
  httpSocket.sink = function (stream) {
    socket.sink(encoder(stream));
  };
});
```


## An HTTP API

 - request-parser: (stream&lt;binary>) &rarr; stream&lt;request>
 - response-encoder: (stream&lt;response>) &rarr; stream&lt;binary>
 - request-encoder: (stream&lt;request>) &rarr; stream&lt;binary>
 - response-parser: (stream&lt;binary>) &rarr; stream&lt;response>


## A Websocket API

 - decoder: (stream&lt;binary>) &rarr; stream&lt;message>
 - encoder: (stream&lt;message>) &rarr; stream&lt;binary>
 - Here "binary" means raw websocket protocol data including framing and masking.
 - "message" means the message body as a Buffer or String.


## A JSON API

 - decoder: (stream&lt;json>) &rarr; stream&lt;object>
 - encoder: (stream&lt;object>) &rarr; stream&lt;json>
 - Converts between raw JSON strings or buffers and JavaScript objects.


```javascript
function app(request) {
  console.log(request.method, request.path);
  return "Hello World";
}
```


## The API

 - app(request) -> continuable&lt;response>
 - request = { method, path, headers, body }
 - response = { code, headers, body }
 - For ease of use, lots of sugar and shortcuts are added.


```javascript
test("Root returns HTML", function (assert) {
  var request = {
    method: "GET", path: "/", headers: []
  };
  var result = app(request);
  normalize(result, function (result) {
    assert.equal(result.code, 200);
    assert.end();
  });
});
```



# Takeaways


## Simple Conventions


## Decouple Protocols From I/O


## Use the Right Tool for the Job


# Thank You!


## Take the Survey

 - Session Survey
   - Available on the SenchaCon mobile app
   - <http://app.senchacon.com/>
 - Be Social
   - [@senchacon](https://twitter.com/senchacon) [#senchacon](https://twitter.com/search?q=%23senchacon)
 - Contact Me
   - [@creationix](https://twitter.com/creationix)
