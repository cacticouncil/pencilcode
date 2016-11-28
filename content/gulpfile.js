'use strict';

var gulp = require('gulp');
var shell = require('gulp-shell')
var electron = require('../../../').server.create();

gulp.task('serve', function () {
  // Start browser process
  electron.start();

  // Restart browser process
  gulp.watch('main.js', ['reload:browser']);

  // Reload renderer process
  gulp.watch(['editor.js', 'editor.html'], ['reload:renderer']);
});

gulp.task('reload:browser', function (done) {
  // Restart main process
  electron.restart();
  done();
});

gulp.task('reload:renderer', function (done) {
  // Reload renderer process
  electron.reload();
  done();
});

gulp.task('default', ['serve']);

gulp.task('shorthand', shell.task([
  'echo pencils',
  'echo pencilsock'
]))
