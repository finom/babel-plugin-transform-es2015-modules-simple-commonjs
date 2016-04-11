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
							if(declaration.type == 'FunctionDeclaration') {
								if(declaration.node.id) {
									path.replaceWithMultiple ([
										buildExportsAssignment(declaration.node.id),
										declaration.node
									]);
								} else {
									path.replaceWith(buildExportsAssignment(t.toExpression(declaration.node)));
								}
							} else {
								path.replaceWith(buildExportsAssignment(declaration.node));
							}
						}

						if (path.isImportDeclaration()) {
							let specifiers = path.node.specifiers;
							if (specifiers.length == 0) {
								anonymousSources.push(buildRequire(path.node.source));
							} else if (specifiers.length == 1 && specifiers[0].type == 'ImportDefaultSpecifier') {
								sources.push(t.variableDeclaration("var", [
									t.variableDeclarator(t.identifier(specifiers[0].local.name), buildRequire(
										path.node.source
									).expression)
								]));
							} else {
								let importedID = path.scope.generateUidIdentifier(path.node.source.value);

								sources.push(t.variableDeclaration("var", [
									t.variableDeclarator(importedID, buildRequire(
										path.node.source
									).expression)
								]));

								specifiers.forEach(({imported, local}) => {
									sources.push(t.variableDeclaration("var", [
										t.variableDeclarator(t.identifier(local.name), t.identifier(importedID.name + '.' + imported.name))
									]));
								});
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
