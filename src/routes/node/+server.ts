// Made by Kayaba_Attribution Dec 19 2022

import { json } from '@sveltejs/kit';
import { error } from '@sveltejs/kit';

import * as secp from "ethereum-cryptography/secp256k1";
import { keccak256 } from "ethereum-cryptography/keccak";
import { utf8ToBytes, toHex } from "ethereum-cryptography/utils";

const txns: Transaction[] = []

interface Ledger {
	[key: string]: {
		privateKey: string | undefined,
		publicKey: string | undefined,
		balance: number,
		nonce: number
	}
}

interface Transaction {
	id: number;
	from: string;
	to: string;
	amount: number;
	fromInit: number;
	toInit: number;
	fromEnd: number;
	toEnd: number;
	timestamp: number;
}

let txnsCounter = 1;

// Populated on Server Start using fillLedger(n)
const ledger: Ledger = {};

// Wallet Creation Utils
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

const generateWalletnoCredentials = () => {
	const priKey = toHex(secp.utils.randomPrivateKey());
	const pubKey = toHex(secp.getPublicKey(priKey));
	const wallet = toHex(keccak256(utf8ToBytes(pubKey).slice(1)).slice(-20));

	return {
		wallet: wallet,
		privateKey: undefined,
		publicKey: pubKey,
	}
}

const fillLedger = (n: number) => {

	for (let i = 0; i < n; i++) {
		let data;
		console.log(i)
		if (i < Math.floor(n / 2)) {
			data = generateWallet()
		} else {
			console.log("odd", n)

			data = generateWalletnoCredentials()
		}

		ledger[data.wallet] = {
			privateKey: data.privateKey,
			publicKey: data.publicKey,
			balance: getRandomInt(1, 20),
			nonce: 0
		}
		console.log(ledger)
	}
}

if (Object.keys(ledger).length == 0) fillLedger(5);

// Helpers
function hashMessage(message:string) {
	return keccak256((utf8ToBytes(message)))
}

function getRandomInt(min: number, max: number) {
	min = Math.ceil(min);
	max = Math.floor(max);
	return (Math.floor(Math.random() * (max - min + 1)) + min) * 10;
}

function setInitialBalance(address: string) {
	console.log(!ledger[address])
	if (!ledger[address]) {
		ledger[address] = {
			privateKey: undefined,
			publicKey: undefined,
			balance: 0,
			nonce: 0
		}
	}
}


// SERVER CORE

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
	const { from, to, amount, signedTxn, nonce } = await request.json();

	setInitialBalance(from);
	setInitialBalance(to);

	console.log(from, to, amount)

	const [signature, recoveryBit] = signedTxn;
	const messageHash = hashMessage(from + amount + JSON.stringify(nonce));
	console.log("HASH")

	const publicKey = secp.recoverPublicKey(
		messageHash,
		Uint8Array.from(Object.values(signature)),
		recoveryBit
	);

	// Verify the txn
	const verifyTxn = secp.verify(Uint8Array.from(Object.values(signature)), messageHash, publicKey);

	if (!verifyTxn) {
		return json("Could not verify the Txn");
	}


	const fromInit = ledger[from].balance;
	const toInit = ledger[to].balance;

	if (ledger[from].balance < amount) {
		return json(`Not enough funds! Balance: ${ledger[from].balance} & Amount: ${amount}`)
	} else {
		ledger[from].nonce += 1;
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
