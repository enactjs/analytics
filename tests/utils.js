function initContainer() {
	const container = document.createElement('div');
	container.id = 'root';
	document.body.appendChild(container);
	return container;
}

function leftClick(node) {
	const evt = new MouseEvent('click', {
		bubbles: true,
		buttons: 1,
		which: 1
	});
	node.dispatchEvent(evt)
}

function enterKeydown(node) {
	const evt = new KeyboardEvent('keydown', {
		bubbles: true,
		keyCode: 13,
		which: 13,
		charCode: 13,
		key: 'Enter',
		code: 'Enter'
	});
	node.focus();
	node.dispatchEvent(evt)
}

export {
	initContainer,
	leftClick,
	enterKeydown
};
