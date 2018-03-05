require("dotenv").config();
const inquirer = require("inquirer");
const { getDebugModules } = require("./src/utils");
const path = "./src/";

/**
 * List all debug modules and execute the choosen one.
 */
async function debugMode() {
  const choices = await getDebugModules(path);
  const { file } = await inquirer.prompt({
    type: "list",
    name: "file",
    message: "Choose a module to debug:",
    choices
  });
  require(`./src/${file}/debug`)();
}

if (process.argv.includes("--debug")) debugMode();
