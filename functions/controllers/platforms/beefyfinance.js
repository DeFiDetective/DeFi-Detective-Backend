// Call APY data from Beefy Finance (https://www.beefy.finance/)
// using the way like farm.army (https://github.com/farm-army/farm-army-backend/blob/master/src/platforms/beefy/beefy.js)

// http request with module 'got'
const request = require("got");
const fs = require("fs");

const urlApy = 'https://api.beefy.finance/apy';
const urlTvl = 'https://api.beefy.finance/tvl';
const urlIds = 'https://raw.githubusercontent.com/beefyfinance/beefy-app/master/src/features/configure/vault/bsc_pools.js';

const farmName = "Beefy Finance";

var cachePathRawPools, cachePathApys, cachePathTvl, cachePathData;

module.exports = class beefy {

  // cachePath will be handed over
  constructor(cachePath) {
    cachePathRawPools = cachePath + "beefyRawPoolData.json";
    cachePathApys = cachePath + "beefyPoolApys.json";
    cachePathTvl = cachePath + "beefyPoolTvl.json";
    cachePathData = cachePath + "beefyData.json";
  }

  // receiving the raw data from the beefy farms
  async getRawFarms(refresh = false) {
    if (!refresh) {
      // try to load cached data about the pools
      // check first if the file exists
      let isCache;
      if (fs.existsSync(cachePathRawPools)) {
        isCache = true;
        console.log("Beefy farm data | cache available");
      } else {
        isCache = false;
        console.log("Beefy farm data | cache unavailable");
      }

      if (isCache) {
        // load cache
        let data = fs.readFileSync(cachePathRawPools, 'utf8');
        console.log("cache loaded");
        return JSON.parse(data);
      }
    }

    // no cache available OR refresh wanted --> load data from website
    console.log("calling beefy farm data ...");
    var poolsResponse;
    try {
      poolsResponse = await request(urlIds);
    } catch(e) {
      console.error(urlIds, e.message);
    }
    const pools = Object.freeze(
      eval(
        // remove the beginning --> is now in JSON format
        poolsResponse.body.replace(/export\s+const\s+bscPools\s+=\s+/, "")
      ).filter(p => {
        return p.status === "active" || p.depositsPaused !== false;
      })
    );

    // save the pool data for later usage
    var json = JSON.stringify(pools);
    fs.writeFileSync(cachePathRawPools, json, 'utf8');
    console.log('beefy cache saved');
    
    return pools;
  }

  // receiving pool APYs from the beefy farms
  async getApys(refresh = false) {
    let apys = {};

    if (!refresh) {
      let isCache;
      if (fs.existsSync(cachePathApys)) {
        isCache = true;
        console.log("Beefy Apy data | cache available");
      } else {
        isCache = false;
        console.log("Beefy Apy data | cache unavailable");
      }

      if (isCache) {
        // load cache
        let data = fs.readFileSync(cachePathApys, 'utf8');
        console.log("cache loaded");
        return JSON.parse(data);
      }
    }

    // no cache available OR refresh wanted --> call data from API
    var dataApy;
    try {
      dataApy = await request(urlApy);
    } catch(e) {
      console.error(urlApy, e.message);
    }
    apys = JSON.parse(dataApy.body);

    // save Apy data for later
    var json = JSON.stringify(apys);
    fs.writeFileSync(cachePathApys, json, 'utf8');
    console.log("beefy apys cache saved");

    return apys;
  }

  // receiving pool TVL from the beefy farms
  async getTvl(refresh = false) {
    let tvl = {};

    if (!refresh) {
      let isCache;
      if (fs.existsSync(cachePathTvl)) {
        isCache = true;
        console.log("Beefy TVL data | cache available");
      } else {
        isCache = false;
        console.log("Beefy TVL data | cache unavailable");
      }

      if (isCache) {
        // load cache
        let data = fs.readFileSync(cachePathTvl, 'utf8');
        console.log("cache loaded");
        return JSON.parse(data);
      }
    }

    // no cache available OR refresh wanted --> call data from API
    var dataTvl;
    try {
      dataTvl = await request(urlTvl);
    } catch(e) {
      console.error(urlTvl, e.message);
    }
    tvl = JSON.parse(dataTvl.body);

    // use the data after the key "56" 
    // "56" stands for Binance Smart Chain
    tvl = tvl["56"];

    // save TVL data for later
    var json = JSON.stringify(tvl);
    fs.writeFileSync(cachePathTvl, json, 'utf8');
    console.log("beefy tvl cache saved");

    return tvl;
  }

  // get formated data about beefy farms
  async getData(refresh = false) {
    if (!refresh) {
      let isCache;
      if (fs.existsSync(cachePathData)) {
        isCache = true;
        console.log("Beefy Full Data | cache available");
      } else {
        isCache = false;
        console.log("Beefy Full Data | cache unavailable");
      }

      if (isCache) {
        // load cache
        let d = fs.readFileSync(cachePathData, 'utf8');
        console.log("cache loaded");
        return JSON.parse(d);
      }
    }

    // no cache available OR refresh wanted --> update the data from the farms
    let rawFarms = await this.getRawFarms(refresh);
    let apys = await this.getApys(refresh);
    let tvl = await this.getTvl(refresh);

    // data will be stored in a json file 
    var data = {};

    for (let raw of rawFarms) {
      let address = raw.earnContractAddress;
      data[address] = {
        "name": raw.name, 
        "farmName": farmName,
        "type": raw.oracle == "tokens" ? "single" : "lps",
        "assets": raw.assets,
        "apy": apys[raw.id],
        "tvl": tvl[raw.id],
        "logo": raw.logo,
        "buyTokenUrl": raw.buyTokenUrl,
        "addLiquidityUrl": raw.addLiquidityUrl
      };
    }

    // store in a json file
    var json = JSON.stringify(data);
    fs.writeFileSync(cachePathData, json, 'utf8');

    return data;
  }
}