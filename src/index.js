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

let buildNamedExportsAssignment = template(`
	exports.$0 = $1;
`);

module.exports = function({
	types: t
}) {
	return {
		inherits: require("babel-plugin-transform-strict-mode"),
		visitor: {
			Program: {
				exit(path, file) {
					let body = path.get("body"),
						sources = [],
						anonymousSources = [],
						{ scope } = path,
						hasDefaultExport = false,
						hasNamedExports = false,
						lastExportPath = null;

					// rename these commonjs variables if they're declared in the file
					scope.rename("module");
					scope.rename("exports");
					scope.rename("require");

					for (let path of body) {
						if (path.isExportDefaultDeclaration()) {
							hasDefaultExport = true;
							lastExportPath = path;
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
							continue;
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
									if (!imported || imported.name === 'default') {
										sources.push(t.variableDeclaration("var", [
											t.variableDeclarator(t.identifier(local.name), t.identifier(importedID.name))
										]));
									} else {
										sources.push(t.variableDeclaration("var", [
											t.variableDeclarator(t.identifier(local.name), t.identifier(importedID.name + '.' + imported.name))
										]));
									}
								});
							}

							path.remove();
							continue;
						}
						if (path.isExportNamedDeclaration()) {
							hasNamedExports = true;
							lastExportPath = path;
							let declaration = path.get("declaration");
							if (declaration.node) {
								if (declaration.isFunctionDeclaration()) {
									let id = declaration.node.id;
									path.replaceWithMultiple([
										declaration.node,
										buildNamedExportsAssignment(id, id)
									]);
								} else if (declaration.isClassDeclaration()) {
									let id = declaration.node.id;
									path.replaceWithMultiple([
										declaration.node,
										buildNamedExportsAssignment(id, id)
									]);
								} else if (declaration.isVariableDeclaration()) {
									let declarators = declaration.get("declarations");
									for (let decl of declarators) {
										let id = decl.get("id");

										let init = decl.get("init");
										if (!init.node) {
											init.replaceWith(t.identifier("undefined"));
										}

										if (id.isIdentifier()) {
											init.replaceWith(buildNamedExportsAssignment(id.node, init.node).expression);
										}
									}
									path.replaceWith(declaration.node);
								}
								continue;
							}

							let specifiers = path.get("specifiers");
							if (specifiers.length) {
							  let nodes = [];
								for (let specifier of specifiers) {
									if (specifier.isExportSpecifier()) {
										if (specifier.node.exported.name === 'default') {
											nodes.push(buildExportsAssignment(specifier.node.local));
										} else {
											nodes.push(buildNamedExportsAssignment(specifier.node.exported, specifier.node.local));
										}
									}
								}
								path.replaceWithMultiple(nodes);
							}
						}
					}

					if (hasNamedExports && hasDefaultExport) {
						throw lastExportPath.buildCodeFrameError('The simple-commonjs plugin does not support both a export default and a export named in the same file. This is because the module.exports would override any export');
					}

					if (sources.length || anonymousSources.length) {
						path.node.body = buildModule({
							IMPORTS: sources.concat(anonymousSources),
							BODY: path.node.body,
						});
					}
				}
			}
		}
	};
};
