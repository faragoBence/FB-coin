const {cryptohash} = require('../util');
const {DIFFICULTY, MINE_RATE} = require('../config');
const hexToBinary = require('hex-to-binary') ;

class Block {
    constructor(timestamp, lastHash, hash, data, nonce, difficulty) {
        this.timestamp = timestamp;
        this.lastHash = lastHash;
        this.hash = hash;
        this.data = data;
        this.nonce = nonce;
        this.difficulty = difficulty || DIFFICULTY;
    }

    toString() {
     return `Block =
        TimeStamp:   ${this.timestamp}
        LastHash:    ${this.lastHash.substring(0, 10)}
        Hash:        ${this.hash.substring(0, 10)}
        Nonce:       ${this.nonce}
        Difficulty:  ${this.difficulty}
        Data:        ${this.data}`;
    }

    static genesis() {
        return new this('Genesis time', '------', 'f1r57-h45z', [], 0, DIFFICULTY);
    }

    static mineBlock(lastBlock, data) {
        const lastHash = lastBlock.hash;
        let {difficulty} = lastBlock;
        let hash, timestamp;
        let nonce = 0;

        do {
            nonce++;
            timestamp = Date.now();
            difficulty = Block.adjustDifficulty(lastBlock, timestamp);
            hash = Block.hash(timestamp, lastHash, data, nonce, difficulty);
        } 
        while(hexToBinary(hash).substring(0, difficulty) !== '0'.repeat(difficulty));

        return new this(timestamp, lastHash, hash, data, nonce, difficulty);
    }

    static hash(timestamp, lastHash, data, nonce, difficulty) {
        return cryptohash(timestamp, lastHash, data, nonce, difficulty);
    }

    static blockHash(block) {
        const {timestamp, lastHash, data, nonce, difficulty} = block;
        return Block.hash(timestamp, lastHash, data, nonce, difficulty);
    }

    static adjustDifficulty(lastBlock, timestamp) {
        let {difficulty} = lastBlock;

        if(difficulty < 1) return 1;
        if(timestamp - lastBlock.timestamp > MINE_RATE) return difficulty - 1;
        return difficulty + 1;
    }

}

module.exports = Block;