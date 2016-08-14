(function(root, factory) {
    'use strict';
    if (typeof define === 'function' && define.amd) {
        define(['jquery','three','underscore','cannon','Backbone'], factory);
    } else if (typeof exports !== 'undefined') {
        module.exports = factory(require('jquery','three','underscore','cannon','Backbone'));
    } else {
        root.myModule = factory(root.jquery, root.three, root.underscore, root.cannon, root.Backbone);
    }
}(this, function($, THREE, _, CANNON, Backbone) {
    'use strict';

    var KingsGame = window.KingsGame || {};
    window.THREE = THREE;

    require('./../../node_modules/three/examples/js/shaders/ConvolutionShader.js');
	require('./../../node_modules/three/examples/js/shaders/CopyShader.js');
	require('./../../node_modules/three/examples/js/shaders/FilmShader.js');

	require('./../../node_modules/three/examples/js/postprocessing/EffectComposer.js');
	require('./../../node_modules/three/examples/js/postprocessing/ShaderPass.js');
	require('./../../node_modules/three/examples/js/postprocessing/MaskPass.js');
	require('./../../node_modules/three/examples/js/postprocessing/RenderPass.js');
	require('./../../node_modules/three/examples/js/postprocessing/BloomPass.js');
	require('./../../node_modules/three/examples/js/postprocessing/FilmPass.js');

    require('./../../node_modules/three/examples/js/loaders/OBJLoader.js');
    require('./../../node_modules/three/examples/js/loaders/MTLLoader.js');
    require('./../../node_modules/three/examples/js/utils/GeometryUtils.js');
    var Detector = require('./../../node_modules/three/examples/js/Detector.js');
    var LoadingScreen = require( __dirname + '/../views/loadingScreen.js');
    var GameOverScreen = require( __dirname + '/../views/gameOverScreen.js');
    var Stats = require('./../../node_modules/three/examples/js/libs/stats.min.js');

    var KingsGame = ( function() {
        function KingsGame() {
            var self = this, dataSettings;
            self.init(true);
        }
        return KingsGame;
    }());

    KingsGame.GameObject = function(parameters) {
        this.shape = parameters.shape || "box";
        this.material = parameters.material;
        this.rotation = parameters.rotation || new THREE.Vector3(0,0,0);
        this.scale = parameters.scale || new THREE.Vector3(1,1,1);
        this.position = parameters.position || new THREE.Vector3(0,0,0);
        this.direction = parameters.direction || new THREE.Vector3(0,-5,0);
        this.soundPath = parameters.soundPath || "";
        this.playSound = parameters.playSound;
        this.bounciness = parameters.bounciness || 0;
        this.modelPath = parameters.modelPath;
        this.name = parameters.name || parameters.fileName;

        var shape;
        switch (this.shape) {
            case "box": {
                shape = new CANNON.Box( new CANNON.Vec3(
                    this.scale.x/2,
                    this.scale.y/2,
                    this.scale.z/2
                ) );
                break;
            }
            case "sphere": {
                shape = new CANNON.Sphere( this.scale.x/2 );
                break;
            }
        }

        var mat = new CANNON.Material();
        this.body = new CANNON.Body({
            mass: parameters.weight,
            material: mat,
            position: new CANNON.Vec3(
                parameters.position.x,
                parameters.position.y,
                parameters.position.z
            )
        });
        this.body.addShape(shape);
        this.body.quaternion.setFromAxisAngle(new CANNON.Vec3(1,0,0), this.rotation.x*(Math.PI/180));

        if(parameters.colideEvent != null) {
            this.body.addEventListener("collide",parameters.colideEvent);
        }
        if(this.bounciness > 0) {
            var mat_ground = new CANNON.ContactMaterial(KingsGame.groundMaterial, mat, { friction: 0.3, restitution: this.bounciness });
            KingsGame.world.addContactMaterial(mat_ground);
        }
        KingsGame.world.addBody( this.body );

        if(parameters.modelPath != null) {
            var index = KingsGame.prototype.alreadyLoaded(this.name);
            if(index >= 0) {
                this.initModel(KingsGame.assets.meshes[index].clone(), false);
            } else {
                if(parameters.useMTL) {
                    this.loadObjMtl( parameters.modelPath, parameters.fileName );
                } else {
                    this.loadObj( parameters.modelPath, parameters.fileName );
                }
            }
        } else {
            var modelShape;
            switch (this.shape) {
                case "box": {
                    modelShape = new THREE.CubeGeometry(
                        this.scale.x,
                        this.scale.y,
                        this.scale.z
                    );
                    break;
                }
                case "sphere": {
                    modelShape = new THREE.SphereGeometry(this.scale.x,32,32);
                    break;
                }
            }
            if(this.material != null) {
                this.model = new THREE.Mesh( modelShape, this.material );
            } else {
                this.model = new THREE.Mesh( modelShape, KingsGame.assets.groundTexture );
            }
            this.model.position.copy( this.body.position );
            this.model.quaternion.copy( this.body.quaternion );
            this.model.receiveShadow = true;
            this.model.castShadow = true;
            if(this.soundPath != "") {
                this.bindSound(this.soundPath);
            }
            KingsGame.scene.add( this.model );
        }
    };

    KingsGame.GameObject.prototype = {
        constructor: KingsGame.GameObject,

        update: function() {
            this.position.copy( this.body.position );
            this.model.position.copy( this.body.position );
            this.model.quaternion.copy( this.body.quaternion );
            this.model.rotateX(this.rotation.x * (Math.PI / 180));
            this.model.rotateY(this.rotation.y * (Math.PI / 180));
            this.model.rotateZ(this.rotation.z * (Math.PI / 180));
            this.model.scale.x = this.scale.x;
            this.model.scale.y = this.scale.y;
            this.model.scale.z = this.scale.z;
            if(this.soundAnalyser != null) {
                if(this.modelPath != null) {
                    this.model.children[0].material.emissive.b = this.soundAnalyser.getAverageFrequency() / 256;
                } else {
                    this.model.material.emissive.b = this.soundAnalyser.getAverageFrequency() / 256;
                }
            }
        },

        initModel(object, include) {
            var add = include || true;
            this.model = object;
            this.model.name = this.name;
            this.model.castShadow = true;
            this.model.receiveShadow = true;
            if(this.soundPath != "") {
                this.bindSound(this.soundPath);
            }
            KingsGame.scene.add( this.model );
            if(add) {
                KingsGame.assets.meshes.push( this.model );
            }
            this.update();
        },

        loadObj: function(path, file) {
            var self = this;
            var objLoader = new THREE.OBJLoader(KingsGame.manager);
            objLoader.setPath( path );
            objLoader.load( file+'.obj', function ( object ) {
                object.name = file;
                object.traverse( function (child) {
                    if ( child instanceof THREE.Mesh ) {
                        var textureLoader = new THREE.TextureLoader(KingsGame.manager);
                        textureLoader.load( path+file+'.jpg',
                        	function ( texture ) {
                        		child.material = new THREE.MeshPhongMaterial({
                        			map: texture
                        		});
                        	}
                        );
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });
                self.initModel(object);
            });
        },

        loadObjMtl: function(path, file) {
            var self = this;
            var mtlLoader = new THREE.MTLLoader(KingsGame.manager);
			mtlLoader.setPath( path );
			mtlLoader.load( file+'.mtl', function( materials ) {
				materials.preload();
                var objLoader = new THREE.OBJLoader(KingsGame.manager);
                objLoader.setPath( path );
                objLoader.setMaterials( materials );
                objLoader.load( file+'.obj', function ( object ) {
                    object.name = file;
                    object.traverse( function (child) {
                        if ( child instanceof THREE.Mesh ) {
                            child.castShadow = true;
                            child.receiveShadow = true;
                        }
                    });
                    self.initModel(object);
                });
            },this.onProgress);
        },

        bindSound: function(soundPath) {
            var audioLoader = new THREE.AudioLoader( KingsGame.manager );
            this.sound = new THREE.PositionalAudio( KingsGame.listener );
            var self = this;
    		audioLoader.load( soundPath, function( buffer ) {
    			self.sound.setBuffer( buffer );
    			self.sound.setRefDistance( 10 );
                if(self.playSound) {
                    self.sound.play();
                }
    		});
    		this.model.add( this.sound );
            this.soundAnalyser = new THREE.AudioAnalyser( this.sound, 32 );
        },

        bindCollideEvent: function(func) {
            this.body.addEventListener("collide",func);
        },

        destroy: function() {
            KingsGame.scene.remove( this.model );
            KingsGame.world.removeBody ( this.body );
        }
    };

    KingsGame.Player = function(parameters) {
        KingsGame.GameObject.apply(this, arguments);

        this.STATES = {
            "iddle" : 0,
            "turningRight" : 1,
            "turningLeft" : 2,
        };
        this.state = this.STATES.iddle;
        this.mass = parameters.weight || 1;
        this.maxSteerVal = Math.PI / 8;
        this.maxSpeed = 15;
        this.maxForce = 100;
        this.turning = 0;

        var chassisShape;
        var centerOfMassAdjust = new CANNON.Vec3(0, 0, 1);
        chassisShape = new CANNON.Box(new CANNON.Vec3(1, 4, 1));
        var chassisBody = new CANNON.Body({ mass: 40 });
        chassisBody.addShape(chassisShape, centerOfMassAdjust);
        chassisBody.position.set(this.position.x, this.position.y, this.position.z);
        chassisBody.position.vadd(centerOfMassAdjust);
        KingsGame.world.removeBody(this.body);
        this.body = chassisBody;
        this.body.name = "player";

        this.vehicle = new CANNON.RigidVehicle({
            chassisBody: chassisBody
        });

        var axisWidth = 4;
        var wheelShape = new CANNON.Sphere(0.5);
        var down = new CANNON.Vec3(0, 0, -1);
        var wheelMaterial = new CANNON.Material("wheelMaterial");

        var wheelBody = new CANNON.Body({ mass: this.mass, material: wheelMaterial });
        wheelBody.addShape(wheelShape);
        this.vehicle.addWheel({
            body: wheelBody,
            position: new CANNON.Vec3(axisWidth/2, -4, 0),
            axis: new CANNON.Vec3(1, 0, 0),
            direction: down
        });

        var wheelBody = new CANNON.Body({ mass: this.mass, material: wheelMaterial });
        wheelBody.addShape(wheelShape);
        this.vehicle.addWheel({
            body: wheelBody,
            position: new CANNON.Vec3(-axisWidth/2, -4, 0),
            axis: new CANNON.Vec3(-1, 0, 0),
            direction: down
        });

        var wheelBody = new CANNON.Body({ mass: this.mass, material: wheelMaterial });
        wheelBody.addShape(wheelShape);
        this.vehicle.addWheel({
            body: wheelBody,
            position: new CANNON.Vec3(axisWidth/2, 4, 0),
            axis: new CANNON.Vec3(1, 0, 0),
            direction: down
        });

        var wheelBody = new CANNON.Body({ mass: this.mass, material: wheelMaterial });
        wheelBody.addShape(wheelShape);
        this.vehicle.addWheel({
            body: wheelBody,
            position: new CANNON.Vec3(-axisWidth/2, 4, 0),
            axis: new CANNON.Vec3(-1, 0, 0),
            direction: down
        });

        if(parameters.colideEvent != null) {
            this.body.addEventListener("collide",parameters.colideEvent);
        }
        for(var i=0; i<this.vehicle.wheelBodies.length; i++){
            this.vehicle.wheelBodies[i].angularDamping = 0.4;
            this.vehicle.wheelBodies[i].name = "wheel";
            if(parameters.colideEvent != null) {
                this.vehicle.wheelBodies[i].addEventListener("collide",parameters.colideEvent);
            }
        }

        this.vehicle.addToWorld(KingsGame.world);
    };

    KingsGame.Player.prototype = Object.create(KingsGame.GameObject.prototype);

    KingsGame.Player.prototype.constructor = KingsGame.Player;

    KingsGame.Player.prototype.update = function() {
        KingsGame.GameObject.prototype.update.call(this);
        for (var i = 0; i < this.model.children.length; i++) {
            if(
                this.model.children[i].name == "Car_Con_Box_Cube.014" ||
                this.model.children[i].name == "Front_Wheel_Force_1_L_Front_Wheel_Force" ||
                this.model.children[i].name == "Front_Wheel_Force_1_R_Front_Wheel_Force.001" ||
                this.model.children[i].name == "Back_Wheel_Force_1_R_Back_Wheel_Force.001" ||
                this.model.children[i].name == "Back_Wheel_Force_1_L_Back_Wheel_Force"
            ){
                this.model.children[i].visible = false;
            }
            if(this.model.children[i].name == "Front_Steering_Mesh_2_R_Cube.004") { //front right wheel
                this.model.children[i].geometry.center();
                this.model.children[i].position.set(1.3,0.6,-2.55);
                this.model.children[i].geometry.rotateX(-this.vehicle.getWheelSpeed(0)*(Math.PI/180));
                this.model.children[i].rotation.set(this.vehicle.getWheelSpeed(0)*(Math.PI/180),0,0);
                this.model.children[i].rotateOnAxis(new THREE.Vector3(0,1,0),-this.turning*(Math.PI/180));
                this.model.children[i].rotation.set(0,-this.turning*(Math.PI/180),0);
            }
            if(this.model.children[i].name == "Front_Wheel_Mesh_1_R_Cube.005") { //front right wheel
                this.model.children[i].geometry.center();
                this.model.children[i].position.set(1.3,0.6,-2.65);
                this.model.children[i].rotateOnAxis(new THREE.Vector3(0,1,0),-this.turning*(Math.PI/180));
                this.model.children[i].rotation.set(0,-this.turning*(Math.PI/180),0);
            }
            if(this.model.children[i].name == "Front_Wheel_Mesh_2_L_Cube.009") { //front left wheel
                this.model.children[i].geometry.center();
                this.model.children[i].position.set(-1.3,0.6,-2.55);
                this.model.children[i].geometry.rotateX(this.vehicle.getWheelSpeed(1)*(Math.PI/180));
                this.model.children[i].rotation.set(-this.vehicle.getWheelSpeed(1)*(Math.PI/180),0,0);
                this.model.children[i].rotateOnAxis(new THREE.Vector3(0,1,0),-this.turning*(Math.PI/180));
                this.model.children[i].rotation.set(0,-this.turning*(Math.PI/180),0);
            }
            if(this.model.children[i].name == "Front_Steering_Mesh_1_L_Cube.010") { //front right wheel
                this.model.children[i].geometry.center();
                this.model.children[i].position.set(-1.3,0.6,-2.65);
                this.model.children[i].rotateOnAxis(new THREE.Vector3(0,1,0),-this.turning*(Math.PI/180));
                this.model.children[i].rotation.set(0,-this.turning*(Math.PI/180),0);
            }
            if(this.model.children[i].name == "Back_Wheel_Mesh_1_L_Cube.002") { //back right wheel
                this.model.children[i].geometry.center();
                this.model.children[i].geometry.translate(-1.6,0.6,2.2);
                this.model.children[i].geometry.rotateX(-this.vehicle.getWheelSpeed(2)*(Math.PI/180));
                this.model.children[i].rotation.set(this.vehicle.getWheelSpeed(2)*(Math.PI/180),0,0);
            }
            if(this.model.children[i].name == "Back_Wheel_Mesh_1_R_Cube.003") { //back left wheel
                this.model.children[i].geometry.center();
                this.model.children[i].geometry.translate(1.6,0.6,2.2);
                this.model.children[i].geometry.rotateX(this.vehicle.getWheelSpeed(3)*(Math.PI/180));
                this.model.children[i].rotation.set(-this.vehicle.getWheelSpeed(3)*(Math.PI/180),0,0);
            }
        }
        switch (this.state) {
        case this.STATES.iddle:
            if(this.turning < 0) {
                this.turning+=5;
            }
            if(this.turning > 0) {
                this.turning-=5;
            }
            break;
        case this.STATES.turningRight:
            if(this.turning < 35) {
                this.turning+=5;
            }
            break;
        case this.STATES.turningLeft:
            if(this.turning > -35) {
                this.turning-=5;
            }
            break;
        }
    };

    KingsGame.Player.prototype.getDirection = function() {
        var temp = new THREE.Vector3();
        temp.copy(this.direction);
        temp.applyQuaternion(this.body.quaternion);
        return temp;
    };

    KingsGame.Player.prototype.reset = function() {
        // Position
        this.body.position.setZero();
        this.body.previousPosition.setZero();
        this.body.interpolatedPosition.setZero();
        this.body.initPosition.setZero();

        // orientation
        this.body.quaternion.set(0,0,0,1);
        this.body.initQuaternion.set(0,0,0,1);
        this.body.interpolatedQuaternion.set(0,0,0,1);

        // Velocity
        this.body.velocity.setZero();
        this.body.initVelocity.setZero();
        this.body.angularVelocity.setZero();
        this.body.initAngularVelocity.setZero();

        // Force
        this.body.force.set(0,0,300);
        this.body.torque.setZero();

        // Sleep state reset
        this.body.sleepState = 0;
        this.body.timeLastSleepy = 0;
        this.body._wakeUpAfterNarrowphase = false;

        for(var i=0; i<this.vehicle.wheelBodies.length; i++){
            this.vehicle.wheelBodies[i];
            // Position
            this.vehicle.wheelBodies[i].position.setZero();
            this.vehicle.wheelBodies[i].previousPosition.setZero();
            this.vehicle.wheelBodies[i].interpolatedPosition.setZero();
            this.vehicle.wheelBodies[i].initPosition.setZero();

            // orientation
            this.vehicle.wheelBodies[i].quaternion.set(0,0,0,1);
            this.vehicle.wheelBodies[i].initQuaternion.set(0,0,0,1);
            this.vehicle.wheelBodies[i].interpolatedQuaternion.set(0,0,0,1);

            // Velocity
            this.vehicle.wheelBodies[i].velocity.setZero();
            this.vehicle.wheelBodies[i].initVelocity.setZero();
            this.vehicle.wheelBodies[i].angularVelocity.setZero();
            this.vehicle.wheelBodies[i].initAngularVelocity.setZero();

            // Force
            this.vehicle.wheelBodies[i].force.setZero();
            this.vehicle.wheelBodies[i].torque.setZero();

            // Sleep state reset
            this.vehicle.wheelBodies[i].sleepState = 0;
            this.vehicle.wheelBodies[i].timeLastSleepy = 0;
            this.vehicle.wheelBodies[i]._wakeUpAfterNarrowphase = false;
        }
    };

    KingsGame.ParticleSystem = function(parameters){
        this.sistemType = parameters.sistemType || "rain";
        this.keepAlive = parameters.keepAlive;
        this.gravity = parameters.gravity || new THREE.Vector3();
        this.position = parameters.position || new THREE.Vector3();
        this.size = parameters.size || 1;
        this.radius = parameters.radius || 5;
        this.fountainHeight = parameters.fountainHeight || 5;
        this.particleLife = parameters.particleLife || -1;
        this.particleCount = parameters.particleCount || 100;
        this.deadParticles = 0;

        var particles = new THREE.Geometry(),
        pMaterial = new THREE.PointsMaterial({
            color: 0xFFFFFF,
            size: this.size,
            map: KingsGame.assets.particleTexture,
            blending: THREE.AdditiveBlending,
            transparent: true,
            depthWrite: false
        });

        for (var p = 0; p < this.particleCount; p++) {
            var particle;
            switch (this.sistemType) {
                case "rain": {
                    var pX = Math.random() * (this.radius*2) - this.radius;
                    var pY = Math.random() * (this.radius*2) - this.radius;
                    var pZ = Math.random() * (this.radius*2) - this.radius;
                    particle = new THREE.Vector3(this.position.x + pX, this.position.y + pY, this.position.z + pZ);
                    break;
                }
                case "fountain": {
                    particle = new THREE.Vector3(this.position.x, this.position.y, this.position.z);
                    var pX = Math.random() * (this.radius*2) - this.radius;
                    var pY = Math.random() * (this.radius*2) - this.radius;
                    var pZ = this.fountainHeight * ((Math.random() * 10 - 1) / 10);
                    particle.velocity = new THREE.Vector3(pX,pY,pZ);
                    break;
                }
                case "explosion": {
                    particle = new THREE.Vector3(this.position.x, this.position.y, this.position.z);
                    var pX = Math.random() * (this.radius*2) - this.radius;
                    var pY = Math.random() * (this.radius*2) - this.radius;
                    var pZ = Math.random() * (this.radius*2) - this.radius;
                    particle.velocity = new THREE.Vector3(pX,pY,pZ);
                    break;
                }
            }
            particle.active = true;
            particle.life = this.particleLife;
            particles.vertices.push(particle);
        }

        this.particleSystem = new THREE.Points(particles,pMaterial);
        this.particleSystem.sortParticles = true;
        KingsGame.scene.add(this.particleSystem);
    };

    KingsGame.ParticleSystem.prototype = {
        constructor: KingsGame.ParticleSystem,

        update: function() {
            switch (this.sistemType) {
                case "rain": {
                    var pCount = this.particleCount;
                    while (pCount--) {
                        var particle = this.particleSystem.geometry.vertices[pCount];
                        if (particle.z < -20) {
                            particle.z = this.position.z;
                        }
                        particle.z -= Math.random() * .1;
                    }
                    break;
                }
                case "fountain": {
                    var pCount = this.particleCount;
                    while (pCount--) {
                        var particle = this.particleSystem.geometry.vertices[pCount];
                        if (particle.z < -30) {
                            if(this.keepAlive) {
                                particle.copy(this.position);
                                var pX = Math.random() * (this.radius*2) - this.radius;
                                var pY = Math.random() * (this.radius*2) - this.radius;
                                var pZ = this.fountainHeight * ((Math.random() * 10 - 1) / 10);
                                particle.velocity = new THREE.Vector3(pX,pY,pZ);
                            } else {
                                if(particle.active) {
                                    particle.active = false;
                                    this.deadParticles++;
                                }
                                if(this.deadParticles == this.particleCount) {
                                    this.destroy();
                                }
                            }
                        }
                        particle.velocity.add(this.gravity);
                        particle.add(particle.velocity);
                    }
                    break;
                }
                case "explosion": {
                    var pCount = this.particleCount;
                    while (pCount--) {
                        var particle = this.particleSystem.geometry.vertices[pCount];
                        if (particle.z < -20) {
                            particle.z = this.position.z;
                        }
                        particle.z -= Math.random() * .1;
                        particle.add(this.gravity);
                    }
                    break;
                }
            }
            this.particleSystem.geometry.__dirtyVertices = true;
            this.particleSystem.geometry.verticesNeedUpdate = true;
        },

        destroy: function() {
            KingsGame.scene.remove(this.particleSystem);
        },
    };

    KingsGame.RoadSection = function(parameters) {
        this.id = parameters.id;
        this.position = parameters.position || new CANNON.Vec3();
        this.size = parameters.size || new CANNON.Vec3(25,50,0.05);
        this.hazard = parameters.hazard || KingsGame.HAZARDS.plain;
        this.dificulty = parameters.dificulty || KingsGame.DIFICULTY.easy;

        if(this.hazard == KingsGame.HAZARDS.pit) {
            var pos = this.position.clone();
            var length = (this.size.y/3)*2;
            this.groundBody = new CANNON.Body({
                mass: 0,
                position: pos.vadd(0,length,0),
                material: KingsGame.groundMaterial
            });
            var groundShape = new CANNON.Box( new CANNON.Vec3(
                this.size.x,
                length,
                this.size.z
            ) );
            this.groundBody.addShape( groundShape );
            KingsGame.world.addBody( this.groundBody );

            var geometry = new THREE.PlaneGeometry( this.size.x * 2, length * 2 );
            this.mesh = new THREE.Mesh( geometry, KingsGame.assets.groundTexture );
            this.mesh.position.copy( this.groundBody.position );
            this.mesh.quaternion.copy( this.groundBody.quaternion );
            this.mesh.receiveShadow = true;
            KingsGame.scene.add( this.mesh );
        } else {
            this.groundBody = new CANNON.Body({
                mass: 0,
                position: this.position,
                material: KingsGame.groundMaterial
            });
            var groundShape = new CANNON.Box( this.size );
            this.groundBody.addShape( groundShape );
            KingsGame.world.addBody( this.groundBody );

            var geometry = new THREE.PlaneGeometry( this.size.x * 2, this.size.y * 2 );
            this.mesh = new THREE.Mesh( geometry, KingsGame.assets.groundTexture );
            this.mesh.position.copy( this.groundBody.position );
            this.mesh.quaternion.copy( this.groundBody.quaternion );
            this.mesh.receiveShadow = true;
            KingsGame.scene.add( this.mesh );
        }

        this.background = new THREE.Mesh( new THREE.PlaneGeometry( 400, this.size.y * 2 ), KingsGame.assets.lavaMaterial );
        this.background.position.set(
            this.position.x,
            this.position.y,
            this.position.z - 5
        );
        this.background.receiveShadow = true;
        KingsGame.scene.add( this.background );

        this.initHazards();
    };

    KingsGame.RoadSection.prototype = {
        constructor: KingsGame.RoadSection,

        placeBumper: function(pos) {
            this.gameobjects.push(new KingsGame.GameObject({
                modelPath: './assets/models/crate/',
                fileName: 'crate',
                useMTL: true,
                position: pos.add(new THREE.Vector3(0,0,2)),
                scale: new THREE.Vector3(3,3,3),
                weight: 0,
                colideEvent: KingsGame.prototype.bumper
            }));
        },

        placeRamp: function(ancho) {
            var posX = Math.floor(Math.random() * 4) + 0;
            this.gameobjects.push(new KingsGame.GameObject({
                position: this.position.vadd(new CANNON.Vec3(((posX - 2) * 6),this.size.y,0)),
                scale: new THREE.Vector3(ancho,22,0.1),
                rotation: new THREE.Vector3(-15,0,0),
                weight: 0,
                name: "ramp"
            }));
            this.gameobjects.push(new KingsGame.GameObject({
                position: this.position.vadd(new CANNON.Vec3(((posX - 2) * 6),this.size.y + 5,0.01)),
                scale: new THREE.Vector3(ancho,10,0.1),
                weight: 0,
                name: "ramp",
                material: KingsGame.assets.acceleratorTexture,
                colideEvent: function(e) {
                    if(e.body.name == "player" || e.body.name == "wheel") {
                        var dir = KingsGame.gameobjects.player.getDirection();
                        var vel = new CANNON.Vec3(
                            dir.x,
                            dir.y,
                            dir.z
                        );
                        vel.normalize();
                        vel = vel.scale(50);
                        KingsGame.gameobjects.player.body.angularVelocity.set(0,0,0);
                        KingsGame.gameobjects.player.body.inertia.set(0,0,0);
                        KingsGame.gameobjects.player.body.velocity.copy(vel);
                    }
                }
            }));
        },

        placeMeteorite: function() {
            var pX = Math.random() * (this.size.x*2) - this.size.x;
            var pY = Math.random() * (this.size.y*2) - this.size.y;
            var pZ = 20;
            var position = new THREE.Vector3(this.position.x + pX, this.position.y + pY, this.position.z + pZ);
            var father = this;
            var self = new KingsGame.GameObject({
                position: position,
                scale: new THREE.Vector3(1,1,1),
                weight: 20,
                shape: "sphere",
                material: KingsGame.assets.lavaMaterial,
                soundPath: './assets/sounds/explosion.mp3',
                playSound: false,
                material: new THREE.MeshPhongMaterial( {
                    color: 0xffaa00,
                    shading: THREE.FlatShading,
                    shininess: 10
                } )
            });
            self.bindCollideEvent(function(e) {
                father.particleSystems.push( new KingsGame.ParticleSystem({
                    sistemType: "fountain",
                    fountainHeight: 1,
                    position: self.position,
                    gravity: new THREE.Vector3(0,0,-0.08),
                    particleCount: 300,
                    radius: 1,
                    keepAlive: false,
                    size: 3
                }));
                var distance = KingsGame.gameobjects.player.position.distanceTo( e.contact.bi.position );
                if(distance < 10) {
                    var dx = e.contact.bi.position.x - KingsGame.gameobjects.player.position.x;
                    var dy = e.contact.bi.position.y - KingsGame.gameobjects.player.position.y;
                    var dz = e.contact.bi.position.z - KingsGame.gameobjects.player.position.z;

                    var worldPoint = new CANNON.Vec3(0,0,0);
                    var impulse = new CANNON.Vec3(dx,dy,dz);
                    impulse.normalize();
                    impulse = impulse.scale(40/distance);
                    KingsGame.gameobjects.player.body.applyImpulse(impulse,worldPoint);
                }
                self.sound.play();
                self.destroy();
            });
            this.gameobjects.push( self );
        },

        initHazards: function() {
            this.gameobjects = [];
            this.particleSystems = [];
            switch (this.hazard) {
                case KingsGame.HAZARDS.bumpers: {
                    switch (this.dificulty) {
                        case KingsGame.DIFICULTY.easy: {
                            var rand = Math.floor(Math.random() * 4) + 0;
                            this.placeBumper(new THREE.Vector3(
                                this.position.x + ((rand - 2) * 6),
                                this.position.y,
                                this.position.z
                            ));
                            break;
                        }
                        case KingsGame.DIFICULTY.medium: {
                            var randx = Math.floor(Math.random() * 4) + 0;
                            var randy = Math.floor(Math.random() * 4) + 0;
                            this.placeBumper(new THREE.Vector3(
                                this.position.x + ((randx - 2) * 6),
                                this.position.y + ((randy - 2) * 12),
                                this.position.z
                            ));
                            var done = false
                            while(!done) {
                                var randx2 = Math.floor(Math.random() * 4) + 0;
                                if(randx2 != randx) {
                                    done = true;
                                }
                            }
                            var randy2 = Math.floor(Math.random() * 4) + 0;
                            this.placeBumper(new THREE.Vector3(
                                this.position.x + ((randx2 - 2) * 6),
                                this.position.y + ((randy2 - 2) * 12),
                                this.position.z
                            ));
                            break;
                        }
                        case KingsGame.DIFICULTY.hard: {
                            break;
                        }
                    }
                    break;
                }
                case KingsGame.HAZARDS.accelerator: {
                    switch (this.dificulty) {
                        case KingsGame.DIFICULTY.easy: {
                            break;
                        }
                        case KingsGame.DIFICULTY.medium: {
                            break;
                        }
                        case KingsGame.DIFICULTY.hard: {
                            break;
                        }
                    }
                    break;
                }
                case KingsGame.HAZARDS.pit: {
                    switch (this.dificulty) {
                        case KingsGame.DIFICULTY.easy: {
                            this.placeRamp(25);
                            break;
                        }
                        case KingsGame.DIFICULTY.medium: {
                            this.placeRamp(16);
                            break;
                        }
                        case KingsGame.DIFICULTY.hard: {
                            this.placeRamp(8);
                            break;
                        }
                    }
                    break;
                }
                case KingsGame.HAZARDS.meteorites: {
                    switch (this.dificulty) {
                        case KingsGame.DIFICULTY.easy: {
                            break;
                        }
                        case KingsGame.DIFICULTY.medium: {
                            break;
                        }
                        case KingsGame.DIFICULTY.hard: {
                            break;
                        }
                    }
                    break;
                }
            }
        },

        update: function() {
            switch (this.hazard) {
                case KingsGame.HAZARDS.bumpers: {
                    if(this.dificulty == KingsGame.DIFICULTY.hard) {

                    }
                    break;
                }
                case KingsGame.HAZARDS.meteorites: {
                    var delta = KingsGame.clock.getDelta();
                    if(this.pastTime == null) {
                        this.pastTime = 0;
                        this.actualTime = delta;
                    }
                    switch (this.dificulty) {
                        case KingsGame.DIFICULTY.easy: {
                            if(this.actualTime > this.pastTime + 1) {
                                for (var i = 0; i < 1; i++) {
                                    this.placeMeteorite();
                                }
                                this.pastTime = this.actualTime;
                            }
                            break;
                        }
                        case KingsGame.DIFICULTY.medium: {
                            if(this.actualTime > this.pastTime + 0.5) {
                                for (var i = 0; i < 2; i++) {
                                    this.placeMeteorite();
                                }
                                this.pastTime = this.actualTime;
                            }
                            break;
                        }
                        case KingsGame.DIFICULTY.hard: {
                            if(this.actualTime > this.pastTime + 0.2) {
                                for (var i = 0; i < 2; i++) {
                                    this.placeMeteorite();
                                }
                                this.pastTime = this.actualTime;
                            }
                            break;
                        }
                    }
                }
                this.actualTime += delta;
            }
            var elements = _.toArray(this.gameobjects);
            for (var i = 0; i < elements.length; i++) {
                if(elements[i].name != "ramp") {
                    elements[i].update();
                }
            }
            var elements = _.toArray(this.particleSystems);
            for (var i = 0; i < elements.length; i++) {
                if(elements[i].name != "ramp") {
                    elements[i].update();
                }
            }
        },

        destroy: function() {
            KingsGame.scene.remove( this.background );
            KingsGame.scene.remove( this.mesh );
            KingsGame.world.removeBody ( this.groundBody );
            for (var i = 0; i < this.gameobjects.length; i++) {
                this.gameobjects[i].destroy();
            }
            for (var i = 0; i < this.particleSystems.length; i++) {
                this.particleSystems[i].destroy();
            }
        },
    };

    KingsGame.Road = function() {
        this.road = [];
        for (var i = 0; i < 4; i++) {
            if(i>1) {
                this.road.push(new KingsGame.RoadSection({
                    id: i,
                    position: new CANNON.Vec3( 0, i * -100, -10 ),
                    hazard: KingsGame.HAZARDS.meteorites,
                    dificulty: KingsGame.DIFICULTY.easy
                }));
            } else {
                this.road.push(new KingsGame.RoadSection({
                    id: i,
                    position: new CANNON.Vec3( 0, i * -100, -10 )
                }));
            }
        }
    };

    KingsGame.Road.prototype = {
        constructor: KingsGame.Road,

        update: function() {
            var index = this.locatePlayer();
            if(index > this.road.length - 3) {
                var _hazard;
                if( this.road[3].hazard != KingsGame.HAZARDS.pit &&
                    this.road[2].hazard != KingsGame.HAZARDS.pit &&
                    this.road[1].hazard != KingsGame.HAZARDS.pit) {
                    _hazard = KingsGame.HAZARDS.pit;
                } else if (this.road[3].hazard == KingsGame.HAZARDS.pit) {
                    _hazard = KingsGame.HAZARDS.plain;
                } else {
                    var rand = Math.floor(Math.random() * 10) + 0;
                    if(rand < 6) {
                        _hazard = KingsGame.HAZARDS.meteorites;
                    } else {
                        _hazard = KingsGame.HAZARDS.bumpers;
                    }
                }
                this.road.push(new KingsGame.RoadSection({
                    id: this.road[3].id + 1,
                    position: new CANNON.Vec3( 0, (this.road[3].id + 1) * -100, -10 ),
                    hazard: _hazard,
                    dificulty: Math.floor(Math.random() * 2) + 0
                }));
                this.road[0].destroy();
                this.road.splice(0,1);
            }
            for (var i = 0; i < this.road.length; i++) {
                this.road[i].update();
            }
        },

        destroy: function() {
            for (var i = 0; i < this.road.length; i++) {
                this.road[i].destroy();
            }
        },

        locatePlayer: function() {
            for (var i = 0; i < this.road.length; i++) {
                if(
                    (
                        KingsGame.gameobjects.player.position.x > (this.road[i].position.x - this.road[i].size.x) &&
                        KingsGame.gameobjects.player.position.x < (this.road[i].position.x + this.road[i].size.x)
                    ) && (
                        KingsGame.gameobjects.player.position.y > (this.road[i].position.y - this.road[i].size.y) &&
                        KingsGame.gameobjects.player.position.y < (this.road[i].position.y + this.road[i].size.y)
                    )
                ) {
                    return i;
                }
            }
        },

        insideRoad(position) {
            if((position.x > -25 && position.x < 25) && (position.z > -15)) {
                return true;
            }
            return false;
        },
    };

    KingsGame.prototype.updatePhysics = function () {
        KingsGame.world.step( KingsGame.timeStep, KingsGame.elapsedTime, 10 );
    };

    KingsGame.prototype.update = function () {
        KingsGame.prototype.updatePhysics();
        var elements = _.toArray(KingsGame.gameobjects);
        for (var i = 0; i < elements.length; i++) {
            elements[i].update();
        }
        if( KingsGame.road.insideRoad(KingsGame.gameobjects.player.position) ) {
            KingsGame.fireBall.position.y = Math.min(KingsGame.gameobjects.player.position.y+100,KingsGame.fireBall.position.y);
            KingsGame.score = Math.max(Math.floor((KingsGame.gameobjects.player.position.y * -1) / 10), KingsGame.score);
            puntuacion.innerHTML = KingsGame.score;
            KingsGame.road.update();
            KingsGame.sky.position.set(
                KingsGame.gameobjects.player.position.x,
                KingsGame.gameobjects.player.position.y,
                0
            );
            switch (KingsGame.camera.type) {
                case KingsGame.CAMERA_TYPES.firstPerson: {
                    var fixedVec = new THREE.Vector3(0,-1.5,1.5);
                    fixedVec.applyQuaternion(KingsGame.gameobjects.player.body.quaternion);
                    fixedVec.add(KingsGame.gameobjects.player.position);
                    KingsGame.camera.position.set( fixedVec.x, fixedVec.y, fixedVec.z );
                    fixedVec.add(KingsGame.gameobjects.player.getDirection());
                    KingsGame.camera.lookAt(fixedVec);
                    var up = new THREE.Vector3(0,1,0);
                    up.applyQuaternion(KingsGame.gameobjects.player.model.quaternion);
                    KingsGame.camera.up.copy(up);
                    break;
                }
                case KingsGame.CAMERA_TYPES.thirdPerson: {
                    var fixedVec = new THREE.Vector3(0,0,3);
                    fixedVec.applyQuaternion(KingsGame.gameobjects.player.body.quaternion);
                    fixedVec.add(KingsGame.gameobjects.player.position);
                    fixedVec.add(KingsGame.gameobjects.player.getDirection().negate());
                    KingsGame.camera.position.set( fixedVec.x, fixedVec.y, fixedVec.z );
                    KingsGame.camera.lookAt(KingsGame.gameobjects.player.position);
                    KingsGame.camera.up.set(0,0,1);
                    break;
                }
                case KingsGame.CAMERA_TYPES.upView: {
                    var fixedVec = KingsGame.gameobjects.player.position.clone();
                    fixedVec.applyQuaternion(KingsGame.gameobjects.player.body.quaternion);
                    KingsGame.camera.position.set(
                        KingsGame.gameobjects.player.position.x,
                        KingsGame.gameobjects.player.position.y - 14,
                        KingsGame.gameobjects.player.position.z + 30
                    );
                    var vec = new THREE.Vector3(
                        KingsGame.gameobjects.player.position.x,
                        KingsGame.gameobjects.player.position.y - 15,
                        KingsGame.gameobjects.player.position.z
                    );
                    KingsGame.camera.lookAt(vec);
                    KingsGame.camera.up.set(0,0,1);
                    break;
                }
            }
        } else {
            if(KingsGame.gameobjects.player.position.z < -15 && KingsGame.rain == null) {
                KingsGame.rain = new KingsGame.ParticleSystem({
                    sistemType: "fountain",
                    fountainHeight: 2,
                    position: KingsGame.gameobjects.player.position.clone(),
                    gravity: new THREE.Vector3(0,0,-0.08),
                    particleCount: 300,
                    radius: 0.5,
                    keepAlive: false,
                    size: 5
                });
            }
            if(KingsGame.rain != null) {
                KingsGame.rain.update();
                KingsGame.camera.lookAt(KingsGame.rain.position);
            }else {
                KingsGame.camera.lookAt(KingsGame.gameobjects.player.position);
            }
        }
        KingsGame.dirLight.position.set(
            KingsGame.gameobjects.player.position.x,
            KingsGame.gameobjects.player.position.y - 5,
            KingsGame.gameobjects.player.position.z + 20
        );
        KingsGame.dirLight.target.position.copy(KingsGame.gameobjects.player.position);
        KingsGame.dirLight.shadow.camera.updateProjectionMatrix();
    };

    KingsGame.prototype.render = function () {
        requestAnimationFrame( KingsGame.prototype.render );
        KingsGame.stats.update();

        KingsGame.actualTime += KingsGame.clock.getDelta();
        KingsGame.elapsedTime = KingsGame.actualTime - KingsGame.pastTime;
        KingsGame.pastTime = KingsGame.actualTime;
        KingsGame.lag += KingsGame.elapsedTime;
        //while (KingsGame.lag >= KingsGame.MS_PER_UPDATE) {
            console.log(KingsGame.lag);
            if(!KingsGame.paused) {
                KingsGame.prototype.update();
            }
            KingsGame.lag -= KingsGame.MS_PER_UPDATE;
        //}
        if(KingsGame.ready) {
            Backbone.trigger( 'done' );
        }
        var delta = 5 * KingsGame.clock.getDelta();
		KingsGame.assets.lavaUniforms.time.value += 0.2 * delta;
        KingsGame.renderer.clear();
        KingsGame.composer.render( delta );
    };

    KingsGame.prototype.lockPointer = function() {
        var havePointerLock = 'pointerLockElement' in document || 'mozPointerLockElement' in document || 'webkitPointerLockElement' in document;
        if ( havePointerLock ) {
            var element = document.body;
            var pointerlockchange = function ( event ) {
                if ( document.pointerLockElement === element || document.mozPointerLockElement === element || document.webkitPointerLockElement === element ) {
                    blocker.style.display = 'none';
                    scoreContainer.style.display = "box";
                    scoreContainer.style.display = '-webkit-box';
                    scoreContainer.style.display = '-moz-box';
                    KingsGame.paused = false;
                } else {
                    blocker.style.display = '-webkit-box';
                    blocker.style.display = '-moz-box';
                    blocker.style.display = 'box';
                    instructions.style.display = '';
                    scoreContainer.style.display = "none";
                    KingsGame.paused = true;
                }
            };
            var pointerlockerror = function ( event ) {
                instructions.style.display = '';
            };
            // Hook pointer lock state change events
            document.addEventListener( 'pointerlockchange', pointerlockchange, false );
            document.addEventListener( 'mozpointerlockchange', pointerlockchange, false );
            document.addEventListener( 'webkitpointerlockchange', pointerlockchange, false );
            document.addEventListener( 'pointerlockerror', pointerlockerror, false );
            document.addEventListener( 'mozpointerlockerror', pointerlockerror, false );
            document.addEventListener( 'webkitpointerlockerror', pointerlockerror, false );
            instructions.addEventListener( 'click', function ( event ) {
                scoreContainer.style.display = "box";
                instructions.style.display = 'none';
                if( KingsGame.pointerLocked ) {
                    // Ask the browser to lock the pointer
                    element.requestPointerLock = element.requestPointerLock || element.mozRequestPointerLock || element.webkitRequestPointerLock;
                    if ( /Firefox/i.test( navigator.userAgent ) ) {
                        var fullscreenchange = function ( event ) {
                            if ( document.fullscreenElement === element || document.mozFullscreenElement === element || document.mozFullScreenElement === element ) {
                                document.removeEventListener( 'fullscreenchange', fullscreenchange );
                                document.removeEventListener( 'mozfullscreenchange', fullscreenchange );
                                element.requestPointerLock();
                            }
                        };
                        document.addEventListener( 'fullscreenchange', fullscreenchange, false );
                        document.addEventListener( 'mozfullscreenchange', fullscreenchange, false );
                        element.requestFullscreen = element.requestFullscreen || element.mozRequestFullscreen || element.mozRequestFullScreen || element.webkitRequestFullscreen;
                        element.requestFullscreen();
                    } else {
                        element.requestPointerLock();
                    }
                } else {
                    blocker.style.display = 'none';
                    scoreContainer.style.display = "box";
                    scoreContainer.style.display = '-webkit-box';
                    scoreContainer.style.display = '-moz-box';
                    KingsGame.paused = false;
                }
            }, false );
        } else {
            instructions.innerHTML = 'Your browser doesn\'t seem to support Pointer Lock API';
        }
    };

    KingsGame.prototype.onWindowResize = function() {
        KingsGame.assets.lavaUniforms.resolution.value.x = window.innerWidth;
		KingsGame.assets.lavaUniforms.resolution.value.y = window.innerHeight;
        KingsGame.camera.aspect = window.innerWidth / window.innerHeight;
        KingsGame.camera.updateProjectionMatrix();
        KingsGame.renderer.setSize( window.innerWidth, window.innerHeight );
        KingsGame.composer.reset();
    }

    KingsGame.prototype.onMouseMove = function( event ) {
        //
    }

    KingsGame.prototype.keyHandler = function(event) {
        var up = (event.type == 'keyup');

        if(!up && event.type !== 'keydown')
            return;

        switch(event.keyCode){

        case 87: // w
        case 38: // forward
            KingsGame.gameobjects.player.vehicle.setWheelForce(up ? 0 : KingsGame.gameobjects.player.maxForce, 2);
            KingsGame.gameobjects.player.vehicle.setWheelForce(up ? 0 : -KingsGame.gameobjects.player.maxForce, 3);
            break;
        case 83: // s
        case 40: // backward
            KingsGame.gameobjects.player.vehicle.setWheelForce(up ? 0 : -KingsGame.gameobjects.player.maxForce, 2);
            KingsGame.gameobjects.player.vehicle.setWheelForce(up ? 0 : KingsGame.gameobjects.player.maxForce, 3);
            break;
        case 65: // a
        case 37: // left
            KingsGame.gameobjects.player.vehicle.setSteeringValue(up ? 0 : KingsGame.gameobjects.player.maxSteerVal, 0);
            KingsGame.gameobjects.player.vehicle.setSteeringValue(up ? 0 : KingsGame.gameobjects.player.maxSteerVal, 1);
            break;
        case 68: // d
        case 39: // right
            KingsGame.gameobjects.player.vehicle.setSteeringValue(up ? 0 : -KingsGame.gameobjects.player.maxSteerVal, 0);
            KingsGame.gameobjects.player.vehicle.setSteeringValue(up ? 0 : -KingsGame.gameobjects.player.maxSteerVal, 1);
            break;
        case 66:
            KingsGame.gameobjects.player.vehicle.disableMotor(up ? 0 : -KingsGame.gameobjects.player.maxForce, 2);
            KingsGame.gameobjects.player.vehicle.disableMotor(up ? 0 : KingsGame.gameobjects.player.maxForce, 3);
            break;
        }
    };

    KingsGame.prototype.onKeyDown = function( event ) {
        KingsGame.prototype.keyHandler( event );
        switch(event.keyCode){

        case 67: // c
            var elements = _.toArray(KingsGame.CAMERA_TYPES);
            if (KingsGame.camera.type < elements.length - 1 ) {
                KingsGame.camera.type++;
            } else {
                KingsGame.camera.type = 0;
            }
            break;

        case 82: //r
            KingsGame.prototype.restart();
            break;

        case 39: // right
        case 68: // d
            KingsGame.gameobjects.player.state = KingsGame.gameobjects.player.STATES.turningRight;
            //KingsGame.gameobjects.player.body.angularVelocity.set(0,0,1);
            break;

        case 37: // left
        case 65: // a
            KingsGame.gameobjects.player.state = KingsGame.gameobjects.player.STATES.turningLeft;
            //KingsGame.gameobjects.player.body.angularVelocity.set(0,0,-1);
            break;
        }
    };

    KingsGame.prototype.onKeyUp = function( event ) {
        KingsGame.prototype.keyHandler( event );
        switch(event.keyCode){
        case 39: // right
        case 37: // left
        case 68: // d
        case 65: // a
            KingsGame.gameobjects.player.state = KingsGame.gameobjects.player.STATES.iddle;
            //KingsGame.gameobjects.player.body.angularVelocity.set(0,0,0);
            break;
        }
    };

    KingsGame.prototype.bindSoundToMesh = function(mesh, soundPath) {
        var audioLoader = new THREE.AudioLoader();
        var sound = new THREE.PositionalAudio( KingsGame.listener );
		audioLoader.load( soundPath, function( buffer ) {
			sound2.setBuffer( buffer );
			sound2.setRefDistance( 20 );
			sound2.play();
		});
		mesh.add( sound );
    };

    KingsGame.prototype.initLoadManager = function() {
        KingsGame.manager = new THREE.LoadingManager();
        KingsGame.manager.onProgress = function(item, loaded, total) {
            var percentComplete = loaded / total * 100;
            percentComplete = Math.round(percentComplete, 2)
            Backbone.trigger('loading', percentComplete);
        };
        KingsGame.manager.onLoad = function() {

        };
        KingsGame.manager.onError = function() {

        };
    }

    KingsGame.prototype.initGround = function() {
        THREE.crossOrigin = "";
        KingsGame.groundMaterial = new CANNON.Material("groundMaterial");
        var wheelMaterial = new CANNON.Material("wheelMaterial");
        var wheelGroundContactMaterial = window.wheelGroundContactMaterial = new CANNON.ContactMaterial(wheelMaterial, KingsGame.groundMaterial, {
            friction: 0.3,
            restitution: 0,
            contactEquationStiffness: 1000
        });
        KingsGame.world.addContactMaterial(wheelGroundContactMaterial);

        KingsGame.road = new KingsGame.Road();

        if(KingsGame.fireBall != null) {
            KingsGame.scene.remove( KingsGame.fireBall );
        }
        var ballGeometry = new THREE.SphereGeometry( 60, 64, 64 );
    	KingsGame.fireBall = new THREE.Mesh( ballGeometry, KingsGame.assets.lavaMaterial );
    	KingsGame.fireBall.position.set(0, 165, 0);
    	KingsGame.scene.add( KingsGame.fireBall );

        var groundBody = new CANNON.Body({
            mass: 0,
            position: new CANNON.Vec3(0,0,-25)
        });
        var groundShape = new CANNON.Plane();
        groundBody.addShape(groundShape);
        var callback = function(e) {
            if(e.body.name == "player" || e.body.name == "wheel") {
                if(!KingsGame.gameOver) {
                    Backbone.trigger("gameOver");
                    KingsGame.gameOver = true;
                }
            }
        };
        groundBody.addEventListener("collide", callback);
        KingsGame.world.addBody(groundBody);
    };

    KingsGame.prototype.bumper = function(e){
        if(e.body.name == "player" || e.body.name == "wheel") {
            var dir = KingsGame.gameobjects.player.body.velocity.clone();
            dir.normalize();
            dir = dir.negate();
            dir.z = 0.3;
            dir = dir.scale(60);
            KingsGame.gameobjects.player.body.angularVelocity.set(0,0,0);
            KingsGame.gameobjects.player.body.inertia.set(0,0,0);
            KingsGame.gameobjects.player.body.velocity.copy(dir);
        }
    };

    KingsGame.prototype.initGameObjects = function() {
        KingsGame.gameobjects = {
            "player" : new KingsGame.Player({
                modelPath: './assets/models/car/',
                fileName: 'car',
                useMTL: true,
                position: new THREE.Vector3(0,0,0),
                rotation: new THREE.Vector3(90,180,0),
                scale: new THREE.Vector3(1,1,1),
                weight: 4,
                colideEvent: function() {
                    KingsGame.ready = true;
                }
            }),
            "crate" : new KingsGame.GameObject({
                modelPath: './assets/models/crate/',
                fileName: 'crate',
                useMTL: true,
                position: new THREE.Vector3(0,20,2),
                scale: new THREE.Vector3(1,1,1),
                weight: 4,
                bounciness: 0.9,
                //soundPath: './assets/sounds/running_hell.mp3',
                colideEvent: KingsGame.prototype.bumper
            }),
        };
    };

    KingsGame.prototype.alreadyLoaded = function(name) {
        for (var i = 0; i < KingsGame.assets.meshes.length; i++) {
            if ( KingsGame.assets.meshes[i].name.localeCompare(name) == 0 ) {
                return i;
            }
        }
        return -1;
    };

    KingsGame.prototype.loadAssets = function() {
        KingsGame.assets = {};
        KingsGame.assets.meshes = [];

        var bmap = new THREE.TextureLoader(KingsGame.manager).load( "./assets/textures/ground_b.png" );
        bmap.wrapS = bmap.wrapT = THREE.RepeatWrapping;
        bmap.repeat.set( 10, 10 );
        var smap = new THREE.TextureLoader(KingsGame.manager).load( "./assets/textures/ground_d.jpg" );
        smap.wrapS = smap.wrapT = THREE.RepeatWrapping;
        smap.repeat.set( 10, 10 );
        KingsGame.assets.groundTexture = new THREE.MeshPhongMaterial({
            shininess  :  0,
            bumpMap    :  bmap,
            map        :  smap,
            bumpScale  :  0.45,
        });

        var smap = new THREE.TextureLoader(KingsGame.manager).load( "./assets/textures/Supergram1.png" );
        KingsGame.assets.acceleratorTexture = new THREE.MeshPhongMaterial({
            shininess  :  0.1,
            alphaMap   :  smap,
            map        :  smap,
        });

        var textureLoader = new THREE.TextureLoader(KingsGame.manager);
		KingsGame.assets.lavaUniforms = {
			fogDensity: { value: 0.01 },
			fogColor:   { value: new THREE.Vector3( 0, 0, 0 ) },
			time:       { value: 1.0 },
			resolution: { value: new THREE.Vector2() },
			uvScale:    { value: new THREE.Vector2( 3.0, 1.0 ) },
			texture1:   { value: textureLoader.load( './assets/textures/cloud.png' ) },
			texture2:   { value: textureLoader.load( './assets/textures/lava.jpg' ) }
		};

		KingsGame.assets.lavaUniforms.texture1.value.wrapS = KingsGame.assets.lavaUniforms.texture1.value.wrapT = THREE.RepeatWrapping;
		KingsGame.assets.lavaUniforms.texture2.value.wrapS = KingsGame.assets.lavaUniforms.texture2.value.wrapT = THREE.RepeatWrapping;

    	KingsGame.assets.lavaMaterial = new THREE.ShaderMaterial({
    	    uniforms: KingsGame.assets.lavaUniforms,
    		vertexShader:   document.getElementById( 'vertexShaderLava'   ).textContent,
    		fragmentShader: document.getElementById( 'fragmentShaderLava' ).textContent,
            side: THREE.DoubleSide
    	});

        KingsGame.assets.particleTexture = new THREE.TextureLoader(KingsGame.manager).load("./assets/textures/particle.png");
    };

    KingsGame.prototype.restart = function() {
        KingsGame.world.clearForces();

        KingsGame.ready = false;
        KingsGame.gameOver = false;
        KingsGame.score = 0;
        KingsGame.paused = false;

        KingsGame.road.destroy();
        KingsGame.prototype.initGround();
        KingsGame.gameobjects.player.reset();

        if(KingsGame.rain != null) {
            KingsGame.rain.destroy();
            KingsGame.rain = null;
        }
    };

    $.fn.initGame = function( parameters ) {
        if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

        KingsGame.loadingScreen = new LoadingScreen();
        KingsGame.loadingScreen.render();
        $(document.body).append( KingsGame.loadingScreen.$el );

        KingsGame.gameOverScreen = new GameOverScreen();
        KingsGame.gameOverScreen.render();
        KingsGame.gameOverScreen.button.on("click", function() {
            Backbone.trigger("restart");
            KingsGame.prototype.restart();
        });
        $(document.body).append( KingsGame.gameOverScreen.$el );

        KingsGame.HAZARDS = {
            "plain": 0,
            "bumpers": 1,
            "accelerator": 2,
            "pit": 3,
            "meteorites": 4,
        };

        KingsGame.DIFICULTY = {
            "easy": 0,
            "medium": 1,
            "hard": 2
        };

        KingsGame.clock = new THREE.Clock();
        KingsGame.actualTime = 0;
        KingsGame.pastTime = 0;
        KingsGame.elapsedTime = 0;
        KingsGame.lag = 0;
        KingsGame.MS_PER_UPDATE = 1.0/40.0;

        KingsGame.ready = false;
        KingsGame.gameOver = false;
        KingsGame.score = 0;
        KingsGame.timeStep = 1.0 / 60.0;
        KingsGame.paused = false;
        KingsGame.firstPerson = false;
        KingsGame.pointerLocked = parameters.pointerLocked;
        KingsGame.prototype.lockPointer();

        KingsGame.scene = new THREE.Scene();
        KingsGame.scene.fog = new THREE.FogExp2( 0x000000, 0.01 );
        KingsGame.scene.fog.color.setHSL( 0.6, 0, 1 );
        var ambient = new THREE.AmbientLight( 0x444444 );
        KingsGame.scene.add( ambient );

        KingsGame.world = new CANNON.World();
        KingsGame.world.gravity.set(0,0,-9.82);
        KingsGame.world.broadphase = new CANNON.SAPBroadphase(KingsGame.world);
        KingsGame.world.solver.iterations = 10;
        KingsGame.world.defaultContactMaterial.friction = 0.2;

        KingsGame.prototype.initLoadManager();
        KingsGame.prototype.loadAssets();
        KingsGame.prototype.initGround();
        KingsGame.prototype.initGameObjects();

        var hemiLight = new THREE.HemisphereLight( 0xffffff, 0xffffff, 0.6 );
        hemiLight.color.setHSL( 0.6, 1, 0.6 );
        hemiLight.groundColor.setHSL( 0.095, 1, 0.75 );
        hemiLight.position.set( 0, 0, 500 );
        KingsGame.scene.add( hemiLight );

        KingsGame.dirLight = new THREE.DirectionalLight( 0xffffff, 1 );
        KingsGame.dirLight.color.setHSL( 0.1, 1, 0.95 );
        KingsGame.dirLight.position.set( 0, -10, 10 );
        KingsGame.dirLight.target.position.set(0,0,0);
        KingsGame.scene.add( KingsGame.dirLight.target );
        KingsGame.dirLight.castShadow = true;
        KingsGame.dirLight.shadow.mapSize.width = 2048;
        KingsGame.dirLight.shadow.mapSize.height = 2048;
        var d = 20;
        KingsGame.dirLight.shadow.camera.left = -d;
        KingsGame.dirLight.shadow.camera.right = d;
        KingsGame.dirLight.shadow.camera.top = d;
        KingsGame.dirLight.shadow.camera.bottom = -d;
        KingsGame.dirLight.shadow.camera.near = 3;
        KingsGame.dirLight.shadow.camera.far = 50;
        KingsGame.dirLight.shadow.camera.fov = 50;
        KingsGame.dirLight.shadow.bias = -0.0001;
        KingsGame.dirLight.shadow.camera.visible = true;
        KingsGame.scene.add( KingsGame.dirLight );

        var vertexShader = document.getElementById( 'vertexShader' ).textContent;
        var fragmentShader = document.getElementById( 'fragmentShader' ).textContent;
        var uniforms = {
            topColor: 	 { type: "c", value: new THREE.Color( 0x0077ff ) },
            bottomColor: { type: "c", value: new THREE.Color( 0x000000 ) },
            offset:		 { type: "f", value: 33 },
            exponent:	 { type: "f", value: 0.6 }
        };
        uniforms.topColor.value.copy( hemiLight.color );
        KingsGame.scene.fog.color.copy( uniforms.bottomColor.value );

        var skyGeo = new THREE.SphereGeometry( 400, 32, 15 );
        var skyMat = new THREE.ShaderMaterial({
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
            uniforms: uniforms,
            side: THREE.BackSide
        });
        KingsGame.sky = new THREE.Mesh( skyGeo, skyMat );
        KingsGame.scene.add( KingsGame.sky );

        KingsGame.CAMERA_TYPES = {
            "firstPerson" : 0,
            "thirdPerson" : 1,
            "upView" : 2,
        };
        KingsGame.camera = new THREE.PerspectiveCamera( 75, (window.innerWidth/2)/(window.innerHeight/2), 0.1, 1000 );
        KingsGame.camera.position.set(0,5,0);
        KingsGame.camera.up = new THREE.Vector3(0,0,1);
        KingsGame.camera.lookAt(new THREE.Vector3(0,0,0));
        KingsGame.camera.type = KingsGame.CAMERA_TYPES.thirdPerson;

        KingsGame.listener = new THREE.AudioListener();
		KingsGame.camera.add( KingsGame.listener );

        var audioLoader = new THREE.AudioLoader(KingsGame.manager);
        var sound = new THREE.Audio( KingsGame.listener );
		audioLoader.load( './assets/sounds/Main Entrance.mp3', function( buffer ) {
			sound.setBuffer( buffer );
			sound.setLoop(true);
			sound.setVolume(0.3);
			sound.play();
		});

        KingsGame.renderer = new THREE.WebGLRenderer( { antialias: true } );
        KingsGame.renderer.setSize( window.innerWidth, window.innerHeight );
        KingsGame.renderer.setPixelRatio( window.devicePixelRatio );
        KingsGame.renderer.shadowMap.enabled = true;
        KingsGame.renderer.shadowMapSoft = true;
        KingsGame.renderer.shadowMap.type = THREE.PCFShadowMap;
        KingsGame.renderer.autoClear = false;
        $(this).append( KingsGame.renderer.domElement );

        var renderModel = new THREE.RenderPass( KingsGame.scene, KingsGame.camera );
		var effectBloom = new THREE.BloomPass( 0 );
		var effectFilm = new THREE.FilmPass( 0, 0, 1024, false );
		effectFilm.renderToScreen = true;
		KingsGame.composer = new THREE.EffectComposer( KingsGame.renderer );
		KingsGame.composer.addPass( renderModel );
		KingsGame.composer.addPass( effectBloom );
		KingsGame.composer.addPass( effectFilm );

        KingsGame.stats = new Stats();
		$(this).append( KingsGame.stats.dom );

        window.addEventListener( 'resize', KingsGame.prototype.onWindowResize, false );
        document.addEventListener( 'keydown', KingsGame.prototype.onKeyDown, false );
        document.addEventListener( 'keyup', KingsGame.prototype.onKeyUp, false );
        document.addEventListener( 'mousemove', KingsGame.prototype.onMouseMove, false );

        KingsGame.prototype.render();
    };
}));
