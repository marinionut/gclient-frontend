var bodyParser = require('body-parser'),
    express = require('express'),
    fs = require('fs'),
    gulp = require('gulp'),
    usemin = require('gulp-usemin'),
    wrap = require('gulp-wrap'),
    connect = require('gulp-connect'),
    watch = require('gulp-watch'),
    minifyCss = require('gulp-cssnano'),
    concat = require('gulp-concat'),
    less = require('gulp-less'),
    rename = require('gulp-rename'),
    minifyHTML = require('gulp-htmlmin'),
    minifyJs = require('gulp-uglify'),
    gutil = require('gulp-util'),
    http = require('http'),
    mysql = require('mysql'),
    path = require('path'),
    pump = require('pump'),
    passport = require('passport'),
    JwtStrategy = require('passport-jwt').Strategy,
    ExtractJwt = require('passport-jwt').ExtractJwt,
    jwt = require('jwt-simple'),
    async = require('async'),
    pg = require("pg"),
    cookieParser = require('cookie-parser'),
    methodOverride = require('method-override');


var dbConfig = require('./config').DB;

var paths = {
    scripts: 'src/js/**/*.*',
    styles: 'src/less/**/*.*',
    images: 'src/img/**/*.*',
    templates: 'src/templates/**/*.html',
    index: 'src/index.html',
    bower_fonts: 'src/components/**/*.{ttf,woff,eof,svg}',
    bower_images: 'src/components/**/*.png'
};

/**
 * Handle bower components from index
 */
gulp.task('usemin', function() {
    return gulp.src(paths.index)
        .pipe(usemin({
            js: [minifyJs(), 'concat'],
            css: [minifyCss({keepSpecialComments: 0}), 'concat'],
        }))
        .pipe(gulp.dest('dist/'));
});

/**
 * Copy assets
 */
gulp.task('build-assets', ['copy-bower_fonts', 'copy-bower_images']);

gulp.task('copy-bower_fonts', function() {
    return gulp.src(paths.bower_fonts)
        .pipe(rename({
            dirname: '/fonts'
        }))
        .pipe(gulp.dest('dist/lib'));
});

gulp.task('copy-bower_images', function(cb) {
    return gulp.src(paths.bower_images)
        .pipe(rename({
            dirname: '/images'
        }))
        .pipe(gulp.dest('dist/lib/css'));
});

/**
 * Handle custom files
 */
gulp.task('build-custom', ['custom-images', 'custom-js', 'custom-less', 'custom-templates']);

gulp.task('custom-images', function() {
    return gulp.src(paths.images)
        .pipe(gulp.dest('dist/img'));
});

gulp.task('custom-js', function() {
    return gulp.src(paths.scripts)
        .pipe(minifyJs())
        .pipe(concat('dashboard.min.js'))
        .pipe(gulp.dest('dist/js'));
});

gulp.task('custom-less', function() {
    return gulp.src(paths.styles)
        .pipe(less())
        .pipe(gulp.dest('dist/css'));
});

gulp.task('custom-templates', function() {
    return gulp.src(paths.templates)
        .pipe(minifyHTML())
        .on('error', function(e){
            console.log(e);
            return this.end();})
        .pipe(gulp.dest('dist/templates'));
});

/**
 * Watch custom files
 */
gulp.task('watch', function() {
    gulp.watch([paths.images], ['custom-images']);
    gulp.watch([paths.styles], ['custom-less']);
    gulp.watch([paths.scripts], ['custom-js']);
    gulp.watch([paths.templates], ['custom-templates']);
    gulp.watch([paths.index], ['usemin']);
});

/**
 * Express web server
 */
gulp.task('express', function() {
    var dbConnection = mysql.createConnection(dbConfig);

    var app = express();
    var router = express.Router();
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({extended: true}));
    app.use(passport.initialize());
    app.use(express.static(path.join(__dirname, 'dist')));

    var opts = {};
    opts.secretOrKey = dbConfig.database;
    opts.jwtFromRequest = ExtractJwt.fromAuthHeader();

    passport.use(new JwtStrategy(opts, function(jwt_payload, done) {
        var select_sql = "SELECT * FROM users WHERE username = ?";
        select_sql = mysql.format(select_sql, jwt_payload.username);
        dbConnection.query(select_sql, function(error, results, fields) {
            if(results.length == 1) {
                done(null, results[0]);
            } else {
                done(null, false);
            }
        });
    }));

    router.put('/api/register', function(req, res) {
        var checkUsername = function(username, password) {
            var select_sql = "SELECT username FROM users WHERE username = ?";
            select_sql = mysql.format(select_sql, username);
            dbConnection.query(select_sql, function(error, results, fields) {
                if(results.length == 0) {
                    insertUser(username, password);
                } else {
                    res.send({success: false, msg: 'Nume de utilizator existent!'});
                }
            });
        }

        var insertUser = function(username, password) {
            var insert_sql = "INSERT INTO users(username, password, family) VALUES (?, ?, 1)";
            insert_sql = mysql.format(insert_sql, [req.body.username, req.body.password]);
            dbConnection.query(insert_sql, function(error, results, fields) {
                if(results.affectedRows == 1) {
                    gutil.log("Utilizator inregistrat: "+username);
                    res.send({success: true, msg: 'Inregistrare efectuata!'});
                } else {
                    res.send({success: false, msg: 'Eroare la adaugare utilizator!'});
                }
            });
        }

        if(req.body.username && req.body.password){
            checkUsername(req.body.username, req.body.password);
        } else {
            res.send({success: false, msg: 'Completati numele de utilizator cat si parola!'});
        }
    });

    router.post('/api/authenticate', function(req, res) {
        var select_sql = "SELECT * FROM users WHERE username = ?";
        if(req.body.username) {
            select_sql = mysql.format(select_sql, req.body.username);
            dbConnection.query(select_sql,  function(error, results, fields) {
                if(results.length == 0) {
                    res.send({success: false, msg:'Nume utilizator gresit!'});
                } else {
                    if(req.body.password) {
                        if(results[0].password === req.body.password) {
                            gutil.log("Utilizator autentificat: "+results[0].username);
                            var token = jwt.encode(results[0], dbConfig.database);
                            res.json({success: true, token: 'JWT ' + token, msg: 'Authentification '});
                        } else {
                            res.send({success: false, msg:'Parola gresita!'});
                        }
                    } else {
                        res.send({success: false, msg:'Parola necompletata!'});
                    }
                }
            });
        } else {
            res.send({success: false, msg:'Nume utilizator necompletat!'});
        }
    });

    router.get('/api/memberinfo', passport.authenticate('jwt', {session: false}), function(req, res) {
        var getToken = function(headers) {
            if(headers && headers.authorization) {
                var parted = headers.authorization.split(' ');
                if(parted.length == 2) {
                    return parted[1];
                } else {
                    return null;
                }
            } else {
                return null;
            }
        }

        var token = getToken(req.headers);
        if(token) {
            var decoded = jwt.decode(token, dbConfig.database);
            var select_sql = "SELECT * FROM users WHERE username = ?";
            select_sql = mysql.format(select_sql, decoded.username);
            dbConnection.query(select_sql, function(error, results, fields) {
                if(results.length == 1) {
                    var info = {id: results[0].id, username: results[0].username, familie: results[0].family};
                    res.json({success: true, msg: info});
                } else {
                    res.status(403).send({success: false, msg: 'Nume utilizator inexistent!'});
                }
            });
        } else {
            res.status(403).send({success: false, msg: 'Nu exista token!'});
        }
    });

    app.use(cookieParser())
    app.use(bodyParser());
    app.use(methodOverride('X-HTTP-Method-Override'));
    app.use(function(req, res, next) {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        res.header("Access-Control-Allow-Methods", "PUT, GET, POST, DELETE, OPTIONS");
        next();
    });

    server = require('http').Server(app);

    app.use('/', router);
    var server = http.createServer(app);
    var HTTP_PORT = 8888;
    server.listen(HTTP_PORT, function() {
        gutil.log("Listening on port "+HTTP_PORT);
    });
});

/**
 * Live reload server
 */
gulp.task('webserver', function() {
    connect.server({
        root: 'dist',
        livereload: true,
        port: 8888
    });
});

gulp.task('livereload', function() {
    gulp.src(['dist/**/*.*'])
        .pipe(watch(['dist/**/*.*']))
        .pipe(connect.reload());
});

/**
 * Gulp tasks
 */
gulp.task('build', ['usemin', 'build-assets', 'build-custom']);
gulp.task('default', ['build', 'webserver', 'livereload', 'watch']);
gulp.task('dev', ['build', 'express', 'watch', 'livereload']);