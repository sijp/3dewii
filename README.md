3Dewii
======

3D Extensible Web Interface Infrarstucture


3Dewii - Frontend Documentation

Introduction
3Dewii is an Extensible 3D interface infrastructure aimed for building 3D Web interactive worlds.

Pre-requesites
-------------------------------------------------------------------------------------------------
The frontend uses several opensource Javascript libraries for its job:
* jQuery
* Three.js

It also requires the user to have a WebGL supported browser with an OpenGL supported VGA adapter.

Directory Structure:
-------------------------------------------------------------------------------------------------
root directory:
* index.html (should be converted to HaML) - the main html file, adds manually all scripts for all widgets. And has an embedded CSS (should be external per widget).
* Three.js - a WebGL library
* jQuery - a DOM manipulation library

base directory:
	* base.js - the main Javascript code, that runs this site, see further info ahead.

widgets directory:
	This directory contains all widgets that can be loaded and used.
	
demo directory:
	This is a temporary directory. It has a temporary demo JSON file, that stores the settings
	of the scene for this specific user. In the future, after logging in, this JSON should be
	dynamically generated and sent by the server to the client via AJAX.
	After loading the file, it will be processed, and proper widgets will be added to the scene.
	Additionally, it will have general attributes like the world Environment map and such.
	
base.js:
-------------------------------------------------------------------------------------------------
This is the core functionallity of the user interface. It provieds 3 basic objects:
	* Ewii3D - this is a singleton object, whose all purpose is to manage and load
	  the various 3D components. It sets up the 3D scene, using Three.js, and then
	  adds all needed elements: a Camera, lights, the environemt Cube, and an
	  helper plane for moving objects.
	  It has a special array, for movable objects of types THREE.Mesh (called 'objects'), and
	  implements 3 event handlers: mousemove, mousedown and mouseup, which will move objects that 
	  are in that array.
	  It also implements a windowresize handler for refreshing the scene.
	* Ewii3DWidget - This is an object that defines the basic actions needed for every widget.
	  it has a load method, that loads a json file (specified by the 'model' attribute) and upon
	  success calls the init method that can be overriden by other widgets.
	  Widgets that extend this object's functionallity will not be moveable.
	* Ewii3DMoveableWidget - This is a simple extension to Ewii3DWidget, only that it adds its
	  3D model to the objects array of the Ewii3D singleton, thus allowing it to accept mouse 
	  events and moved around.

	*** for more info please see the code.
	
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
