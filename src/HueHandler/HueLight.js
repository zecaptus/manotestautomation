const fetch = require("node-fetch");

class HueLight {
  static modelid() {
    return ["LWB006"];
  }

  constructor(id, bridge, info) {
    this.id = id;
    this.bridge = bridge;
    this.options = ["on", "brightness"];

    Object.keys(info).forEach(key => (this[key] = info[key]));
  }

  async on(value) {
    await this.update({ on: value });
  }

  async brightness(value) {
    await this.update({ bri: value });
  }

  toString() {}

  async update(data) {
    const { ip, apiKey } = this.bridge;

    if (!this.state.reachable) {
      return console.error(
        `Not reachable, make sure ${this.name} is powered !`
      );
    }

    try {
      const response = await fetch(
        `http://${ip}/api/${apiKey}/lights/${this.id}/state`,
        {
          method: "PUT",
          body: JSON.stringify(data),
          headers: { "Content-Type": "application/json" }
        }
      );

      const json = await response.json();
      const path = Object.keys(json[0].success)[0];
      const pathArray = path.split("/");
      const key = pathArray[pathArray.length - 1];

      this.state[key] = json[0].success[path];
    } catch (e) {
      console.error(e);
    }
  }
}

module.exports = HueLight;
