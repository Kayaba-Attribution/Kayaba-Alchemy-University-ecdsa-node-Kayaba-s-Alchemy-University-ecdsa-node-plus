<script lang="ts">
	import { onMount } from 'svelte';
	import { faker } from '@faker-js/faker';

	let number: number;
	let receipt: object;
	let curAddress: string;
	let destAddress: string;

	let allBalances: object;
	let allTxns = [];

	onMount(async () => {
		getAllbalances();
		getAllTxns();
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
		allBalances = {};
		const params = new URLSearchParams({
			address: 'all'
		});
		const response = await fetch(`/node?${params}`);
		allBalances = await response.json();
	}

	async function getAllTxns() {
		allBalances = {};
		const params = new URLSearchParams({
			address: 'txns'
		});
		const response = await fetch(`/node?${params}`);
		allTxns = await response.json();
	}

	async function transfer() {
		const response = await fetch(`/node?`, {
			method: 'POST',
			body: JSON.stringify({
				from: curAddress,
				to: destAddress,
				amount: amount
			}),
			headers: {
				'content-type': 'application/json'
			}
		});

		receipt = await response.json();
		balanceOf();
		getAllbalances();
		getAllTxns();
	}
</script>

<div class="m-12">
	<div class="flex justify-center items-start gap-4">
		<div class="w-1/3 p-4 card flex justify-center items-center">
			<div class="overflow-x-auto bg-primary-focus p-2 rounded-lg">
                <div class="text-xl font-bold m-4">Node Ledger</div>
				<table class="table table-zebra w-64">
					<thead>
						<tr>
							<th>#</th>
							<th>Address</th>
							<th>Balance</th>
							<th>Load From</th>
							<th>Load To</th>
						</tr>
					</thead>
					<tbody>
						{#if allBalances != undefined}
							{#each Object.entries(allBalances) as record, i}
								<tr>
									<td>{i + 1}</td>
									<td>{record[0]}</td>
									<td>{record[1]}</td>
									<td
										><div
											class="btn btn-circle btn-primary"
											on:click={() => {
												curAddress = record[0];
												balanceOf();
											}}
										>
											➕
										</div></td
									>
									<td
										><div
											class="btn btn-circle btn-secondary"
											on:click={() => {
												destAddress = record[0];
												balanceOf();
											}}
										>
											➕
										</div></td
									>
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
		</div>
		<div class="w-2/3 p-4 grid grid-cols-2 justify-center items-left mr-12">
			<div class="border-8 border-primary p-8 rounded-lg mx-10">
				<div class="text-xl font-bold m-4">Your Wallet</div>
				<div class="text-md my-2 text-left">Private Key</div>
				<input
					type="text"
					bind:value={curAddress}
					on:input={balanceOf}
					on:change={balanceOf}
					placeholder="Enter or load Private Key"
					class="input input-bordered input-info w-full max-w-xs"
				/>

				<div class="text-md my-2 text-left">
					Address: {curAddress == undefined ? 'None' : curAddress}
				</div>
				<div class="input input-bordered input-success w-full max-w-xs bg-base-100">
					<p class="mt-3">
						Your Balance is: {number == undefined ? 0 : number}
					</p>
				</div>
			</div>

			<div class="border-8 border-secondary p-8 rounded-lg mx-10">
				<div class="text-xl font-bold m-4">Transfer</div>
				<div class="text-md my-2 text-left">Send Amount</div>
				<input
					type="number"
					bind:value={amount}
					placeholder="Amount to Send"
					class="input input-bordered input-info w-full max-w-xs"
				/>

				<div class="text-md my-2 text-left">
					Recipient Address: {destAddress == undefined ? 'None' : destAddress}
				</div>
				<input
					class="input input-bordered input-success w-full max-w-xs bg-base-100"
					type="text"
					bind:value={destAddress}
					placeholder="Recipient Wallet"
				/>
				<div class="btn my-4 max-w-xs " on:click={transfer}>transfer</div>
			</div>

            <div class="col-span-2 justify-center mt-10">
                <div class="text-xl font-bold m-4 text-center ">Last 4 Transactions</div>
                {#if allTxns.length != 0}
                    <div class="flex flex-wrap gap-2 justify-center">
                        {#each allTxns.reverse() as tx, i}
                            {#if i < 4}
                                <!-- content here -->
        
                                <div class="w-64 h-64 bg-base-200 p-5 rounded-lg">
                                    <div class="font-extrabold text- text-center mb-2 text-primary">TX # {tx.id}</div>
                                    <div>
                                        Amount: {tx.amount}
                                    </div>
                                    <div class="font-bold">From:</div>
                                    <div>
                                        {tx.from} [{tx.fromInit} => {tx.fromEnd}]
                                        <span class="badge badge-error badge-outline">{tx.fromEnd - tx.fromInit}</span>

                                    </div>
                                    <div class="font-bold">To:</div>
                                    <div>
                                        {tx.to} [{tx.toInit} => {tx.toEnd}] 
                                        <span class="badge badge-success badge-outline">+ {tx.toEnd - tx.toInit}</span>
                                    </div>
                                    <div class="font-bold">Timestamp:</div>
                                    <div>
                                        {tx.timestamp}
                                    </div>
                                </div>
                            {/if}
                        {/each}
                    </div>
                {:else}
                <div class="text-xl font-lg m-4 text-center ">Make Some Txns!</div>
                {/if}
            </div>
		</div>
	</div>
</div>
