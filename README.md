3Dewii
======

3D Extensible Web Interface Infrarstucture


3Dewii - Frontend Documentation

Introduction
-------------------------------------------------------------------------------------------------
3Dewii is an Extensible 3D interface infrastructure aimed for building 3D Web interactive worlds.
It can be seen as an abstraction on top of Three.js for developing web apps in a 3D space.
A very basic demo can be seen at: http://www.sijp.co.il/3dewii/index.html

Pre-requesites
-------------------------------------------------------------------------------------------------
The frontend uses several opensource Javascript libraries for its job:
* jQuery
* jQuery-UI
* Three.js

It also requires the user to have a WebGL supported browser with an OpenGL supported VGA adapter.

Directory Structure:
-------------------------------------------------------------------------------------------------
root directory:
* index.html - the main html file, adds manually all scripts for all widgets. And has an embedded CSS (should be external per widget).
* Three.js - a WebGL library
* jQuery - a DOM manipulation library

base directory:
	* base.js - Defines the Ewii3D module, responsible for populating the 3d workspace.
	* base/widgets:
	    * Ewii3DWidget.js - Augments Ewii3D and adds a basic object generator for basic widgets.
	    the widgets cannot be moved and no interaction can be made. 
	    * Ewii3DGrabbableWidget.js - Augments Ewii3D and adds a basic object generator for grabbable widgets.
	    These widgets can be dragged and be further extended to support action callbacks.

widgets directory:
	This directory contains all widgets that can be loaded and used.
	some demo widgets are already found.
	
demo directory:
	This is a temporary directory. It has a temporary demo JSON file, that stores the settings
	of the scene for this specific user. In the future, after logging in, this JSON should be
	dynamically generated and sent by the server to the client via AJAX.
	After loading the file, it will be processed, and proper widgets will be added to the scene.
	Additionally, it will have general attributes like the world Environment map and such.
	
base.js:
-------------------------------------------------------------------------------------------------
This is the core functionallity of the user interface. It provieds 3 basic objects:
* Ewii3D - this is a Module (see Module Pattern), whose all purpose is to manage and load
	  the various 3D components. It sets up the 3D scene, using Three.js, and then
	  adds all needed elements: a Camera, lights, the environemt Cube, and an
	  helper plane for moving objects.
	  It has a special array, for movable objects of types THREE.Mesh (called 'objects'), and
	  implements 3 event handlers: mousemove, mousedown and mouseup, which will move objects that 
	  are in that array.
	  It also implements a windowresize handler for refreshing the scene.

Ewii3DWidget.js:
-------------------------------------------------------------------------------------------------
* Ewii3D.Widget - This is a widget generator that defines the basic actions needed for every widget.
	  it has a load method, that loads a json file (specified by the 'model' attribute) and upon
	  success calls the init method that can be overriden by other widgets.
	  Widgets that extend this object's functionallity will not be moveable.

Ewii3DGrabbableWidget.js:
-------------------------------------------------------------------------------------------------
* Ewii3D.GrabbableWidget - This is a simple extension to Ewii3DWidget, only that it adds its
	  3D model to the objects array of the Ewii3D singleton, thus allowing it to accept mouse 
	  events and moved around.

Making your own widgets:
-------------------------------------------------------------------------------------------------
In Ewii3D, each widget is stateless, meaning that no real data is saved in the object
itself, rather it is provided to each method by the `settings` arguement.
Thus, any of the widget's "public" method must have a `settings` parameter as the
last arguement.

The first thing you need to do is to augment the widget, this is done via Ewii3D's 
module function: `augmentWidget` (in Base.js) which recieves a Base Widget Generator, and returns
a new Generator whose prototype is Base:

    SubWidget = Ewii3D.augmentWidget(Ewii3D.Widget);

Now we can simply add methods or override other methods:

    SubWidget.prototype.newMethod = function(p1, p2, ..., settings){ //notice we have settings here
        ...
    }
    
    Ewii3D.SubWidget = SubWidget; //expose the new widget constructor in the module.

Once the widget is created (via `Ewii3D.widget(widgetCtor,settings)`), every method will be
decorated so the settings arguement will be attached to the returned newly created widget.
this way, the settings arguement will not be needed to be given for each method call:

    mySubWidget = Ewii3D.widget(SubWidget,{name:"Shlomi", lang:"javascript"});
    mySubWidget.newMethod(arg1, arg2,...); 

you do not need to supply the settings parameter in the method call, it will be 
supplied automagically.

To prevent this behaviour, one must prepend the method with an underscore.

    SubWidget.prototype._undecoratedMethod = function(p1, p2, ...){
    }


- for more info please see the code (sorry :-).
	
Exporting Three.js models from blender
-------------------------------------------------------------------------------------------------
After modelling and texturing the blender models, one can export it via a plugin from the THREE.js
website:
https://github.com/mrdoob/three.js/tree/master/utils/exporters/blender
Enable it via File>User Preferences>Addons
and export your model via File>Export

The models should be x100 blender units of the original size.

Exporting a cube map via blender
-------------------------------------------------------------------------------------------------
The global environment is simple 6 images that are wrapped around a big cube. This can be done via
texture baking in the blender.
The result file is a single image containing all 6 faces textures that should be seperated externally
(using gimp). each image should be named in a file #.jpg where # is the number of the image.
The order is as such: 

			-------------

			| 1 | 2 | 3 |

			-------------

			| 6 | 5 | 4 |

			-------------
