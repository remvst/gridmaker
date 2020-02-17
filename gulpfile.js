'use strict';

const browserify = require('browserify');

const gulp = require('gulp');
const buffer = require('gulp-buffer');
const concat = require('gulp-concat');
const tap = require('gulp-tap');

function build() {
    return gulp
        .src(['src/index.js'])
        .pipe(tap((file) => {
            // replace file contents with browserify's bundle stream
            file.contents = browserify(file.path, {
                'debug': false
            }).bundle();
        }))
        .pipe(buffer())
        .pipe(concat('bundle.js'))
        .pipe(gulp.dest('dist'));
}

gulp.task('default', build);

gulp.task('watch', () => gulp.watch('src/*.js', build))
