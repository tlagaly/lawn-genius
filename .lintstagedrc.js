module.exports = {
  // Lint & format TypeScript and JavaScript files
  '**/*.(ts|tsx|js)': (filenames) => [
    `eslint --fix ${filenames.join(' ')}`,
    `prettier --write ${filenames.join(' ')}`
  ],

  // Format MarkDown and JSON files
  '**/*.(md|json)': (filenames) => `prettier --write ${filenames.join(' ')}`,

  // Check types for TypeScript files
  '**/*.ts?(x)': () => 'tsc --noEmit',
};