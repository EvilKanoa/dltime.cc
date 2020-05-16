/**
 * Estimates the amount of time a download will take given the size and speed.
 * Returns the estimate as both a duration and a datetime.
 * @param {Number} size The size of the download in bytes.
 * @param {Number} speed The speed of the download in bits/second.
 * @returns {{ time: String, date: String }} The estimate for the download time.
 */
const estimate = (size, speed) => {
	// Ensure both size and speed are valid numbers
	if (!size || !speed) {
		return {
			time: 'N/A',
			date: 'N/A',
		};
	}

	const bits = size * 8; // Determine number of bits in the file.
	const seconds = bits / speed; // Calculate number of seconds at the given speed.

	return {
		// Format time as a humanized duration.
		time: moment.duration(seconds, 'seconds').humanize(),
		// Format the datetime as a localized string.
		date: moment().add(seconds, 'seconds').format('LLL'),
	}
};

/** Defines the selectors used to query each element required for this app. */
const selectors = {
	inputs: {
		sizeValue: '#js-input-size-value',
		sizeUnit: '#js-input-size-unit',
		speedValue: '#js-input-speed-value',
		speedUnit: '#js-input-speed-unit',
	},
	outputs: {
		time: '#js-output-time',
		date: '#js-output-date',
	},
};

/** Scalers used to convert the raw input numbers to bytes (for size) and bits/s (for speed). */
const unitConversions = {
	size: {
		'KB': 1024,
		'MB': 1048576,
		'GB': 1073741824,
		'TB': 1099511627776,
	},
	speed: {
		'bs': 1,
		'Kbs': 1024,
		'Mbs': 1048576,
		'Gbs': 1073741824,
		'Bs': 8,
		'KBs': 8192,
		'MBs': 8388608,
		'GBs': 8589934592,
	},
};

/** Implements a simple map function for the values of a 1-level object. */
const mapValues = transformFn => obj =>
	Object.keys(obj).reduce((out, key) => {
		out[key] = transformFn(obj[key]);
		return out;
	}, {});

/** Event handler modifier for number input fields to sanitize and control user input values. */
const sanitizeNumber = (cb) => (event) => {
	const value = (event.target.value || '').replace(/[^0-9,.]/gi, '');
	event.target.value = value;
	cb(event);
};

/**
 * Initialization function that will find and bind all required HTML elements needed for operation.
 * It will bind the update handler to the required elements.
 * After all elements are bound, it will execute the update handler once to ensure the app is ready.
 */
const bindElements = () => {
	// Use querySelector to find our elements.
	const querySelectorMap = mapValues(selectors => document.querySelector(selectors));
	const inputEls = querySelectorMap(selectors.inputs);
	const outputEls = querySelectorMap(selectors.outputs);

	// Cleanup the dirty values in inputs.
	inputEls.sizeValue.value = '';
	inputEls.speedValue.value = '';

	// Build getters and setters for general usage.
	const getInput = () => mapValues(el => el.value)(inputEls);
	const setOutput = (timeValue, dateValue) => {
		outputEls.time.innerText = `${timeValue}`;
		outputEls.date.innerText = `${dateValue}`;
	};

	// Create a new bound update handler with our getters and setters.
	const boundHandler = updateHandler(getInput, setOutput);

	// Attach the bound update handler to all our input elements.
	inputEls.sizeValue.addEventListener('input', sanitizeNumber(boundHandler));
	inputEls.sizeUnit.addEventListener('change', boundHandler);
	inputEls.speedValue.addEventListener('input', sanitizeNumber(boundHandler));
	inputEls.speedUnit.addEventListener('change', boundHandler);

	// Trigger an initial call to our bound update handler to ensure the app is in a good state.
	boundHandler();
};

const updateHandler = (getInput, setOutput) => () => {
	const { sizeValue, sizeUnit, speedValue, speedUnit } = getInput();

	// Convert the value and unit input to raw bytes and bits/s values for estimation.
	const size = parseInt(sizeValue) * unitConversions.size[sizeUnit];
	const speed = parseInt(speedValue) * unitConversions.speed[speedUnit];

	// Perform estimation and set output.
	const { time, date } = estimate(size, speed);
	setOutput(time, date);
};

// Attach the setup function to run once the page is loaded.
window.addEventListener('load', bindElements);
