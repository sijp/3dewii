Ewii3D = (function(self){

    /*
     *  basic interface for the widgets. all widgets' prototypes must be an instance of this class.
     *  widgets that inherit for Ewii3DWidget will not be able to be grabbed or interacted at all,
     *  see Ewii3DGrabbableWidget for more info.
     */
    function Widget(opts){
    }

    Widget.prototype._decorateMethods=function(settings){
        var THIS=this;
        methods = this._getDecoratedMethods();
        for (m in methods){
            (function(){
                var methodName = methods[m];
                THIS[methodName] = function(){
                    modifiedArgs = Array.prototype.slice.call(arguments);
                    modifiedArgs.push(settings);
                    return (Object.getPrototypeOf(THIS))[methodName].apply(Object.getPrototypeOf(THIS),modifiedArgs);
                }
            }());
        }
    };

    Widget.prototype._getDecoratedMethods = function(){
        var methods = [];
        var m;
        for (m in this){
            if (this[m] instanceof Function){
                if (m[0] !== '_'){
                    methods.push(m);
                }
            }
        }
    
        return methods;
    };

    Widget.prototype.init=function(geo,settings){
        settings.object = new THREE.Mesh( geo, new THREE.MeshFaceMaterial({shading:THREE.FlatShading}) );

        settings.object.geometry.dynamic = true;
        settings.object.castShadow = true;
        settings.object.receiveShadow = true;

        settings.object.ewii3DWidget = settings.widget;
        
        settings.object.position.x = settings.position.x;
        settings.object.position.y = settings.position.y;
        settings.object.position.z = settings.position.z;
        
        settings.object.scale.x *= settings.scale;
        settings.object.scale.y *= settings.scale;
        settings.object.scale.z *= settings.scale;
        self.addObjectToScene(settings.object);
    };
    
    /*
     *  actions to be taken once a click (mouse up) is made.
     */
    Widget.prototype.clickAction = function(settings){
    };

    /*
     *  actions to be taken once a grab (mouse down+move) is made.
     */
    Widget.prototype.grabAction = function(settings){
    };

    Widget.prototype.refresh=function(settings){
        return;
    };

    self.Widget = Widget;

    return self;
}(Ewii3D || {}));
