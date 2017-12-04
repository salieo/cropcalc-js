const test = require('tape');
const cropcalc = require('../src/cropcalc.js');

const data1 = {
    "crops": {
        "suggested": [{
            "x2": 1998,
            "y2": 1444,
            "y1": 552,
            "x1": 0,
            "id": 1
        }, {
            "x2": 1998,
            "y2": 1444,
            "y1": 646,
            "x1": 962,
            "id": 2
        }],
        "fallback": [{
            "x2": 1694,
            "y2": 955,
            "y1": 679,
            "x1": 1427,
            "id": 1
        }],
    },
    "orig_width": 2000,
    "orig_height": 1446
} //Salieo API data for https://www.salieo.com/testimg/test1.jpg

function testCrop(t, data, options, expected) {
    try {
        var result = cropcalc.findCrop(data, options, expected);
        t.deepEqual(result, expected, "Check generated crop against expected.");
    } catch(error) {
        t.fail(error);
    }
    t.end();
}


//Tests

test('data1 400x400 zoom-off', (t) => {
    const options = {
        target_width: 400,
        target_height: 400,
        zoom: false
    };
    const expected = {x1: 552, y1: 0, x2: 1998, y2: 1446};

    testCrop(t, data1, options, expected);
});

test('data1 400x400 zoom-auto', (t) => {
    const options = {
        target_width: 400,
        target_height: 400,
        zoom: "auto"
    };
    const expected = {x1: 962, x2: 1998, y1: 410, y2: 1446};

    testCrop(t, data1, options, expected);
});

test('data1 400x400 zoom-auto actual-width actual-height', (t) => {
    const options = {
        target_width: 400,
        target_height: 400,
        actual_width: 1000,
        actual_height: 723,
        zoom: "auto"
    };
    const expected = {x1: 481, y1: 205, x2: 999, y2: 723};

    testCrop(t, data1, options, expected);
});

test('data1 400x400 zoom-focus-auto focus-horizontal', (t) => {
    const options = {
        target_width: 400,
        target_height: 400,
        focus: {
            x1: 200,
            x2: 300
        },
        zoom: "focus-auto"
    };
    const expected = {x1: 828, y1: 274, x2: 2000, y2: 1446};

    testCrop(t, data1, options, expected);
});

test('data1 400x400 zoom-focus-auto focus-vertical', (t) => {
    const options = {
        target_width: 400,
        target_height: 400,
        focus: {
            y1: 200,
            y2: 300
        },
        zoom: "focus-auto"
    };
    const expected = {x1: 691, y1: 0, x2: 1998, y2: 1307};

    testCrop(t, data1, options, expected);
});

test('data1 400x400 zoom-focus focus-vertical', (t) => {
    const options = {
        target_width: 400,
        target_height: 400,
        focus: {
            y1: 50
        },
        zoom: "focus"
    };
    const expected = {x1: 560, y1: 8, x2: 1998, y2: 1446};

    testCrop(t, data1, options, expected);
});

test('data1 400x800 zoom-auto', (t) => {
    const options = {
        target_width: 400,
        target_height: 800,
        zoom: "auto"
    };
    const expected = {x1: 1199, y1: 0, x2: 1922, y2: 1446};

    testCrop(t, data1, options, expected);
});

test('data1 800x400 zoom-auto', (t) => {
    const options = {
        target_width: 800,
        target_height: 400,
        zoom: "auto"
    };
    const expected = {x1: 402, y1: 646, x2: 1998, y2: 1444};

    testCrop(t, data1, options, expected);
});

test('data1 2000x2000 zoom-auto', (t) => {
    //Ask for too large a crop - should be scaled down to max possible size
    const options = {
        target_width: 2000,
        target_height: 2000,
        zoom: "auto"
    };
    const expected = {x1: 552, y1: 0, x2: 1998, y2: 1446};

    testCrop(t, data1, options, expected);
});