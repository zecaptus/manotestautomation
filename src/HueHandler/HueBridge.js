const fetch = require("node-fetch");
const child_process = require("child_process");
const { writeEnv } = require("../utils");

const {
  npm_package_name: HUE_USERNAME,
  HUE_INTERNAL_SERVER_IP,
  HUE_APIKEY
} = process.env;
const SERVER_IP_URL = "https://www.meethue.com/api/nupnp";

class HueBridge {
  static async isValidBridgeIp(ip) {
    try {
      const response = await fetch(`http://${ip}/api`);
      return response.status === 200;
    } catch (e) {
      return false;
    }
  }

  constructor(ip, apiKey) {
    this.apiKey = apiKey || HUE_APIKEY;
    this.ip = ip || HUE_INTERNAL_SERVER_IP;
  }

  async connect() {
    this.ip = await this.setBridgeIP(this.ip);

    await this.synchronize();
    console.log("HUE Handler ready !");
  }

  async getLights() {
    try {
      const response = await fetch(
        `http://${this.ip}/api/${this.apiKey}/lights`
      );
      return await response.json();
    } catch (e) {
      console.error(e);
    }
  }

  /**
   * Set HUE internal server IP from .env
   * If not set, we fetching it.
   * @param {*} value
   */
  async setBridgeIP(value) {
    if (!value) {
      console.log("Hue internal server IP not found\nGetting it ...");
      return await this.getBridgeIp();
    } else {
      console.log("HUE internal server IP found : ", value);

      if (!await HueBridge.isValidBridgeIp(value)) {
        console.log(`${value} is unreachable\nGetting another ...`);
        return await this.getBridgeIp();
      } else {
        return value;
      }
    }
  }

  /**
   * Get HUE internal server IP.
   * Actually we get only the first found,
   * check what's happens when we have more than one HUE server.
   */
  async getBridgeIp() {
    try {
      const response = await fetch(SERVER_IP_URL);
      const data = await response.json();
      const ip = data[0].internalipaddress;

      console.log("HUE internal server IP found : ", ip);
      writeEnv(`HUE_INTERNAL_SERVER_IP=${ip}\n`);
      return ip;
    } catch (e) {
      console.error("Unable to fetch HUE internal server IP\n", e);
    }
  }

  async synchronize() {
    if (!this.apiKey) {
      console.log("Press Bridge button then press enter to synchronize ...");
      child_process.spawnSync("read _ ", {
        shell: true,
        stdio: [0, 1, 2]
      });

      try {
        const data = { devicetype: HUE_USERNAME };
        const response = await fetch(`http://${this.serverIP}/api`, {
          method: "POST",
          body: JSON.stringify(data),
          headers: { "Content-Type": "application/json" }
        });
        const json = await response.json();
        this.apiKey = json[0].success.username;

        writeEnv(`HUE_APIKEY=${this.apiKey}\n`);
      } catch (e) {
        console.error("Failed to synchronize\n", e, "\nRetrying...");
        this.synchronize();
      }
    }
  }
}

module.exports = HueBridge;
