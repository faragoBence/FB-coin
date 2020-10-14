//Created just for testing purposes

const Blockchain = require('../blockhain');
const blockChain = new Blockchain();


blockChain.addBlock({data: 'inital'});

let prevTimeStamp, nextTimeStamp, nextBlock, timeDiff, average;

const times = [];

for (let i=0; i<10000; i++) {
    prevTimeStamp = blockChain.chain[blockChain.chain.length-1].timestamp;

    blockChain.addBlock({data: 'block' + i});
    nextBlock = blockChain.chain[blockChain.chain.length-1];

    nextTimeStamp = nextBlock.timestamp;
    timeDiff = nextTimeStamp - prevTimeStamp;
    times.push(timeDiff);

    average = times.reduce((total, num) => (total + num)) / times.length;


    console.log(`
        Time to mine block: ${timeDiff}ms. 
        Difficulty: ${nextBlock.difficulty}. 
        Average time ${average}ms.
        Hash $block ${nextBlock.hash}`
    );
}