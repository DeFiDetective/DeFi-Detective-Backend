const Autofarm = require("../../../functions/controllers/platforms/autofarmnetwork");
let a = new Autofarm("../../../functions/controllers/platforms/cache/");

(async() => {
    console.log("-> start test");

    // await a.getRawFarms(true);

    // let s = "USDT-USDC-BUSD-DAI BLP";

    // s = s.split(' ')[0];

    // const words = s.split('-');

    // for (let w of words) {
    //     console.log(w);
    // }

    await a.getData(true);

    console.log("-> test finished");
})();