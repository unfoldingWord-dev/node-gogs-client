var gulp = require('gulp'),
  mocha = require('gulp-mocha');

gulp.task('test', function () {
  return gulp.src('./tests/tests.js', {read:false})
    .pipe(mocha({reporter: 'spec'}));
});
gulp.task('default', ['test']);