/**
 * Created by wehjin on 5/24/14.
 */

var should = require("chai").should();
var SpawnStream = require('../index.js');
var fs = require('fs');

describe("SpawnStream", function () {
    it("should write and emit data", function (done) {

        var output = "";
        var stream = new SpawnStream('cat', null);

        /*
         fs.createReadStream('tests/testdata1.txt')
         .pipe(SpawnStream('cat'))
         */
        stream
            .on('data', function (data) {
                output += data.toString();
            })
            .on('end', function () {
                output.should.equal("hellogoodbyewut");
                done();
            })
            .on('error', function (err) {
                should.not.exist(err);
                done();
            });
        stream.write('hello');
        stream.write('goodbye');
        stream.write('wut');
        stream.end();
    });

    it("should emit an error when spawn fails", function (done) {

        var output = "";
        var stream = new SpawnStream('cat.does.not.exist');

        stream.on('error', function (err) {
            done();
        });
        stream.end();
    }); 

    it("should emit an error when exit code is non-zero", function (done) {

        var output = "";
        var stream = new SpawnStream('cat', ['/tmp/does.not.exist']);

        stream.on('error', function (err) {
            done();
        });
        stream.write('hello');
        stream.end();
    }); 
});