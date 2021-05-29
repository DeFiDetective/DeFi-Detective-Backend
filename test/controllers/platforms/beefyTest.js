const Beefy = require('./beefyfinance');
let bf = new Beefy("./cache/");

(async() => {
    console.log("-> start test");

    // await bf.getRawFarms();
    // await bf.getApys();  

    // await bf.getTvl(true);

    await bf.getData();

    console.log("-> test finished");
})();