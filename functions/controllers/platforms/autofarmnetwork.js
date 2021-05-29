// Call APY data from Autofarm.network
// implementation like farm.army (https://github.com/farm-army/farm-army-backend/blob/master/src/platforms/autofarm/autofarm.js)

const request = require('got');
const fs = require('fs');
const { table } = require('console');

const url = 'https://static.autofarm.network/bsc/farm_data.json';

const farmName = "Autofarm Network";

var cachePathRawFarms, cachePathData;

module.exports = class autofarm {
  constructor(cachePath) {
    cachePathRawFarms = cachePath + "autofarmRawData.json";
    cachePathData = cachePath + "autofarmData.json";
  }

  async getRawFarms(refresh = false) {
    if (!refresh) {
      // try to load cached data about the pools
      // check first if the file exists
      let isCache;
      if (fs.existsSync(cachePathRawFarms)) {
        isCache = true;
        console.log("Autofarm farm data | cache available");
      } else {
        isCache = false;
        console.log("Autofarm farm data | cache unavailable");
      }

      if (isCache) {
        // load cache
        let data = fs.readFileSync(cachePathRawFarms, 'utf8');
        console.log("cache loaded");
        return JSON.parse(data);
      }
    }

    // no cache available OR refresh wanted --> load data from website
    console.log("calling Autofarm farm data ...");
    var poolsResponse;
    try {
      poolsResponse = await request(url);
    } catch(e) {
      console.error(url, e.message);
    }

    let pools = JSON.parse(poolsResponse.body);
    // pools = pools["pools"];

    // save the pool data for later usage
    var json = JSON.stringify(pools);
    fs.writeFileSync(cachePathRawFarms, json, 'utf8');
    console.log('Autofarm cache saved');

    return pools;  
  }

  // get formated data about Autofarm farms
  async getData(refresh = false) {
    if (!refresh) {
      let isCache;
      if (fs.existsSync(cachePathData)) {
        isCache = true;
        console.log("Autofarm full data | cache available");
      } else {
        isCache = false;
        console.log("Autofarm full data | cache unavailable");
      }

      if (isCache) {
        //load cache
        let d = fs.readFileSync(cachePathData, 'utf8');
        console.log("cache loaded");
        return JSON.parse(d);
      }
    }

    // no cache available OR refresh wanted --> update the data from the farms
    let raw = await this.getRawFarms(refresh);
    var rawFarms = raw["pools"];

    let tableData = raw["table_data"];
    var tvlMap = {};
    for (let i = 0; i < tableData.length; ++i) {
      tvlMap[tableData[i][0]] = tableData[i][4];
    }

    // data will be stored in a json file
    var data = {};

    for (const key of Object.keys(rawFarms)) {
      const farm = rawFarms[key];

      if (!farm.display || farm.display !== true) {
        continue;
      }

      let address = farm.farmContractAddress;

      // convert the farm name to a list of assets
      let assetsString = farm.wantName;
      assetsString = assetsString.split(' ')[0];
      let assets = assetsString.split('-');

      let buyUrl = "https://exchange.pancakeswap.finance/#/swap?outputCurrency=" + farm.wantAddress;
      
      data[address] = {
        "name": farm.wantName,
        "farmName": farmName,
        "type": !farm.wantIsLP ? "single" : "lp",
        "assets": assets,
        "apy": farm.APY,
        "tvl": tvlMap[key],
        "logo": "", 
        "underlyingPlatform": farm.farmName,
        "buyTokenUrl": buyUrl,
      };
    }

    // store in a json file
    var json = JSON.stringify(data);
    fs.writeFileSync(cachePathData, json, 'utf8');

    return data;
  }

}