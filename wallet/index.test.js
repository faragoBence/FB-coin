const Wallet = require('./index');
const { verifySignature } = require('../util');
const Transaction = require('./transaction');
const BlockChain = require('../blockhain');
const { STARTING_BALANCE } = require('../config');

describe('Wallet', () => {
    let wallet;

    beforeEach(() =>{
        wallet = new Wallet();
    });

    it('has a ballance', () => {
        expect(wallet).toHaveProperty('balance');
    });

    it('has a publicKey', () => {
        expect(wallet).toHaveProperty('publicKey');
    });

    describe('signing data', () => {
        const data = 'foobar';
    
        it('verifies a signiture', () => {
            expect(
                verifySignature({
                    publicKey : wallet.publicKey,
                    data,
                    signature : wallet.sign(data)
                })
            ).toBe(true);
        });
    
        it('does not verify an invalid signature', () => {
            expect(
                verifySignature({
                    publicKey : wallet.publicKey,
                    data,
                    signature : new Wallet().sign(data)
                })
            ).toBe(false);
        });
    });

    describe('createTransaction()', () => {
        describe('and the amount exceeds the balance', () => {
            it('throws an error', () => {
                expect(() => wallet.createTransaction({ amount: 9999999, recipient:'foo-recipient' })
                    .toThrow('Amount exceeds balane'));
            });
        });

        describe('and the amount is valid', () => {
            let transaction, amount, recipient;

            beforeEach(() => {
                amount = 50;
                recipient = 'foo-recipient';
                transaction = wallet.createTransaction({ amount, recipient });
            });

            it('creates an instance of Transaction', () => {
                expect(transaction instanceof Transaction).toBe(true);
            });

            it('matches the transaction input with the wallet', () => {
                expect(transaction.input.address).toEqual(wallet.publicKey);
            });

            it('outputs the amount the recipient', () => {
                expect(transaction.outputMap[recipient]).toEqual(amount);
            });
        });

        describe('and a chain is passed', () => {
            it('calls Wallet.calculateBalance()', () => {
                const calculateBalanceMock = jest.fn();
                const originalCalculateBalance = Wallet.calculateBalance;
                Wallet.calculateBalance = calculateBalanceMock;

                wallet.createTransaction({
                    recipient: 'foo',
                    amount: 10,
                    chain: new BlockChain().chain
                });

                expect(calculateBalanceMock).toHaveBeenCalled();

                Wallet.calculateBalance = originalCalculateBalance;
            });
        });
    });

    describe('calculateBalance()', () => {
        let blockchain;

        beforeEach(() => {
            blockchain = new BlockChain();
        });

        describe('and there are no outputh for the wallet', () => {
            it('returns the STRATING_BANACE', () => {
                expect(
                    Wallet.calculateBalance({
                        chain: blockchain.chain,
                        address: wallet.publicKey
                    })
                ).toEqual(STARTING_BALANCE);
            });
        });


        describe('and there are outputs for the wallet', () => {
            let transactionOne, transactionTwo;

            beforeEach(() => {
                transactionOne = new Wallet().createTransaction({
                    recipient: wallet.publicKey,
                    amount: 50
                });

                transactionTwo = new Wallet().createTransaction({
                    recipient: wallet.publicKey,
                    amount: 60
                });

                blockchain.addBlock({ data: [transactionOne, transactionTwo] });
            });

            

            it('adds the sum of all outputs to the wallet balance', () => {

                expect(
                    Wallet.calculateBalance({
                    chain: blockchain.chain,
                    address: wallet.publicKey
                })).toBe(
                    STARTING_BALANCE + 
                    transactionOne.outputMap[wallet.publicKey] + 
                    transactionTwo.outputMap[wallet.publicKey]
                );
            });
        });

        describe('and the walelt has made a transaction', () =>{
            let recentTransaction;

            beforeEach(() => {
                recentTransaction = wallet.createTransaction({
                    recipient: 'foo',
                    amount: 30
                });

                blockchain.addBlock({data: [recentTransaction] });
            });


            it('returns the output amount of the recent transaction', () => {
                expect(
                    Wallet.calculateBalance({
                        chain: blockchain.chain,
                        address: wallet.publicKey
                    })
                ).toEqual(recentTransaction.outputMap[wallet.publicKey]);
            });

            describe('and there are outputs nect to and after the recent transaction', () => {
                let sameBlockTransaction, nextBlockTransaction;

                beforeEach(() => {
                    recentTransaction = wallet.createTransaction({
                        recipient: 'later-foo',
                        amount:60
                    });

                    sameBlockTransaction = Transaction.rewardTransaction({minerWallet : wallet });

                    blockchain.addBlock({ data: [recentTransaction, sameBlockTransaction] });

                    nextBlockTransaction = new Wallet().createTransaction({
                        recipient: wallet.publicKey, amount:75
                    });

                    blockchain.addBlock({ data: [nextBlockTransaction] });
                });

                it('includes the output amounts in the returned balance', () => {
                    expect(Wallet.calculateBalance({
                        chain: blockchain.chain,
                        address: wallet.publicKey
                    })).toEqual(
                        recentTransaction.outputMap[wallet.publicKey] +
                        sameBlockTransaction.outputMap[wallet.publicKey] +
                        nextBlockTransaction.outputMap[wallet.publicKey]
                    );
                });
            });
    });

});

});




