import 'better-log/install';
import template from "babel-template";

let buildModule = template(`
	IMPORTS;
	BODY;
`);

let buildRequire = template(`
 	require($0);
`);

let buildExportsAssignment = template(`
 	module.exports = $0;
`);


module.exports = function({
	types: t
}) {
	return {
		visitor: {
			Program: {
				exit(path, file) {
					let body = path.get("body"),
						sources = [],
						anonymousSources = [];

					for (let path of body) {
						if (path.isExportDefaultDeclaration()) {
							let declaration = path.get("declaration");
							path.replaceWith(buildExportsAssignment(declaration.node));
						}

						if (path.isImportDeclaration()) {
							let specifiers = path.node.specifiers;

							if (specifiers.length == 0) {
								anonymousSources.push(buildRequire(path.node.source));
							} else if (specifiers.length == 1) {
								sources.push(t.variableDeclaration("var", [
									t.variableDeclarator(t.identifier(specifiers[0].local.name), buildRequire(
										path.node.source
									).expression)
								]));
							} else {
								throw Error(`Not allowed to use more than one import specifiers`);
							}

							path.remove();
						}
					}

					path.node.body = buildModule({
						IMPORTS: sources.concat(anonymousSources),
						BODY: path.node.body
					});
				}
			}
		}
	};
};
