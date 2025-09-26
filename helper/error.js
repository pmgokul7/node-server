// helper/error.js
import fs from 'fs';
import path from 'path';

// Read the JSON file synchronously
const errorlist = JSON.parse(
  fs.readFileSync(path.resolve('./helper/errors.json'), 'utf-8')
);

class CustomError extends Error {
  constructor(code) {
    // assuming errorlist is an array with one object: errorlist[0]
    const errors = errorlist[0];
    const { error, code: statusCode } = errors[code] || {};
    super(error || 'Unknown error');
    this.code = code;
    this.statusCode = statusCode || 500;
  }
}

export const throwCustomError = (code) => {
  throw new CustomError(code);
};
