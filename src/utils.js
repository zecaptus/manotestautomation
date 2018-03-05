const { promisify } = require("util");
const fs = require("fs");
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

function writeEnv(data) {
  const file = process.cwd() + "/.env";
  fs.appendFileSync(file, data, { flag: "a+" });
}

/**
 * Array.filter but async
 * @param {*} array
 * @param {*} callback
 */
async function filter(array, callback) {
  const bools = await Promise.all(
    array.map(async (value, index) => {
      return await callback(value, index);
    })
  );
  const results = [];
  for (let i = 0; i < array.length; i++) {
    if (bools[i]) {
      results.push(array[i]);
    }
  }
  return results;
}

/**
 * parse /src directory and check module with a debug mode
 */
async function getDebugModules(path) {
  const dirs = await readdir(path);
  return await filter(dirs, async dir => {
    const stats = await stat(path + dir);

    if (stats.isDirectory()) {
      const module = await readdir(path + dir + "/");
      return module.includes("debug.js");
    }

    return false;
  });
}

module.exports = {
  filter,
  getDebugModules,
  writeEnv
};
