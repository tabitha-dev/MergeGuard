# dist placeholder

Run `npm install && npm run build` before publishing the action.

GitHub JavaScript actions require the compiled `dist/index.js` file to be committed for release tags.
This generated package includes the full TypeScript source and build configuration, but the bundled dist file must be produced after installing dependencies.
