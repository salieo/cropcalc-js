# cropcalc-js

[![cropcalc-js on NPM](https://img.shields.io/npm/v/cropcalc-js.svg?style=flat-square)](https://www.npmjs.com/package/cropcalc-js) [![Build Status](https://img.shields.io/travis/salieo/cropcalc-js.svg?style=flat-square)](https://travis-ci.org/salieo/cropcalc-js)  [![Coverage Status](https://img.shields.io/coveralls/github/salieo/cropcalc-js.svg?style=flat-square)](https://coveralls.io/github/salieo/cropcalc-js?branch=master)

Custom crop calculation based on data from the [Salieo API](https://www.salieo.com).

## Install

```
npm install cropcalc-js
```

## Getting Started

We'll use the single exposed function from cropcalc-js `findCrop()` in an example:

```
const cropcalc = require('cropcalc-js');

var salieoData = {crops:{suggested:[{id:1,x1:800,x2:1500,y1:450,y2:800}],fallback:[]},orig_width:1600,orig_height:800};

var options = {
    target_width: 800
    target_height: 400
};

var customCrop = cropcalc.findCrop(salieoData, options);

console.log(customCrop);
//Output: {x1: 750, x2: 1550, y1: 400, y2: 800}
```

Note that in production you would pass the data recieved from the Salieo API for the image you want to crop in place of `salieoData` (after parsing the JSON). In this example, `salieoData` has been initialized with sample data.

## API

### cropcalc.findCrop(salieoData, options)
Find the best crop based on data returned from the Salieo API for an image.

**salieoData**: Data returned from the Salieo API for an image. *Note:* Don't pass the JSON string, pass the parsed object.

**options**: [Options](#options)

***Returns***: Object representing best crop. Example: `{x1: 100, y1: 0, x2: 800, y2: 550}`.  
*Note*: In many cases the crop returned will *not* have the same width and height as requested by [*target_width*](#target_width--target_height-) and [*target_height*](#target_width--target_height-). The width and height of the crop returned will *never* be smaller than the [*target_width*](#target_width--target_height-) and [*target_height*](#target_width--target_height-) and will *always* maintain the original ratio between the [*target_width*](#target_width--target_height-) and [*target_height*](#target_width--target_height-). If the crop returned is larger than requested this indicates that a larger portion of the image should be cropped to and then scaled down to meet the original [*target_width*](#target_width--target_height-) and [*target_height*](#target_width--target_height-). More information about this can be found in the [zoom](#zoom) option description.

## Options

Required options have a *

### target_width *, target_height *
Target width and height are the only two required options. All others are optional. They represent the desired demensions of the final crop in px.

```
var options = {
    target_width: 800
    target_height: 400
};
```

### actual_width, actual_height
Actual width and height represent the dimensions of the image being cropped in px. If these are not specified they are assumed to be equal to the *orig_width* and *orig_height* properties returned by the Salieo API.

You would want to specify these if you are cropping a scaled version of the image that was processed by the Salieo API (i.e. the dimensions of the image you processed by the Salieo API and the dimensions of the image you want to generate a crop for are different - they have been scaled up/down).

```
var options = {
    actual_width: 800
    actual_height: 400
    ...
};
```

### zoom
If unspecified, defaults to `false`.

```
var options = {
    zoom: false
    ...
};
```

There are five different options for zoom. Note that under no circumstances will `findCrop()` return a crop with smaller dimensions than requested through [*target_width*](#target_width--target_height-) and [*target_height*](#target_width--target_height-).

#### `false`
The generated crop will retain the desired/width height ratio but will be scaled up to contain as much of the original image as possible. (The crop is not zoomed.)

#### `"auto"`
The generated crop dimensions will be equal to the [*target_width*](#target_width--target_height-) and [*target_height*](#target_width--target_height-) options with one important exception. If [*target_width*](#target_width--target_height-) and/or [*target_height*](#target_width--target_height-) are smaller than the corresponding dimensions for the *smallest* suggested crop returned by the Salieo API, the resulting crop will be scaled up (if possible) to attempt to contain *smallest* suggested crop.

In short, setting **zoom** to `"auto"` attempts to zoom as much as possible while retaining the most important parts of the image.

#### `"max"`
This **zoom** setting is similar to [`"auto"`](#auto) except the generated crop dimensions will *always* be equal to [*target_width*](#target_width--target_height-) and [*target_height*](#target_width--target_height-) - in other words this generates the most scaled crop out of all **zoom** options. The resulting crop will not be scaled in order to retain the smallest suggested crop.

#### `"focus"`
The `"focus"` setting should only be used when a [focus region](#focus-1) is specified. This option is similar to [`"auto"`](#auto) except that when attempting to contain the smallest suggested crop in the focus region - the whole crop will be scaled up only as much as allows the subject to remain in the center of the focus region.

### focus
The **focus** option allows the desired location of the subject in the resulting crop to be specified. The aim is always to position the subject as close to the center of the focus region as possible. The **zoom** option [`"focus"`](#focus) can also be set in conjunction with this option to attempt to adjust the scale of the crop to properly accomodate the subject within the focus region.

The **focus** option can be set with an object containing the following properties specifying the sides of the focus region (in px):

`x1`: Left side - defaults to 0  
`x2`: Right side - defaults to [*target_width*](#target_width--target_height-)  
`y1`: Top side - defaults to 0  
`y2`: Bottom side - defaults to [*target_height*](#target_width--target_height-)

*Note*: The following must be true:

0 <= `x1` < `x2` <= [*target_width*](#target_width--target_height-)  
0 <= `y1` < `y2` <= [*target_height*](#target_width--target_height-)

If the entire **focus** option is left unset, all **focus** properties listed above will remain set to their defaults (making the focus region the entire crop).

**A few examples:**

1. Sets the focus region to the right half of the crop:

```
var options = {
    target_width: 800
    target_height 400
    focus: {
        left: 400
    }
    ...
};
```

2. Sets the focus region to the top left quarter of the crop:

```
var options = {
    target_width: 800
    target_height 400
    focus: {
        right: 400
        bottom: 200
    }
    ...
};
```

2. Sets the focus region to a small square near the center right of the crop:

```
var options = {
    target_width: 800
    target_height 400
    focus: {
        left: 500
        right: 700
        top: 100
        bottom: 300
    }
    ...
};
```

## Licence

MIT. © 2017 Salieo

[![Certified Awesome](https://img.shields.io/badge/certified-awesome-orange.svg?style=flat-square)](https://www.salieo.com)

