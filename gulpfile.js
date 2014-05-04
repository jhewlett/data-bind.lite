var gulp = require('gulp');
var concat = require('gulp-concat');
var rename = require('gulp-rename');
var uglify = require('gulp-uglify');
var gzip = require('gulp-gzip');

gulp.task('build', function(){
    return gulp.src(['src/binder.js', 'src/model.js', 'src/collection.js'])
        .pipe(concat('data-bind.lite.js'))        //concat
        .pipe(gulp.dest('dist'))

        .pipe(rename('data-bind.lite.min.js'))    //minified
        .pipe(uglify())
        .pipe(gulp.dest('dist'))

        .pipe(gzip())                             //minified + gzip
        .pipe(gulp.dest('dist'));
});