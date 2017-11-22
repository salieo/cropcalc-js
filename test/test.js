const test = require('tape');
const cropcalc = require('../src/cropcalc.js');

const data1 = {
    "suggested-crops": [{
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
    "fallback-crops": [{
        "x2": 1694,
        "y2": 955,
        "y1": 679,
        "x1": 1427,
        "id": 1
    }],
    "original-width": 2000,
    "original-height": 1446
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
        "target-width": 400,
        "target-height": 400,
        "zoom": false
    };
    const expected = {x1: 552, y1: 0, x2: 1998, y2: 1446};

    testCrop(t, data1, options, expected);
});

test('data1 400x400 zoom-on', (t) => {
    const options = {
        "target-width": 400,
        "target-height": 400,
        "zoom": true
    };
    const expected = {x1: 962, x2: 1998, y1: 410, y2: 1446};

    testCrop(t, data1, options, expected);
});

test('data1 400x400 zoom-on actual-width actual-height', (t) => {
    const options = {
        "target-width": 400,
        "target-height": 400,
        "actual-width": 1000,
        "actual-height": 723,
        "zoom": true
    };
    const expected = {x1: 481, y1: 205, x2: 999, y2: 723};

    testCrop(t, data1, options, expected);
});

test('data1 400x400 zoom-focus-fit focus-horizontal', (t) => {
    const options = {
        "target-width": 400,
        "target-height": 400,
        "focus-region": {
            "x1": 200,
            "x2": 300
        },
        "zoom": "focus-fit"
    };
    const expected = {x1: 828, y1: 274, x2: 2000, y2: 1446};

    testCrop(t, data1, options, expected);
});

test('data1 400x400 zoom-focus-fit focus-vertical', (t) => {
    const options = {
        "target-width": 400,
        "target-height": 400,
        "focus-region": {
            "y1": 200,
            "y2": 300
        },
        "zoom": "focus-fit"
    };
    const expected = {x1: 691, y1: 0, x2: 1998, y2: 1307};

    testCrop(t, data1, options, expected);
});

test('data1 400x800 zoom-on', (t) => {
    const options = {
        "target-width": 400,
        "target-height": 800,
        "zoom": true
    };
    const expected = {x1: 1199, y1: 0, x2: 1922, y2: 1446};

    testCrop(t, data1, options, expected);
});

test('data1 800x400 zoom-on', (t) => {
    const options = {
        "target-width": 800,
        "target-height": 400,
        "zoom": true
    };
    const expected = {x1: 402, y1: 646, x2: 1998, y2: 1444};

    testCrop(t, data1, options, expected);
});