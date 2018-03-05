const HueLight = require("./HueLight");
const { timeout } = require("../utils");

class HueRGBLight extends HueLight {
  static modelid() {
    return ["LLC020", "LST001"];
  }

  constructor(...args) {
    super(...args);
    this.animation = { timer: null, oldValue: this.state.sat, working: false };
    this.options = [
      ...this.options,
      "color",
      "saturation",
      "effect",
      "working"
    ];
  }

  async color(value) {
    const mapColor = {
      green: [0.2356, 0.6789],
      red: [0.675, 0.322]
    };
    await this.update({ xy: mapColor[value] });
  }
  async saturation(value) {
    await this.update({ sat: value });
  }
  async effect(value) {
    await this.update({ effect: value });
  }
  async working(value = this.animation.working, ratio = 1) {
    if (value && !this.animation.working)
      this.animation.oldValue = this.state.sat;
    this.animation.working = value;

    if (value) {
      await this.update({
        sat: ratio * 254,
        transitiontime: 5
      });
      this.animation.timer = setTimeout(
        () => this.working(this.animation.working, ratio ? 0 : 1),
        500
      );
    } else {
      clearTimeout(this.animation.timer);
      await this.update({ alert: "select", sat: this.animation.oldValue });
    }
  }
}

module.exports = HueRGBLight;
