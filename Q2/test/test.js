const { expect } = require("chai");
const { ethers } = require("hardhat");
const fs = require("fs");
const { groth16, plonk } = require("snarkjs");

function unstringifyBigInts(o) {
    if ((typeof(o) == "string") && (/^[0-9]+$/.test(o) ))  {
        return BigInt(o);
    } else if ((typeof(o) == "string") && (/^0x[0-9a-fA-F]+$/.test(o) ))  {
        return BigInt(o);
    } else if (Array.isArray(o)) {
        return o.map(unstringifyBigInts);
    } else if (typeof o == "object") {
        if (o===null) return null;
        const res = {};
        const keys = Object.keys(o);
        keys.forEach( (k) => {
            res[k] = unstringifyBigInts(o[k]);
        });
        return res;
    } else {
        return o;
    }
}

describe("HelloWorld", function () {
    let Verifier;
    let verifier;

    beforeEach(async function () {
        Verifier = await ethers.getContractFactory("HelloWorldVerifier");
        verifier = await Verifier.deploy();
        await verifier.deployed();
    });

    it("Should return true for correct proof", async function () {
        //[assignment] Add comments to explain what each line is doing
        const { proof, publicSignals } = await groth16.fullProve({"a":"1","b":"2"}, "contracts/circuits/HelloWorld/HelloWorld_js/HelloWorld.wasm","contracts/circuits/HelloWorld/circuit_final.zkey");

        console.log('1x2 =',publicSignals[0]);

        const editedPublicSignals = unstringifyBigInts(publicSignals);
        const editedProof = unstringifyBigInts(proof);
        const calldata = await groth16.exportSolidityCallData(editedProof, editedPublicSignals);
    
        const argv = calldata.replace(/["[\]\s]/g, "").split(',').map(x => BigInt(x).toString());
    
        const a = [argv[0], argv[1]];
        const b = [[argv[2], argv[3]], [argv[4], argv[5]]];
        const c = [argv[6], argv[7]];
        const Input = argv.slice(8);

        expect(await verifier.verifyProof(a, b, c, Input)).to.be.true;
    });
    it("Should return false for invalid proof", async function () {
        let a = [0, 0];
        let b = [[0, 0], [0, 0]];
        let c = [0, 0];
        let d = [0]
        expect(await verifier.verifyProof(a, b, c, d)).to.be.false;
    });
});


describe("Multiplier3 with Groth16", function () {
    let Verifier;
    let verifier;

    beforeEach(async function () {
        Verifier = await ethers.getContractFactory("Multiplier3Verifier");
        verifier = await Verifier.deploy();
        await verifier.deployed();
    });

    it("Should return true for correct proof", async function () {
        const { proof, publicSignals } = await groth16.fullProve({"in1":"1","in2":"2","in3":"3"}, "contracts/circuits/Multiplier3/Multiplier3_js/Multiplier3.wasm","contracts/circuits/Multiplier3/circuit_final.zkey");
        console.log('1x2X3 =',publicSignals[0]);
       
        const editedPublicSignals = unstringifyBigInts(publicSignals);
        const editedProof = unstringifyBigInts(proof);
        const calldata = await groth16.exportSolidityCallData(editedProof, editedPublicSignals); //taken groth16
    
        const argv = calldata.replace(/["[\]\s]/g, "").split(',').map(x => BigInt(x).toString());//split values

        const a = [argv[0], argv[1]];//divide arguments and sending proof mechanism
        const b = [[argv[2], argv[3]], [argv[4], argv[5]]];
        const c = [argv[6], argv[7]];
        const Input = argv.slice(8);

        expect(await verifier.verifyProof(a, b, c, Input)).to.be.true;
    });
    it("Should return false for invalid proof", async function () {
        let a = [0, 0];
        let b = [[0, 0], [0, 0]];
        let c = [0, 0];
        let d = [0]
        expect(await verifier.verifyProof(a, b, c, d)).to.be.false;
    });
});


describe("Multiplier3 with PLONK", function () {
    let Verifier;
    let verifier;

    beforeEach(async function () {
        Verifier = await ethers.getContractFactory("PlonkVerifier");
        verifier = await Verifier.deploy();
        await verifier.deployed();
    });

    it("Should return true for correct proof", async function () {
        const { proof, publicSignals } = await plonk.fullProve({"in1":"1","in2":"2","in3":"3"}, "contracts/circuits/Multiplier3_plonk/Multiplier3_js/Multiplier3.wasm","contracts/circuits/Multiplier3_plonk/circuit_final.zkey");
        console.log('1x2X3 =',publicSignals[0]);
    
        const editedPublicSignals = unstringifyBigInts(publicSignals);
        const editedProof = unstringifyBigInts(proof);
        const calldata = await plonk.exportSolidityCallData(editedProof, editedPublicSignals);

        const argv = calldata.replace(/["[\]\s]/g, "").split(',');
        let x=[];
        x.push(argv[1]);
        expect(await verifier.verifyProof(argv[0], x)).to.be.true;
        //expect(await verifier.verifyProof('0x2e7b5665439dd66e04b65735113f4086c62210bae78642e199f029b0e1b4da3a0d33ca8b23d608313af60626d4d3737e8551f1d3ba2770b464cf32394456f50f2dd88096dca0714b7ad14060d8eb778b43c8618ba24789db035a01f884ce68c109f2f1833201d1c3b184378efeb07d035a0a6dc4765d163d81fb9c8a57ac15680ebb85d9168e8d51d523b880cc9febcdc200bcb458c20a28f8d0fc90feee60191b42277b8fcf1fc94bb758d95e26e2d74b4d81c2a9cb2c0bfe63516dc814ba4b2ac773a3f0916a8417d2f5719414befb4fc3fed2fdead1157458c8a296957fb2275f4d9f94bec2329ad7ed722499bb5cc8e5b150d64193f00b83ef4b7b2adc412e30971d73f0269842d99f7efeaf25efd27bb90fb986c9dd39bcc12cbf89b1762acb37607562bc5fd0de7e7eace9c03baf4257aad24d176bc3a8afbba41c8d241a692dffc9aac584a7e57631400c3b86bf17214118891750be4efb81182f8e7319dcb38935bd65642c5708d07ff5ecddf4c29596a6ba04b0a02976c0dff8879f157fc4e71bfbd03708439f099a46c79841c0f597eaae13a4d0cd25bbe0faf0661cd750ce05bd00b911064d58a776aec890f8534eec0d8faa2e16d9ee39c9c85d24c4f97ed491ee6aae81bfa1b8250e09586cdd6f5fb6db0d9ac88860c89a68371421d3c4802f7fb445db0d55a03aa62cd1458019ad9b37f32ea216f1e3f99c042d1ea9f8df7d66b146f2a6c91841afd9768c5f8edeb1b9709aec92e3d881a5f0072e55ea8cda851228d104bf6d166743a083ed9b014ae13295f4e367fa99799109af57fa6afdca774dc22cab2990e833165e735ac5edb68cad309edef9d0afa91f444877fe6fa880e418bc30bbbce07337904590f273cc99aa1d6a0626d2d96b2106f34689c27dfe9073157e920a478c6ed01611bebedcd9a532ba23f48224711d65b0723814a72c7177669f854ceb310c6da51424fd6d12b5147eecf6bc0b4d0ae65557db938b5cfef00ddbe4648ce07c5be0aaa63b35917fd3d18f84e7fd5e1fc77f7ec1e2d20f30b1889ad3be0d4b5ce4e639f810bb3a6af5e87cab6e83c918fd30bc3fd23c1c1942a3eb6d0e062144940ba4606ab987d0cfc35e362a2fe8', ['0x0000000000000000000000000000000000000000000000000000000000000006'])).to.be.true;
    });
    it("Should return false for invalid proof", async function () {
        let a = '0x00';
        let b = ['0'];
        expect(await verifier.verifyProof(a, b)).to.be.false;
    });
});