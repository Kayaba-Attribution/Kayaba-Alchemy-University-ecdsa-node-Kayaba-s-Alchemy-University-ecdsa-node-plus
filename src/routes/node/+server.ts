import { json } from '@sveltejs/kit';
import { error } from '@sveltejs/kit';

interface Balances {
	[address: string]: number;
}

let txnsCounter = 1;
const txns = []

const balances: Balances = {
	"0x1": 100,
	"0x2": 50,
	"0x3": 75,
};

function setInitialBalance(address: string) {
	if (!balances[address]) {
		balances[address] = 0;
	}
}

/** @type {import('./$types').RequestHandler} */
export function GET({ url }) {
	const address = url.searchParams.get('address')
	if (address == 'all'){
		return  json(balances);
	}
	if (address == 'txns'){ 
		return  json(txns);
	}
	const balance = balances[address] || 0;
	return json(balance);
}


/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
	const { from, to, amount } = await request.json();

	setInitialBalance(from);
	setInitialBalance(to);

	console.log(from, to, amount)
	const fromInit = balances[from];
	const toInit = balances[to];

	if (balances[from] < amount) {
		return json(`Not enough funds! Balance: ${balances[from]} & Amount: ${amount}`)
	} else {
		balances[from] -= amount;
		balances[to] += amount;
		txns.push(
			{
				id: txnsCounter,
				from: from,
				to: to,
				amount: amount,
				fromInit: fromInit,
				toInit: toInit,
				fromEnd: balances[from],
				toEnd: balances[to],
				timestamp: Date.now()
			}
		)
		txnsCounter++
		return json("success");
	}
}
