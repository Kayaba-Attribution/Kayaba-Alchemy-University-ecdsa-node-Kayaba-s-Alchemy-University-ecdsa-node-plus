import { json } from '@sveltejs/kit';
import { error } from '@sveltejs/kit';

interface Balances {
	[address: string]: number;
}

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
	const balance = balances[address] || 0;
	return json(balance);
}


/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
	const { from, to, amount } = await request.json();

	setInitialBalance(from);
	setInitialBalance(to);

	console.log(from, to, amount)

	if (balances[from] < amount) {
		throw error(400, 'Not enough funds!');
	} else {
		balances[from] -= amount;
		balances[to] += amount;
		return json(balances[from]);
	}
}
