const gulp = require('gulp'),
	sass = require('gulp-sass'),
	// scsslint = require('gulp-scss-lint') ,
	browserSync = require('browser-sync'),
	plumber = require('gulp-plumber'),
	reload = browserSync.reload;

const { series, parallel } = require('gulp');

const SOURCE = {
	scss: 'scss/**/*.scss',
	css: 'public/css',
	ejs: 'views/**/*.ejs',
	js: 'public/scripts/*.js',
	images: 'public/img/**/*'
};

function bsSync() {
	return browserSync({
		proxy: 'localhost:3333',
		notify: true,
		files: [SOURCE.js, SOURCE.ejs],
		open: false
	});
};

function bsReload() {
	return browserSync.reload();
}

function sassCompile() {
	return gulp.src(SOURCE.scss)
		.pipe(plumber())
		.pipe(sass())
		.pipe(gulp.dest(SOURCE.css))
		.pipe(reload({ stream: true }));
}

function watcher() {
	gulp.watch(SOURCE.scss, { ignoreInitial: false, queue: false }, sassCompile);
}

exports.default = parallel(bsSync, watcher);