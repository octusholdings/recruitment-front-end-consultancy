module.exports = RedefineNode = () => {
	if ( ! window.Node ) window.Node = {};
    if ( ! Node.ELEMENT_NODE ) Node.ELEMENT_NODE = 1;
}