const Blockchain = require('./index');
const Block = require('./block');
const Wallet = require('../wallet');
const Transaction = require('../wallet/transaction');
const util = require('../util');

describe('Blockchain', () => {
  let bc, bc2, errorMock, logMock;

  beforeEach(() => {
    errorMock = jest.fn();
    logMock = jest.fn();
    bc = new Blockchain();
    bc2 = new Blockchain();

    global.console.error = errorMock;
    global.console.log = logMock;
  });

  it('starts with the genesis block', () => {
	  expect(bc.chain[0]).toEqual(Block.genesis());
  });

  it('adds a new block', () => {
    const data = 'foo';
    bc.addBlock({data});

    expect(bc.chain[bc.chain.length-1].data).toEqual(data);
  });

  it('validates a valid chain', () => {
    bc2.addBlock({data: 'foo'});

    expect(bc.isValidChain(bc2.chain)).toBe(true);
  });

  it('invalidates a chain with a corrupt genesis block', () => {
    bc2.chain[0].data = 'Bad data';
    expect(bc.isValidChain(bc2.chain)).toBe(false);
  });

  it('invalidates a corrupt chain', () => {
    bc2.addBlock({data: 'foo'});
    bc2.chain[1].data = 'Not foo';

    expect(bc.isValidChain(bc2.chain)).toBe(false);
  });

  it('replaces the chain with a valid chain', () => {
    bc2.addBlock({data: 'goo'});
    bc.replaceChain(bc2.chain);
    expect(bc.chain).toEqual(bc2.chain);
  });

  it('does not replace the chain with one of less than or equal length', () => {
    bc.addBlock({data: 'foo'});
    bc.replaceChain(bc2.chain);
    expect(bc.chain).not.toEqual(bc2.chain);
  });

  it('the chain contains a block with with a jumped difficulty', () => {
    const lastBlock = bc.chain[bc.chain.length-1];
    const lastHash = lastBlock.hash;
    const timestamp = Date.now();
    const nonce = 0;
    const data = [];
    const difficulty = lastBlock.difficulty -3;

    const hash = Block.hash(timestamp, lastHash, data, nonce, difficulty);
    const badBlock = new Block(timestamp, lastBlock, hash, data, nonce, difficulty);

    bc.chain.push(badBlock);
    expect(bc.isValidChain(bc.chain)).toBe(false);
  });


  describe('validTransactionData()', () => {
    let transaction, rewardTransaction, wallet;

    beforeEach(() => {
      wallet = new Wallet();
      transaction = wallet.createTransaction({ recipient: 'foo-address', amount: 65 });
      rewardTransaction = Transaction.rewardTransaction({ minerWallet: wallet });
    });


    describe('and the transaction data is valid', () => {
      it('returns true', () => {
        bc2.addBlock({ data: [transaction, rewardTransaction] });

        expect(bc.validTransactionData({ chain: bc2.chain })).toBe(true);
      });
    });

    describe('and the transaction data has multiple rewards', () => {
      it('returns false and logs an error', () => {
        bc2.addBlock({ data: [transaction, rewardTransaction, rewardTransaction] });

        expect(bc.validTransactionData({ chain: bc2.chain })).toBe(false);
        expect(errorMock).toHaveBeenCalled();
      });
    });

    describe('and the transaction data has at least one malformed outputMap', () => {
      describe('and the transaction is not a reward transaction', () => {
        it('returns false and logs an error', () => {
            transaction.outputMap[wallet.publicKey] = 999999;

            bc2.addBlock({data: [transaction, rewardTransaction]});

            expect(bc.validTransactionData({ chain: bc2.chain })).toBe(false);
            expect(errorMock).toHaveBeenCalled();
        });
      });

      describe('and the transaction is a reward transaction', () => {
        it('returns false and logs an error', () => {
          rewardTransaction.outputMap[wallet.publicKey] = 9999999;

          bc2.addBlock({data: [transaction, rewardTransaction]});

          expect(bc.validTransactionData({ chain: bc2.chain })).toBe(false);
          expect(errorMock).toHaveBeenCalled();
        });
      });
    });

    describe('and the transaction data has at least one malformed input', () => {
      it('returns false and logs an error', () => {
          wallet.balance = 9000;

          const evilOutputMap = {
            [wallet.publicKey]: 8900,
            fooRecipient: 100
          };

          const evilTransaction = {
            input: {
              timestamp: Date.now(),
              amount: wallet.balance,
              address: wallet.publicKey,
              signature: wallet.sign(evilOutputMap)
            },
            outputMap: evilOutputMap
          };

          bc2.addBlock({ data: [evilTransaction, rewardTransaction]});
          expect(bc.validTransactionData({ chain: bc2.chain })).toBe(false);
          expect(errorMock).toHaveBeenCalled();
      });
    });

    describe('and a block contains multiple identical transactions', () => {
      it('returns false and logs an error', () => {
        bc2.addBlock({
          data: [transaction, transaction, transaction, rewardTransaction]
        });
        
        expect(bc.validTransactionData({ chain: bc2.chain })).toBe(false);
        expect(errorMock).toHaveBeenCalled();
      });
    });
  })
}); 