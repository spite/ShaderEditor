( function() {

	function _h( f, c ) {
		return function() {
			var res = f.apply( this, arguments );
			res = c.apply( this, [ res, arguments ] ) || res;
			return res;
		}
	}

	function _h2( f, c ) {
		return function() {
			return c.apply( this, arguments );
		}
	}

	var references = {};
	function keepReference( f ) {

		references[ f ] = WebGLRenderingContext.prototype[ f ];

	}

	var _gl = document.createElement( 'canvas' ).getContext( 'webgl' );

	keepReference( 'getUniformLocation' );

	function init() {
		
		var css = document.createElement( 'link' );
		css.rel = 'stylesheet'
		css.type = 'text/css';
		css.href = 'deps/CodeMirror.css';
		document.getElementsByTagName( 'head' )[ 0 ].appendChild( css );

		var css = document.createElement( 'link' );
		css.rel = 'stylesheet'
		css.type = 'text/css';
		css.href = 'deps/styles.css';
		document.getElementsByTagName( 'head' )[ 0 ].appendChild( css );

		var css = document.createElement( 'link' );
		css.rel = 'stylesheet'
		css.type = 'text/css';
		css.href = 'http://fonts.googleapis.com/css?family=Droid+Sans+Mono';
		document.getElementsByTagName( 'head' )[ 0 ].appendChild( css );

		var editor = document.createElement( 'div' );
		editor.setAttribute( 'id', 'shaderEditor' );
		document.body.appendChild( editor );
		this.shaderEditor = editor;

		var p = document.createElement( 'p' );
		p.textContent = 'Programs';
		p.className = 'programs-title';
		editor.appendChild( p );

		var programList = document.createElement( 'ul' );
		programList.setAttribute( 'id', 'programList' );
		editor.appendChild( programList );

		var editorContainer = document.createElement( 'ul' );
		editorContainer.setAttribute( 'id', 'editorContainer' );
		editor.appendChild( editorContainer );

		var p = document.createElement( 'p' );
		p.textContent = 'Vertex Shader';
		p.className = 'vs-title';
		editorContainer.appendChild( p );

		var p = document.createElement( 'p' );
		p.textContent = 'Fragment Shader';
		p.className = 'fs-title';
		editorContainer.appendChild( p );

		var js = document.createElement( 'script' );
		js.src = 'deps/CodeMirror.js';
		document.getElementsByTagName( 'head' )[ 0 ].appendChild( js );
		js.addEventListener( 'load', function() {

			var js = document.createElement( 'script' );
			js.src = 'deps/glsl.js';
			document.getElementsByTagName( 'head' )[ 0 ].appendChild( js );
			js.addEventListener( 'load', function() {

				var el = document.createElement( 'style' );
				document.getElementsByTagName( 'head' )[ 0 ].appendChild( el );
				el.textContent = css;
				
				this.programList = programList;
				
				var options = { 
					lineNumbers: true,
					matchBrackets: true,
					indentWithTabs: false,
					tabSize: 4,
					indentUnit: 4,
					mode: "text/x-glsl",
					foldGutter: true,
					gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"],
				};

				this.vsEditor = CodeMirror( editorContainer, options ),
				this.fsEditor = CodeMirror( editorContainer, options );
				this.vsEditor._errors = [];
				this.fsEditor._errors = [];
				
				this.vsEditor.getWrapperElement().setAttribute( 'id', 'vsEditor' );
				this.fsEditor.getWrapperElement().setAttribute( 'id', 'fsEditor' );

				var keyTimeout = 500;
				var vSTimeout;
				function scheduleUpdateVS() {

					if( vSTimeout ) vSTimeout = clearTimeout( vSTimeout );
					vSTimeout = setTimeout( update, keyTimeout );

				}

				var fSTimeout;
				function scheduleUpdateFS() {

					if( fSTimeout ) fSTimeout = clearTimeout( fSTimeout );
					fSTimeout = setTimeout( update, keyTimeout );
					
				}

				this.vsEditor.on( 'change', scheduleUpdateVS );
				this.fsEditor.on( 'change', scheduleUpdateFS );

				this.vsEditor.on( 'keyup', scheduleUpdateVS );
				this.fsEditor.on( 'keyup', scheduleUpdateFS );

			}.bind( this ) );

		}.bind( this ) );

	}

	function htmlEncode(str){

		return String(str)
			.replace(/&/g, '&amp;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#39;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;');

	}

	function testShader( type, source, code ) {

		if( source === '' ) return;

		var s = _gl.createShader( type );
		_gl.shaderSource( s, source );
		_gl.compileShader( s );

 		while( code._errors.length > 0 ) {

			var mark = code._errors.pop();
			code.removeLineWidget( mark );

		}

		if ( _gl.getShaderParameter( s, _gl.COMPILE_STATUS ) === false ) {

			var error = _gl.getShaderInfoLog( s );
					
		    if( error==null )
		    {
		        /*this.mForceFrame = true;
		        if( fromScript==false )
		        {
		            eleWrapper.className = "errorNo";
		            setTimeout(function () { eleWrapper.className = ""; }, 500 );
		        }*/
		    }
		    else
		    {
		        //eleWrapper.className = "errorYes";

		        var lineOffset = 0;//this.mEffect.GetHeaderSize( this.mActiveDoc );
		        var lines = error.match(/^.*((\r\n|\n|\r)|$)/gm);
		        for( var i=0; i<lines.length; i++ )
		        {
		            var parts = lines[i].split(":");
		            if( parts.length===5 || parts.length===6 )
		            {
		                var lineNumber = parseInt( parts[2] ) - lineOffset;
		                var msg = document.createElement("div");
		                msg.appendChild(document.createTextNode( parts[3] + " : " + parts[4] ));
		                msg.className = "errorMessage";
		                var mark = code.addLineWidget( lineNumber - 1, msg, {coverGutter: false, noHScroll: true} );

		                code._errors.push( mark );
		            }
		            else if( lines[i] != null && lines[i]!="" && lines[i].length>1 && parts[0]!="Warning")
		            {
		                console.log( parts.length + " **" + lines[i] );

		                var txt = "";
		                if( parts.length==4 )
		                    txt = parts[2] + " : " + parts[3];
		                else
		                    txt = "Unknown error";

		                var msg = document.createElement("div");
		                msg.appendChild(document.createTextNode( txt ));
		                msg.className = "errorMessage";
		                var mark = code.addLineWidget( 0, msg, {coverGutter: false, noHScroll: true, above: true} );
		                code._errors.push( mark );

		            }
		         }
		    }
//			console.error( 'Shader couldn\'t compile.' );
			return false;

		}

		if ( _gl.getShaderInfoLog( s ) !== '' ) {

			console.error( '_gl.getShaderInfoLog()', _gl.getShaderInfoLog( s ) );
			return false;

		}

		return true;

	}

	init();

	this.programs = [];
	this.shaders = [];
	var uniforms = [];
	var currentProgram = null;

	function findProgram( p ) {

		var f = null;
		programs.forEach( function( e ) {
			if( e.program === p ) f = e;
		} );
		return f;

	}

	function findShader( s ) {

		var f = null;

		shaders.forEach( function( e ) {
			if( e.shader === s ) {
				f = e;
			}
		} );

		return f;	

	}

	function addProgram( gl, p ) {

		this.shaderEditor.style.display = 'block';

		var li = document.createElement( 'li' );
		li.textContent = 'Program';

		var el = { gl: gl, program: p, shaders: [], li: li };

		li.addEventListener( 'click', function( e ) {
			selectProgram( el );
			e.preventDefault();
		} );

		programs.push( el );

		this.programList.appendChild( li );

	}

	function selectProgram( p ) {

		currentProgram = p;
		this.vsEditor.setValue( p.shaders[ 0 ].source );
		this.vsEditor.refresh();

		this.fsEditor.setValue( p.shaders[ 1 ].source );
		this.fsEditor.refresh();
			
	}

	function update() {

		if( !currentProgram ) return;

		var gl = currentProgram.gl,
			program = currentProgram.program,
			vertexShader = currentProgram.shaders[ 0 ].shader,
			fragmentShader = currentProgram.shaders[ 1 ].shader;

			if( currentProgram.shaders[ 0 ].type === gl.VERTEX_SHADER ) vertexShader = currentProgram.shaders[ 0 ].shader;
			if( currentProgram.shaders[ 0 ].type === gl.FRAGMENT_SHADER ) fragmentShader = currentProgram.shaders[ 0 ].shader;
			if( currentProgram.shaders[ 1 ].type === gl.VERTEX_SHADER ) vertexShader = currentProgram.shaders[ 1 ].shader;
			if( currentProgram.shaders[ 1 ].type === gl.FRAGMENT_SHADER ) fragmentShader = currentProgram.shaders[ 1 ].shader;
			
		//gl.detachShader( program, vertexShader );
		//gl.detachShader( program, fragmentShader );

		//vertexShader = gl.createShader( gl.VERTEX_SHADER );
		//fragmentShader = gl.createShader( gl.FRAGMENT_SHADER );
		
		if( !testShader( gl.VERTEX_SHADER, this.vsEditor.getValue(), this.vsEditor ) ) return false;
		if( !testShader( gl.FRAGMENT_SHADER, this.fsEditor.getValue(), this.fsEditor ) ) return false;
		
		gl.shaderSource( vertexShader, this.vsEditor.getValue() );
		gl.shaderSource( fragmentShader, this.fsEditor.getValue() );

		gl.compileShader( vertexShader );

		if ( gl.getShaderParameter( vertexShader, gl.COMPILE_STATUS ) === false ) {

			console.error( 'THREE.WebGLShader: Shader couldn\'t compile.' );

		}

		if ( gl.getShaderInfoLog( vertexShader ) !== '' ) {

			console.error( 'THREE.WebGLShader:', 'gl.getShaderInfoLog()', gl.getShaderInfoLog( vertexShader ) );

		}

		gl.compileShader( fragmentShader );


		if ( gl.getShaderParameter( fragmentShader, gl.COMPILE_STATUS ) === false ) {

			console.error( 'Shader couldn\'t compile.' );

		}

		if ( gl.getShaderInfoLog( fragmentShader ) !== '' ) {

			console.error( 'gl.getShaderInfoLog()', gl.getShaderInfoLog( fragmentShader ) );

		}

		gl.attachShader( program, vertexShader );
		gl.attachShader( program, fragmentShader );

		gl.linkProgram( program );

		if( !gl.getProgramParameter(program,gl.LINK_STATUS) ) {
	        var infoLog = gl.getProgramInfoLog(program);
	        //gl.deleteProgram( program );
	        console.log( infoLog );
	    }

		console.log( 'update' );

	}

	WebGLRenderingContext.prototype.createShader = _h( 
		WebGLRenderingContext.prototype.createShader, 
		function( res, args ) {

			console.log( 'createShader', args );
			shaders.push( { shader: res, type: args[ 0 ] } );

		} 
	);


	WebGLRenderingContext.prototype.shaderSource = _h( 
		WebGLRenderingContext.prototype.shaderSource, 
		function( res, args ) {

			console.log( 'shaderSource', args );
			var s = findShader( args[ 0 ] );
			s.source = args[ 1 ];

		} 
	);

	WebGLRenderingContext.prototype.compileShader = _h( 
		WebGLRenderingContext.prototype.compileShader, 
		function( res, args ) {

			console.log( 'compileShader', args );

		} 
	);

	WebGLRenderingContext.prototype.createProgram = _h( 
		WebGLRenderingContext.prototype.createProgram, 
		function( res, args ) {

			console.log( 'createProgram', res, args );
			addProgram( this, res );

		} 
	);

	WebGLRenderingContext.prototype.attachShader = _h( 
		WebGLRenderingContext.prototype.attachShader, 
		function( res, args ) {

			console.log( 'attachShader', args );
			var p = findProgram( args[ 0 ] );
			var s = findShader( args[ 1 ] );
			p.shaders.push( s );

		} 
	);

	WebGLRenderingContext.prototype.linkProgram = _h( 
		WebGLRenderingContext.prototype.linkProgram, 
		function( res, args ) {

			console.log( 'linkProgram', args );

		} 
	);

	WebGLRenderingContext.prototype.getUniformLocation = _h( 
		WebGLRenderingContext.prototype.getUniformLocation, 
		function( res, args ) {

			uniforms.push( {
				program: args[ 0 ],
				uniform: args[ 1 ],
				location: res,
				gl: this
			} );
			console.log( 'getUniformLocation', res, args );

		} 
	);

	function findProgramByLocation( location ) {

		var f = null;

		uniforms.forEach( function( e ) {
			if( e.location === location ) {
				f = e;
			}
		} );
	
		return f;	

	}

	var methods = [ 
		'uniform1f', 'uniform1fv', 'uniform1i', 'uniform1iv', 
		'uniform2f', 'uniform2fv', 'uniform2i', 'uniform2iv', 
		'uniform3f', 'uniform3fv', 'uniform3i', 'uniform3iv', 
		'uniform4f', 'uniform4fv', 'uniform4i', 'uniform4iv', 
		'uniformMatrix2fv', 'uniformMatrix3fv', 'uniformMatrix4fv'
	];

	methods.forEach( function( f ) {

		keepReference( f );

		WebGLRenderingContext.prototype[ f ] = function() {

			var args = arguments;
			var p = findProgramByLocation( args[ 0 ] );
			if( p ) {
				var l = references.getUniformLocation.apply( p.gl, [ p.program, p.uniform ] );
				var a = [];
				a.push( l );
				for( var j = 1; j < args.length; j++ ) {
					a.push( args[ j ] );
				}
				references[ f ].apply( p.gl, a );
			}

		}

	} );

	/*WebGLRenderingContext.prototype.useProgram = _h( 
		WebGLRenderingContext.prototype.useProgram, 
		function( res, args ) {

			console.log( 'useProgram', args );

		} 
	);*/

} )();