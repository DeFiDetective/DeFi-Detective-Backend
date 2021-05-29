const Beefy = require('../../../functions/controllers/platforms/beefyfinance');
let bf = new Beefy("../../../functions/controllers/platforms/cache/");

(async() => {
    console.log("-> start test");

    // await bf.getRawFarms();
    // await bf.getApys();  

    // await bf.getTvl(true);

    await bf.getData();

    console.log("-> test finished");
})();