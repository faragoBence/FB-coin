const { REWARD_INPUT, MINING_REWARD } = require('../config');
const Transaction = require('../wallet/transaction');
const Block = require('./block');
const Wallet = require('../wallet');

class BlockChain {
    constructor() {
        this.chain = [Block.genesis()];
    }

    addBlock({data}) {
        const block = Block.mineBlock(this.chain[this.chain.length-1], data);
        this.chain.push(block);

        return block;
    }

    isValidChain(chain) {
        if (JSON.stringify(chain[0]) !== JSON.stringify(Block.genesis())) {
            return false;
        }
        for(let i=1; i < chain.length; i++) {
            const block = chain[i];
            const lastBlock = chain[i-1];
            const lastDifficulty = lastBlock.difficulty;

            if (block.lastHash !== lastBlock.hash || 
                block.hash !== Block.blockHash(block)) {
                return false;
            }

            if (Math.abs(lastDifficulty - block.difficulty) > 1) {
                return false;
            }
        }

        return true;
    }

    replaceChain(newChain, validateTransaction, onSuccess) {
        if (newChain.length <= this.chain.length) {
            console.log('Received chain is not longer than the current chain.');
            return; 
        }
        else if (!this.isValidChain(newChain)) {
            console.log('The received chain is not valid.');
            return;
        }

        if (validateTransaction && !this.validTransactionData({ newChain })) {
            console.error('The incoming chain has invalid data');
            return;
        }

        if (onSuccess) {
            onSuccess();
        } 
        console.log('Replacing blockhain with the new chain.');
        this.chain = newChain;
    }

    validTransactionData({ chain }) {
        for (let i =1; i<chain.length; i++) {
            const block = chain[i];
            const transactionSet = new Set();
            let rewardTransactioNCount = 0;

            for (let transaction of block.data) {
                if (transaction.input.address === REWARD_INPUT.address) {
                    rewardTransactioNCount += 1;

                    if(rewardTransactioNCount > 1) {
                        console.error('Miner rewards exceed limit');
                        return false;
                    }

                    if (Object.values(transaction.outputMap)[0] !== MINING_REWARD) {
                        console.error('Miner reward amount invalid');
                        return false;
                    }
                } else {
                    if (!Transaction.validTransaction(transaction)) {
                        console.error('Invalid transaction');
                        return false;
                    }

                    const trueBalance = Wallet.calculateBalance({
                        chain: this.chain,
                        address: transaction.input.address
                    });

                    if (transaction.input.amount !== trueBalance) {
                        console.error('Invalid input amount');
                        return false;
                    }

                    if (transactionSet.has(transaction)) {
                        console.error('An identical transaction apperas more than once in the block');
                        return false;
                    } else {
                        transactionSet.add(transaction);
                    }
                }
            }

        }

        return true;
    } 
}

module.exports = BlockChain;