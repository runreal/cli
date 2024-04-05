export const render = (template: string, data: any) => {
	const templateWithDefaults = template.replace(/\$\{([^}]+)\}/g, (_match, keyPath) => {
		const keys = keyPath.split('.')
		const defaultValue = `'${keyPath}'`
		let expression = 'data'
		for (const key of keys) {
			expression += `?.['${key}']`
		}
		return `\${${expression} !== undefined ? ${expression} : ${defaultValue}}`
	})

	return new Function('data', `return \`${templateWithDefaults}\`;`)(data)
}
