var express = require ('express'), coffee = require('coffee-script'),
fs = require ('fs'), sys = require('sys'),
rootDir = process.cwd(),
app = express.createServer(),
configuration = {};

app.configure(function(){
	app.set('views', __dirname + '/views');
	app.use(express.static(__dirname + '/public'));
})

app.get('/', function(req, res){
	configuration.reload(function(configuration){
		readFromDir(rootDir, configuration.spec_dir, function(specs){
    //      readFromDir(rootDir, configuration.src_dir, function( src){
            simpleList(rootDir, configuration.src_dir, function( src){
				res.render('index.jade', {
					locals:{
						srcs:src,
						specs:specs,
						externals: configuration.externals
					},
					layout:false
				});
			});
		});
	});
});

function fatal(msg) {
	sys.puts('Error: ' + msg);
	process.exit(1);
}

function readFromDir(rootDir, dir, cb){
	var path = rootDir+dir;
	if(!(/^\/.*\/$/).test(path)) { 
		fatal('directories must start and end with "/"');
	}
	fs.readdir(rootDir+dir, function(err, result){
		cb(result.filter(function(name){
			return name.match(/(.js|.coffee)$/)
		}).map(function(item){
			return dir+item
		}))
	})
}


function simpleList(rootDir, dirs, cb){
  cb(dirs);
}


function getJavascriptFile(path, filename, res){
	var file = path + filename

	fs.readFile(file, function(err, contents){
		if(/coffee$/.test(file)) {
			try {
				contents = coffee.compile(new String(contents));
			} catch(e) { sys.puts('error compiling ' + file); }
		}
		res.send(contents, {'Content-Type':'application/javascript'})  
	})  
}

function configure(config){
	configuration = config;
	if(typeof configuration.reload != "function"){
		configuration.reload = function(cb){cb(config);}
	}
	app.get(config.spec_dir+'*', function(req, res){
		getJavascriptFile(rootDir + config.spec_dir, req.params[0], res)
	});
    if (configuration.src_dir.length) {
        for (var i = 0; i < configuration.src_dir.length; i++) {
            var dir = configuration.src_dir[i];
//            app.get(dir, function(req, res){
//              console.log(dir)
//            getJavascriptFile(rootDir + '/', dir, res)
//          });
        }
        app.get('/*', function(req, res){
          getJavascriptFile(rootDir + '/', req.params[0], res)
        });
    }
    else {
        app.get(config.src_dir+'*', function(req, res){
          getJavascriptFile(rootDir + configuration.src_dir, req.params[0], res)
        });
    }
}

module.exports = {
	routes:app,
	configure:configure
};

