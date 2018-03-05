const inquirer = require("inquirer");
const { HueBridge, HueLight, HueRGBLight } = require("./index");
const chalk = require("chalk");
const cliWidth = require("cli-width");
const readline = require("readline");

const QUESTIONS = [
  {
    type: "list",
    name: "debug",
    message: "Choose a debug action :",
    pageSize: 10
  },
  {
    type: "list",
    name: "on",
    message: "on :",
    choices: ["true", "false"],
    when: ({ debug }) => debug === "on"
  },
  {
    type: "list",
    name: "working",
    message: "working :",
    choices: ["true", "false"],
    when: ({ debug }) => debug === "working"
  },
  {
    type: "list",
    name: "color",
    message: "color :",
    choices: ["green", "red"],
    when: ({ debug }) => debug === "color"
  },
  {
    type: "list",
    name: "effect",
    message: "effect :",
    choices: ["none", "colorloop"],
    when: ({ debug }) => debug === "effect"
  },
  {
    type: "input",
    name: "brightness",
    message: "brightness (0 - 254) :",
    when: ({ debug }) => debug === "brightness"
  },
  {
    type: "input",
    name: "saturation",
    message: "saturation (0 - 254) :",
    when: ({ debug }) => debug === "saturation"
  }
];

function header(obj) {
  process.stdout.write("\x1B[2J\x1B[0f\u001b[0;0H");

  function write(data) {
    process.stdout.write(chalk.bgBlue(" ".repeat(cliWidth())));
    readline.cursorTo(process.stdout, 0);
    console.log(chalk.white.bgBlue(data));
  }

  write(" 🛠  Debug Mode : 💡  HueHandler");
  write("");
  if (obj instanceof HueBridge) {
    const server = `Brige IP : ${obj.ip}`;
    const padding = Math.round((cliWidth() - server.length) / 2);
    const center = " ".repeat(padding);

    write(`${center}${server}`);
  } else {
    const light = "current light: ";
    const objstate = { ...obj.state };
    ["xy", "ct", "mode", "hue", "colormode"].forEach(
      key => delete objstate[key]
    );

    const state = JSON.stringify(objstate).replace(
      /:([^\,]*)[\,|}]/g,
      (a, b) => `:${chalk.bold.green(b)}${a.substr(-1)}`
    );
    const padding = Math.round(
      (cliWidth() - light.length - JSON.stringify(objstate).length - 2) / 2
    );
    const center = " ".repeat(padding);
    write(`${center}${light}${chalk.bold.green(obj.name)} | ${state}`);
  }

  write("\n");
}

async function debug(light) {
  header(light);

  const questions = QUESTIONS.filter(
    ({ name }) => light.options.includes(name) || name === "debug"
  );
  questions[0].choices = [
    ...light.options,
    new inquirer.Separator(),
    "go back",
    "exit"
  ];
  const answers = await inquirer.prompt(questions);

  switch (answers.debug) {
    case "on":
      await light.on(answers.on === "true");
      break;
    case "working":
      await light.working(answers.working === "true");
      break;
    case "color":
      await light.color(answers.color);
      break;
    case "effect":
      await light.effect(answers.effect);
      break;
    case "brightness":
      await light.brightness(parseInt(answers.brightness));
      break;
    case "saturation":
      await light.saturation(parseInt(answers.saturation));
      break;
    case "go back":
      return lightList();
    case "exit":
      return process.exit();
  }
  debug(light);
}

async function lightList() {
  const question = {
    type: "list",
    name: "light",
    message: "Choose a light to debug :"
  };
  const bridge = new HueBridge();
  await bridge.connect();

  header(bridge);

  const lights = await bridge.getLights();
  question.choices = [
    ...Object.keys(lights).map(
      light =>
        `${light} - ${lights[light].name} ${chalk.dim(
          chalk.italic(`(reachable: ${lights[light].state.reachable})`)
        )}`
    ),
    new inquirer.Separator(),
    "exit"
  ];

  let { light } = await inquirer.prompt(question);
  if (light === "exit") process.exit();

  const lightId = light.substr(0, 1);
  light = lights[lightId];

  const Light = HueRGBLight.modelid().includes(light.modelid)
    ? HueRGBLight
    : HueLight;

  await debug(new Light(lightId, bridge, light));
}

module.exports = lightList;
