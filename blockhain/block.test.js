const Block = require('./block');
const {DIFFICULTY, MINE_RATE} = require('../config');
const hexToBinary = require('hex-to-binary') ;

describe('Block', () => {
    let data, lastBlock, block;

    beforeEach(() => {
        data = 'bar';
        lastBlock = Block.genesis();
        block = Block.mineBlock(lastBlock, data);
    });
        
    it('sets the `data` to match the input', () => {
        expect(block.data).toEqual(data);
    });
        
    it('sets the `lastHash` to match the hash of the last block', () => {
        expect(block.lastHash).toEqual(lastBlock.hash);
    });

    it('generates a hash that matches the difficulty', () => {
        expect(hexToBinary(block.hash).substring(0, block.difficulty)).toEqual('0'.repeat(block.difficulty));
    });

    it('it lowers the difficulty for slowly mined blocks', () => {
        expect(Block.adjustDifficulty(block, block.timestamp + MINE_RATE + 100))
            .toEqual(block.difficulty - 1);
    });

    it('raises the difficulty for quickly mined blocks', () => {
        expect(Block.adjustDifficulty(block, block.timestamp + MINE_RATE - 100))
        .toEqual(block.difficulty + 1);
    });

    it('adjusts the difficulty', () => {
        const possibleResult = [
            lastBlock.difficulty + 1,
            lastBlock.difficulty - 1
        ];

        expect(possibleResult.includes(block.difficulty)).toBe(true);
    });

    it('has a lower limit of 1', () => {
        block.difficulty = -1;

        expect(Block.adjustDifficulty(block)).toEqual(1);
    });
});
