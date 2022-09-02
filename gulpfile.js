const gulp = require('gulp');
const tasks = require('./scripts/gulp');

gulp.task('clean', tasks.clean);
gulp.task('manifest', tasks.manifest);
gulp.task('sass', tasks.sass);
gulp.task('build', tasks.build);
gulp.task('rebuild', tasks.rebuild);
gulp.task('watch', tasks.watch);
gulp.task('link', tasks.link);
