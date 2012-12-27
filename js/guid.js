if (!window.guid) {
	// Generate a pseudo-GUID by concatenating random hexadecimal.
	window.guid = (function() {
		// Generate four random hex digits.
		function S4 () {
		    return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
		}
		return function () {
			return (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4());
		};
	}) ();
}