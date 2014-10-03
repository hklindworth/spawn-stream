var util = require('util');
var stream = require('stream');
var Transform = stream.Transform;
var spawn = require('child_process').spawn;
var concat = require('concat-stream');

util.inherits(SpawnStream, Transform);

module.exports = SpawnStream;

function SpawnStream(command, commandArguments, options) {
    if (!(this instanceof SpawnStream))
        return new SpawnStream(command, commandArguments, options);

    options = options || {};

    var streamOptions = options['stream'] || {};
    Transform.call(this, streamOptions);

    var spawnOptions = options['spawn'] || {};
    var child = spawn(command, commandArguments, spawnOptions);
    this.child = child;

    var that = this;

    // When we get data on stdout, push it downstream. Pass through any error.
    child.stdout
        .on('data', function (data) {
            that.push(data);
        })
        .on('error', this.emit.bind(this, 'error'));

    // Pass through errors from stdin and the child.
    child.stdin.on('error', this.emit.bind(this, 'error'));
    child.on('error', this.emit.bind(this, 'error'));

    child.on('exit', function(code) {
        that._comboEnd(undefined, code);
    })

    // Collect stderr, necessary as error message
    var write = concat(function(data) {
        that._comboEnd(undefined, undefined, data.toString())
    })
    child.stderr.pipe(write);
}

SpawnStream.prototype._transform = function (chunk, encoding, callback) {
    // Pass data from upstream to the child.
    this.child.stdin.write(chunk, encoding);
    callback();
};

SpawnStream.prototype._flush = function (callback) {
    this.child.stdin.end();
    this.child.stdout.once('end', this._comboEnd.bind(this, callback));
};

// Wait for _flush => stdout.end, child.exit and stderr.end
SpawnStream.prototype._comboEnd = function(flushCallback, exitCode, stderrOutput) {
    if(flushCallback !== undefined) { this.flushCallback = flushCallback; }
    if(exitCode !== undefined) { this.exitCode = exitCode; }
    if(stderrOutput !== undefined) { this.stderrOutput = stderrOutput; }

    if(this.flushCallback !== undefined && this.exitCode !== undefined && this.stderrOutput !== undefined) {
        if(this.exitCode != 0) {
            this.flushCallback(new Error(this.stderrOutput));
        } else {
            this.flushCallback();
        }
    }
}
