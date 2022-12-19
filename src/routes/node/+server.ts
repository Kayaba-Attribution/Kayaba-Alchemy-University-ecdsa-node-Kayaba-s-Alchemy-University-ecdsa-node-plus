import { json } from '@sveltejs/kit';
import { error } from '@sveltejs/kit';

import * as secp from "ethereum-cryptography/secp256k1";
import { keccak256 } from "ethereum-cryptography/keccak";
import { utf8ToBytes, toHex } from "ethereum-cryptography/utils";


interface Ledger {
	[address: string]: number;
}

let txnsCounter = 1;
const txns = []



/**
	wallet address : {
		privateKey: data.privateKey,
		publicKey: data.publicKey,
		balance: getRandomInt(0,100)
	}
 */

let ledger: Ledger = {

};

const generateWallet = () => {
	const priKey = toHex(secp.utils.randomPrivateKey());
	const pubKey = toHex(secp.getPublicKey(priKey));
	const wallet = toHex(keccak256(utf8ToBytes(pubKey).slice(1)).slice(-20));

	return {
		wallet: wallet,
		privateKey: priKey,
		publicKey: pubKey,
	}
}

const fillLedger = (n) => {
	for(let i = 0; i < n; i++){
		let data = generateWallet()
		ledger[data.wallet] = {
			privateKey: data.privateKey,
			publicKey: data.publicKey,
			balance: getRandomInt(1,20)
		}
		console.log(ledger)
	}
}

if (Object.keys(ledger).length == 0) fillLedger(5);

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return (Math.floor(Math.random() * (max - min + 1)) + min) * 10;
}


function setInitialBalance(address: string) {
	console.log(!ledger[address])
	if (!ledger[address]) {
		ledger[address] = {
			privateKey: "???",
			publicKey: "???",
			balance: 0
		}
	}
}

/** @type {import('./$types').RequestHandler} */
export function GET({ url }) {
	const address = url.searchParams.get('address')
	if (address == 'all') {
		return json(ledger);
	}
	if (address == 'txns') {
		return json(txns);
	}
	const balance = ledger[address].balance || 0;
	return json(balance);
}


/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
	const { from, to, amount } = await request.json();

	setInitialBalance(from);
	setInitialBalance(to);

	console.log(from, to, amount)
	const fromInit = ledger[from].balance;
	const toInit = ledger[to].balance;

	if (ledger[from].balance < amount) {
		return json(`Not enough funds! Balance: ${ledger[from].balance} & Amount: ${amount}`)
	} else {
		ledger[from].balance -= amount;
		ledger[to].balance += amount;
		txns.push(
			{
				id: txnsCounter,
				from: from,
				to: to,
				amount: amount,
				fromInit: fromInit,
				toInit: toInit,
				fromEnd: ledger[from].balance,
				toEnd: ledger[to].balance,
				timestamp: Date.now()
			}
		)
		txnsCounter++
		return json("success");
	}
}
