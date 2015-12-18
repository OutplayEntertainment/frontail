'use strict';

var EventEmitter = require('events').EventEmitter;
var childProcess = require('child_process');
var util = require('util');
var CBuffer = require('CBuffer');

var Tail = function (path, options) {
    EventEmitter.call(this);

    options = options || {buffer: 0};
    this._buffer = new CBuffer(options.buffer);
    var tail;

    var rotates = false;
    if (options.ssh) {
        var args = [
            options.ssh.remoteUser + '@' + options.ssh.remoteHost,
            '-p', options.ssh.remotePort,
            'tail -f'
        ].concat(path);

        tail = childProcess.spawn('ssh', args);
    } else {
        rotates = true;
        tail = childProcess.spawn('tail', ['-n', options.buffer, '-F'].concat(path));
    }

    tail.stdout.on('data', function (data) {
        var lines = data.toString('utf-8').split('\n');
        lines.pop();
        lines.forEach(function (line) {
            this._buffer.push(line);
            this.emit('line', line);
        }.bind(this));
    }.bind(this));

    tail.stderr.on('data', function (data) {
        var msg = data.toString();
        if (rotates && msg.search("truncated") != -1) {
            // if file was rotated, tail will print smth to stderr
            // XXX: For some reason we will lose one line, it seems
            console.log("File rotated, waiting...");
        } else {
            //if there is unknown error then display it in the console and then kill the tail.
            console.error(msg);
            process.exit();
        }
    });

    tail.on('close', function (code) {
        console.error('tail process exited with code ' + code);
        process.exit();
    })

    process.on('exit', function () {
        tail.kill();
    });
};
util.inherits(Tail, EventEmitter);

Tail.prototype.getBuffer = function () {
    return this._buffer.toArray();
};

module.exports = function (path, options) {
    return new Tail(path, options);
};
