Array.prototype.sortOn = function (key) {
    this.sort(function (a, b) {
        if (a[key] < b[key]) {
            return -1;
        } else if (a[key] > b[key]) {
            return 1;
        }
        return 0;
    });
}

function copy(o) {
    var out, v, key;
    out = Array.isArray(o) ? [] : {};
    for (key in o) {
        v = o[key];
        out[key] = (typeof v === "object") ? copy(v) : v;
    }
    return out;
}

function setOpts(standard, user) {
    if (typeof user === 'object') {
        for (var key in user) {
            standard[key] = user[key];
        }
    }
}

function convertDataToPercent(data, originalWidth, originalHeight) {
    for (var i = 0; i < data["suggested-crops"].length; i++) {
        data["suggested-crops"][i]["x1"] /= originalWidth;
        data["suggested-crops"][i]["x2"] /= originalWidth;
        data["suggested-crops"][i]["y1"] /= originalHeight;
        data["suggested-crops"][i]["y2"] /= originalHeight;
    }
    for (var i = 0; i < data["fallback-crops"].length; i++) {
        data["fallback-crops"][i]["x1"] /= originalWidth;
        data["fallback-crops"][i]["x2"] /= originalWidth;
        data["fallback-crops"][i]["y1"] /= originalHeight;
        data["fallback-crops"][i]["y2"] /= originalHeight;
    }
}

function correctCenter(xCenter, yCenter, width, height, boundaryCrop) {
    if (xCenter - (width / 2) < boundaryCrop["x1"]) {
        xCenter = boundaryCrop["x1"] + (width / 2);
    } else if (xCenter + (width / 2) > boundaryCrop["x2"]) {
        xCenter = boundaryCrop["x2"] - (width / 2);
    }
    if (yCenter - (height / 2) < boundaryCrop["y1"]) {
        yCenter = boundaryCrop["y1"] + (height / 2);
    } else if (yCenter + (height / 2) > boundaryCrop["y2"]) {
        yCenter = boundaryCrop["y2"] - (height / 2);
    }
    return [xCenter, yCenter];
}

function getDetailsFromCenter(xCenter, yCenter, width, height, subjWidth, subjHeight, subjXShift, subjYShift, boundaryCrop) {
    subjWidth = Math.min(subjWidth, boundaryCrop["x2"] - boundaryCrop["x1"]);
    subjHeight = Math.min(subjHeight, boundaryCrop["y2"] - boundaryCrop["y1"]);

    //Shift to correct out of bounds
    centerCorrected = correctCenter(xCenter, yCenter, subjWidth, subjHeight, boundaryCrop);

    xCenter = centerCorrected[0] + subjXShift;
    yCenter = centerCorrected[1] + subjYShift;

    centerCorrected = correctCenter(xCenter, yCenter, width, height, {
        "x1": 0,
        "x2": 1,
        "y1": 0,
        "y2": 1
    });

    var x1 = centerCorrected[0] - (width / 2);
    var x2 = centerCorrected[0] + (width / 2);
    var y1 = centerCorrected[1] - (height / 2);
    var y2 = centerCorrected[1] + (height / 2);

    return {
        "x1": x1,
        "y1": y1,
        "x2": x2,
        "y2": y2
    };
}

function findBestCrop(crops, fallbackCrops, targetWidthPercent, targetHeightPercent, subjWidthPercent, subjHeightPercent, subjXShift, subjYShift, options) {
    var boundaryCrop = {
        "x1": 0,
        "x2": 1,
        "y1": 0,
        "y2": 1
    };
    if (crops.length === 0 || !options["zoom"]) {
        crops.unshift(boundaryCrop);
    }

    var lastCropWidth = (crops[crops.length - 1]["x2"] - crops[crops.length - 1]["x1"]);
    var lastCropHeight = (crops[crops.length - 1]["y2"] - crops[crops.length - 1]["y1"]);

    var allCrops = crops.concat(fallbackCrops);

    if (options["zoom"] !== "max") {
        var finalScaleFactor = Math.max((lastCropWidth / subjWidthPercent), (lastCropHeight / subjHeightPercent));
        if(!options["zoom"]) {
            finalScaleFactor = Infinity;
        } else if (typeof options["zoom"] === "number") {
            finalScaleFactor = (1 / options["zoom"]) / (targetWidthPercent * targetHeightPercent);
        } else if (options["zoom"] === "focus-fit") {
            if(options["focus-region"]["horizontal"]) {
                var leftPercentage = 0.5 - (subjXShift / targetWidthPercent);
                var rightPercentage = 1 - leftPercentage;
                var centerX = (allCrops[allCrops.length - 1]["x1"] + allCrops[allCrops.length - 1]["x2"]) / 2;
                finalScaleFactor = Math.min(finalScaleFactor, (1 - centerX) / (rightPercentage * targetWidthPercent), (centerX) / (leftPercentage * targetWidthPercent));
            }
            if (options["focus-region"]["vertical"]) {
                var topPercentage = 0.5 - (subjYShift / targetHeightPercent);
                var bottomPercentage = 1 - topPercentage;
                var centerY = (allCrops[allCrops.length - 1]["y1"] + allCrops[allCrops.length - 1]["y2"]) / 2;
                finalScaleFactor = Math.min(finalScaleFactor, (1 - centerY) / (bottomPercentage * targetHeightPercent), (centerY) / (topPercentage * targetHeightPercent));
            }
        }
        finalScaleFactor = Math.max(1, Math.min(1 / Math.max(targetHeightPercent, targetWidthPercent), finalScaleFactor));

        subjWidthPercent *= finalScaleFactor;
        subjHeightPercent *= finalScaleFactor;
        targetWidthPercent *= finalScaleFactor;
        targetHeightPercent *= finalScaleFactor;
        subjXShift *= finalScaleFactor;
        subjYShift *= finalScaleFactor;
    }

    subjWidthPercent = subjWidthPercent.toFixed(10);
    subjHeightPercent = subjHeightPercent.toFixed(10);

    var centerPointX = (allCrops[0]["x1"] + allCrops[0]["x2"]) / 2;
    var centerPointY = (allCrops[0]["y1"] + allCrops[0]["y2"]) / 2;
    var continueDown;
    for (var i = 0; i < allCrops.length - 1; i++) {
        continueDown = false;
        if (subjWidthPercent < (allCrops[i]["x2"] - allCrops[i]["x1"])) {
            continueDown = true;
            boundaryCrop["x1"] = allCrops[i]["x1"];
            boundaryCrop["x2"] = allCrops[i]["x2"];
            centerPointX = (allCrops[i + 1]["x1"] + allCrops[i + 1]["x2"]) / 2;
        }
        if (subjHeightPercent < (allCrops[i]["y2"] - allCrops[i]["y1"])) {
            continueDown = true;
            boundaryCrop["y1"] = allCrops[i]["y1"];
            boundaryCrop["y2"] = allCrops[i]["y2"];
            centerPointY = (allCrops[i + 1]["y1"] + allCrops[i + 1]["y2"]) / 2;
        }

        if (!continueDown) {
            break;
        }
    }

    //Maybe add center point offset here and change back to actual width and height
    return getDetailsFromCenter(centerPointX, centerPointY, targetWidthPercent, targetHeightPercent, subjWidthPercent, subjHeightPercent, subjXShift, subjYShift, boundaryCrop);


}

function convertCropToPixels(crop, actualWidth, actualHeight) {
    crop["x1"] = Math.round(crop["x1"] * actualWidth);
    crop["x2"] = Math.round(crop["x2"] * actualWidth);
    crop["y1"] = Math.round(crop["y1"] * actualHeight);
    crop["y2"] = Math.round(crop["y2"] * actualHeight);
}

function validateInput(dataPassed, userOptions) {
    if(!dataPassed || !userOptions) {
        throw new Error("Missing Salieo API data and/or crop options!");
    }
    else if(!userOptions.hasOwnProperty("target-width") || !userOptions.hasOwnProperty("target-height")) {
        throw new Error("Missing target-width and/or target-height in crop options!");
    }
    else if(!dataPassed.hasOwnProperty("suggested-crops") || !dataPassed.hasOwnProperty("fallback-crops") || !dataPassed.hasOwnProperty("original-width") || !dataPassed.hasOwnProperty("original-height")) {
        throw new Error("Salieo API data is malformed or missing information!");
    }
}

function findCrop(dataPassed, userOptions) {
    data = copy(dataPassed);
    validateInput(data, userOptions);

    var options = {
        "zoom": true
    }
    setOpts(options, userOptions);
    if (!options.hasOwnProperty("actual-width") || !options.hasOwnProperty("actual-height")) {
        options["actual-width"] = data["original-width"];
        options["actual-height"] = data["original-height"];
    }
    var targetWidthPercent = options["target-width"] / options["actual-width"];
    var targetHeightPercent = options["target-height"] / options["actual-height"];

    //Correct targetWidthPercent and targetHeightPercent if one/both are greater than 1
    if(targetWidthPercent > 1 || targetHeightPercent > 1) {
        var scaleFactor = Math.max(targetWidthPercent / 1, targetHeightPercent / 1);
        targetWidthPercent /= scaleFactor;
        targetHeightPercent /= scaleFactor;
    }

    var subjXShift = 0;
    var subjYShift = 0;
    var subjWidthPercent = targetWidthPercent;
    var subjHeightPercent = targetHeightPercent;
    if (options.hasOwnProperty("focus-region")) {
        if(options["focus-region"].hasOwnProperty("x1") && options["focus-region"].hasOwnProperty("x2")) {
            var x1 = options["focus-region"]["x1"];
            var x2 = options["focus-region"]["x2"];
            subjXShift = (0.5 - (((x1 + x2) / 2) / options["target-width"])) * (options["target-width"] / options["actual-width"]);
            subjWidthPercent *= (x2 - x1) / options["target-width"];
            options["focus-region"]["horizontal"] = true;
        } else {
            options["focus-region"]["horizontal"] = false;
        }
        
        if(options["focus-region"].hasOwnProperty("y1") && options["focus-region"].hasOwnProperty("y2")) {
            var y1 = options["focus-region"]["y1"];
            var y2 = options["focus-region"]["y2"];
            subjYShift = (0.5 - (((y1 + y2) / 2) / options["target-height"])) * (options["target-height"] / options["actual-height"]);
            subjHeightPercent *= (y2 - y1) / options["target-height"];
            options["focus-region"]["vertical"] = true;
        } else {
            options["focus-region"]["vertical"] = false;
        }
    }

    data["suggested-crops"].sortOn("id");
    data["fallback-crops"].sortOn("id");
    convertDataToPercent(data, data["original-width"], data["original-height"]);

    var finalCrop = findBestCrop(data["suggested-crops"], data["fallback-crops"], targetWidthPercent, targetHeightPercent, subjWidthPercent, subjHeightPercent, subjXShift, subjYShift, options);

    //Convert from percentage values to pixels for output
    convertCropToPixels(finalCrop, options["actual-width"], options["actual-height"]);

    return finalCrop;
}

module.exports.findCrop = findCrop;