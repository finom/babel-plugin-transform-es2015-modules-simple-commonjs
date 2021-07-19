const template = require('@babel/template').default;

let buildRequire = template(`
 	require(SOURCE);
`);

let buildRequireDefault = template(`
 	require(SOURCE).default;
`);

let buildExportsAssignment = template(`
 	module.exports = EXPORT;
`);

let buildNamedExportsAssignment = template(`
	exports.NAME = EXPORT;
`);

let buildExportAll = template(`
	for(var NAME in EXPORTS) {
		if (NAME !== "default") {
			exports[NAME] = EXPORTS[NAME];
		}
	}
`);

module.exports = function({
	types: t
}) {
	return {
		inherits: require("@babel/plugin-transform-strict-mode").default,
		visitor: {
			Program: {
				exit(path, file) {
					let sources = [],
						anonymousSources = [],
						{ scope } = path,
						hasDefaultExport = false,
						hasNamedExports = false,
						lastExportPath = null;

					// rename these commonjs variables if they're declared in the file
					scope.rename("module");
					scope.rename("exports");
					scope.rename("require");

					let body = path.get("body");

					function addSource(path) {
						let importedID = path.scope.generateUidIdentifier(path.node.source.value);

						sources.push(t.variableDeclaration("var", [
							t.variableDeclarator(importedID, buildRequire({ SOURCE: path.node.source }).expression)
						]));

						return importedID;
					}

					for (let path of body) {
						if (path.isExportDefaultDeclaration()) {
							hasDefaultExport = true;
							lastExportPath = path;
							let declaration = path.get("declaration");
							if(declaration.type == 'FunctionDeclaration') {
								if(declaration.node.id) {
									path.replaceWithMultiple ([
										buildExportsAssignment({ EXPORT: declaration.node.id }),
										declaration.node
									]);
								} else {
									path.replaceWith(buildExportsAssignment({ EXPORT: t.toExpression(declaration.node) }));
								}
							} else {
								path.replaceWith(buildExportsAssignment({ EXPORT: t.toExpression(declaration.node) }));
							}
							continue;
						}

						if (path.isImportDeclaration()) {
							let specifiers = path.node.specifiers;
							let is2015Compatible = path.node.source.value.match(/@babel\/runtime[\\\/]/);
							if (specifiers.length == 0) {
								anonymousSources.push(buildRequire({ SOURCE: path.node.source }));
							} else if (specifiers.length == 1 && specifiers[0].type == 'ImportDefaultSpecifier') {
								let template = is2015Compatible ? buildRequireDefault : buildRequire;
								sources.push(t.variableDeclaration("var", [
									t.variableDeclarator(t.identifier(specifiers[0].local.name), template ({ SOURCE: path.node.source }).expression)
								]));
							} else {
								let importedID = addSource(path);

								specifiers.forEach(({imported, local}) => {
									if (!imported || (!is2015Compatible && imported.name === 'default')) {
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
							lastExportPath = path;
							let declaration = path.get("declaration");

							// if we are exporting a class/function/variable
							if (declaration.node) {
								hasNamedExports = true;
								if (declaration.isFunctionDeclaration()) {
									let id = declaration.node.id;
									path.replaceWithMultiple([
										declaration.node,
										buildNamedExportsAssignment({ NAME: id, EXPORT: id })
									]);
								} else if (declaration.isClassDeclaration()) {
									let id = declaration.node.id;
									path.replaceWithMultiple([
										declaration.node,
										buildNamedExportsAssignment({ NAME: id, EXPORT: id })
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
											init.replaceWith(buildNamedExportsAssignment({ NAME: id.node, EXPORT: init.node }).expression);
										}
									}
									path.replaceWith(declaration.node);
								}
								continue;
							}

							// if we are exporting already instantiated variables
							let specifiers = path.get("specifiers");
							if (specifiers.length) {
								let nodes = [];
								let source = path.node.source;
								let importedID;
								if (source) {
									// export a from 'b';
									// 'b' is the source
									importedID = addSource(path);
								}

								for (let specifier of specifiers) {
									if (specifier.isExportSpecifier()) {
										let local = specifier.node.local;

										// if exporting from we need to modify the local lookup
										if (importedID) {
											if (local.name === 'default') {
												local = importedID;
											} else {
												local = t.memberExpression(importedID, local);
											}
										}

										// if exporting to default, its module.exports
										if (specifier.node.exported.name === 'default') {
											hasDefaultExport = true;
											nodes.push(buildExportsAssignment({ EXPORT: local }));
										} else {
											hasNamedExports = true;
											nodes.push(buildNamedExportsAssignment({ NAME: specifier.node.exported, EXPORT: local }));
										}
									}
								}

								path.replaceWithMultiple(nodes);
							}
							continue;
						}

						if (path.isExportAllDeclaration()) {
						   // export * from 'a';
						   let importedID = addSource(path);
						   let keyName = path.scope.generateUidIdentifier(importedID.name + "_key")

						   path.replaceWithMultiple(buildExportAll({ EXPORTS: importedID, NAME: keyName }));
					   }
					}

					if (hasNamedExports && hasDefaultExport) {
						throw lastExportPath.buildCodeFrameError('The simple-commonjs plugin does not support both a export default and a export named in the same file. This is because the module.exports would override any export');
					}

					path.unshiftContainer("body", sources.concat(anonymousSources));
				}
			}
		}
	};
};
