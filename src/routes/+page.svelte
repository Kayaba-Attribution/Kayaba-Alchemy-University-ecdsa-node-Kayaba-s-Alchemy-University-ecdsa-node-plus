<script lang="ts">
	import { onMount } from 'svelte';

	let number: number;
	let receipt: object;
	let curAddress: string;
	let allBalances: object;

	onMount(async () => {
		getAllbalances();
	});

	let sender, recipient, amount: string;

	async function balanceOf() {
		const params = new URLSearchParams({
			address: curAddress
		});
		const response = await fetch(`/node?${params}`);
		number = await response.json();
	}

	async function getAllbalances() {
        allBalances = {}
		const params = new URLSearchParams({
			address: 'all'
		});
		const response = await fetch(`/node?${params}`);
		allBalances = await response.json();
	}

	async function transfer() {
		const response = await fetch(`/node?`, {
			method: 'POST',
			body: JSON.stringify({
				from: sender,
				to: recipient,
				amount: amount
			}),
			headers: {
				'content-type': 'application/json'
			}
		});

		receipt = await response.json();
		balanceOf();
        getAllbalances()
	}
</script>

<div class="text-xl font-bold">Ledger</div>
<div class="overflow-x-auto">
	<table class="table table-zebra w-64">
		<!-- head -->
		<thead>
			<tr>
				<th>#</th>
				<th>Address</th>
				<th>Balance</th>
			</tr>
		</thead>
		<tbody>
			{#if allBalances != undefined}
				{#each Object.entries(allBalances) as record, i}
					<tr>
						<td>{i + 1}</td>
						<td>{record[0]}</td>
						<td>{record[1]}</td>
					</tr>
				{/each}
			{:else}
				<tr>
					<th><progress class="progress w-10" /></th>
					<td><progress class="progress w-10" /></td>
					<td><progress class="progress w-10" /></td>
				</tr>
			{/if}
		</tbody>
	</table>
</div>

<div class="btn" on:click={balanceOf}>Roll the dice</div>
<div class="btn" on:click={getAllbalances}>Refresh Balances</div>

<input type="string" bind:value={curAddress} on:input={balanceOf} />
<p>Your Balance is: {number == undefined ? 0 : number}</p>

<input type="string" bind:value={sender} />
<input type="string" bind:value={recipient} />
<input type="number" bind:value={amount} />

<div class="btn" on:click={transfer}>transfer</div>

<div class="hero min-h-screen bg-base-200">
	<div class="hero-content flex-col lg:flex-row">
		<img src="https://placeimg.com/260/400/arch" class="max-w-sm rounded-lg shadow-2xl" />
		<div>
			<h1 class="text-5xl font-bold">Box Office News!</h1>
			<p class="py-6">
				Provident cupiditate voluptatem et in. Quaerat fugiat ut assumenda excepturi exercitationem
				quasi. In deleniti eaque aut repudiandae et a id nisi.
			</p>
			<button class="btn btn-primary">Get Started</button>
		</div>
	</div>
</div>
