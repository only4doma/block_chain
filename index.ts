import * as crypto from 'crypto';

class Transaction {
    constructor (
        public amount: number,
        public payer: string,   // used as public key
        public payee: string    // used as public key
    ){}
    
    toString() {
        return JSON.stringify(this);
    }
}

class Block {

    public nonce = Math.round(Math.random() * 999999999);

    constructor (
        public prevHash: string,
        public transaction: Transaction,
        public ts = Date.now()
    ){}

    get hash() {
        const str = JSON.stringify(this);
        const hash = crypto.createHash('SHA256');
        hash.update(str).end();
        return hash.digest('hex');
    }
}

class Chain {
    public static instance = new Chain();

    chain: Block[];

    constructor() {
        this.chain = [
            // Genesis block
            new Block('', new Transaction(100, 'rohan', 'manoj'))
        ];
    }

    get lastBlock() {
        return this.chain[this.chain.length - 1];
    }

    mine(nonce: number) {
        let solution = 1;
        console.log('⛏️  mining...');

        while(true) {
            const hash = crypto.createHash('MD5');
            hash.update((nonce + solution).toString()).end();

            const attempt = hash.digest('hex');

            if(attempt.substring(0, 4) === '0000'){
                console.log(`solved ${solution}`);
                return solution;
            }
            solution += 1;
        }
    }

    addBlock(transaction: Transaction, senderPublicKey: string, signature: Buffer) {
        const verifier = crypto.createVerify('SHA256');
        verifier.update(transaction.toString());

        const isValid = verifier.verify(senderPublicKey, signature);

        if(isValid){
            const newBlock = new Block(this.lastBlock.hash, transaction);
            this.mine(newBlock.nonce);
            this.chain.push(newBlock);
        }
    }
}

class Wallet {
    public publicKey: string;   // for recieving money
    public privateKey: string;  // for sapending money

    // constructor() {
    //     const keyPair = crypto.generateKeyPairSync('rsa', {
    //         moduluslength: 2048,
    //         publicKeyEncoding: { type: 'spki', format: 'pem' },
    //         privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    //     });
    //     this.publicKey = keyPair.publicKey;
    //     this.privateKey = keyPair.privateKey;
    // }

    constructor() {
        const keypair = crypto.generateKeyPairSync('rsa', {
          modulusLength: 2048,
          publicKeyEncoding: { type: 'spki', format: 'pem' },
          privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
        });
    
        this.privateKey = keypair.privateKey;
        this.publicKey = keypair.publicKey;
      }

    sendMoney(amount: number, payeePublicKey: string) {
        const transaction = new Transaction(amount, this.publicKey, payeePublicKey);

        const sign = crypto.createSign('SHA256');
        sign.update(transaction.toString()).end();

        const signature = sign.sign(this.privateKey);
        Chain.instance.addBlock(transaction, this.publicKey, signature);
    }
}

// usage 

const rohan = new Wallet();
const manoj = new Wallet();
const manish = new Wallet();

rohan.sendMoney(50, manoj.publicKey);
manoj.sendMoney(100, manish.publicKey);
manish.sendMoney(75, rohan.publicKey);

console.log(Chain.instance);