<script lang="ts">
	// Made by Kayaba_Attribution Dec 19 2022
	import { onMount } from 'svelte';
	import { faker } from '@faker-js/faker';

	import * as secp from 'ethereum-cryptography/secp256k1';
	import { keccak256 } from 'ethereum-cryptography/keccak';
	import { utf8ToBytes, toHex } from 'ethereum-cryptography/utils';

	// Placeholders

	let number: number; // Balance of current address
	let curAddress: string; // Selected FROM Account
	let destAddress: string; // Selected TO Account
	let amount: number; // Amount to transfer

	onMount(async () => {
		// On Page Load
		getAllbalances();
		getAllTxns();
	});

	interface Ledger {
		[key: string]: {
			privateKey: string | undefined;
			publicKey: string | undefined;
			balance: number;
			nonce: number;
		};
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

    let allBalances: Ledger; // All Balances info pulled on load from server
	let allTxns: Transaction[] = []; // All Transactionsinfo pulled on load from server

    // Error Logic
	let claimError: string | unknown;
	function cleanError() {
		claimError = '';
	}

	// UI Helpers
	function displayAddress(addrs: string) {
		addrs = addrs.toString();
		return '0x' + addrs.slice(0, 4) + '...' + addrs.slice(36, 40);
	}

	function displayPrivateKey(k: string | undefined) {
		if (!k) return '???';
		k = k.toString();
		return '0x' + k.slice(0, 12) + '...';
	}

	// Reactive var to check mobile or desktop
	$: w = 0;

    // Custom Querys && Server Interaction
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
		if (!curAddress) {
			claimError = 'No FROM Wallet Selected';
			return;
		}

		if (!destAddress) {
			claimError = 'No FROM Wallet Selected';
			return;
		}

		if (amount <= 0 || amount == null) {
			claimError = 'Amount must be > 0';
			amount = 1;
			return;
		}

		// Hash the message details with nonce to avoid same hash
		const messageHash = keccak256(
			utf8ToBytes(destAddress + amount + JSON.stringify(allBalances[curAddress].nonce))
		);

		// Signed the message with the privateKey on the ledger (some are empty)
		let signedTxn;
		try {
			signedTxn = await secp.sign(messageHash, allBalances[curAddress].privateKey, {
				recovered: true
			});
		} catch (e) {
			claimError = e;
			return;
		}

		// Make the call to the server with the details
		const response = await fetch(`/node?`, {
			method: 'POST',
			body: JSON.stringify({
				from: curAddress,
				to: destAddress,
				amount: amount,
				signedTxn: signedTxn,
				nonce: allBalances[curAddress].nonce
			}),
			headers: {
				'content-type': 'application/json'
			}
		});

		// Check result and update info and/or errors
		let receipt = await response.json();

		if (receipt == 'success') {
			balanceOf();
			getAllbalances();
			getAllTxns();
			cleanError();
		} else {
			claimError = receipt;
		}
	}
</script>

<svelte:window bind:innerWidth={w} />

<div class="m-12">
	<!-- ERROR DISPLAYS $claimError variable and cleanError() erases it only on if claimError is not "" -->
	{#if claimError}
		<div class="toast toast-top toast-end">
			<div class="alert alert-error shadow-lg">
				<div class="flex items-center">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="stroke-current flex-shrink-0 h-6 w-6"
						fill="none"
						viewBox="0 0 24 24"
						><path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
						/></svg
					>
					<span class="ml-3 font-extrabold text-lg">Error: {claimError}</span>
				</div>
				<button class="btn btn-glass" on:click={() => cleanError()}> Close </button>
			</div>
		</div>
	{/if}

	{#if w < 1200}
		<!-- Alert for MOBILE -->
		<div class="flex justify-center items-center w-full h-full">
			<div class="text-xl font-bold m-4 text-center">This App is optimized for Desktop</div>
		</div>
		<div class="text-center">Make Sure to give it a try!</div>
	{:else}
		<!-- RENDER ON DESKTOP -->
		<div class="flex justify-center items-start gap-4">
			<!-- NODE LEDGER SPACE -->
			<div class="w-1/3 p-4 card flex justify-center items-center">
				<div class="overflow-x-auto bg-primary-focus p-2 rounded-lg">
					<div class="text-xl font-bold m-4">Node Ledger</div>
					<table class="table w-64">
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
										{#if curAddress == record[0]}
											<!-- content here -->
											<td
												class="bg-primary {record[1].privateKey
													? 'underline decoration-green-600 decoration-4 font-extrabold'
													: 'underline decoration-red-500 decoration-4'}">{i + 1}</td
											>
										{:else if destAddress == record[0]}
											<!-- else if content here -->
											<td
												class="bg-secondary {record[1].privateKey
													? 'underline decoration-green-600 decoration-4 font-extrabold'
													: 'underline decoration-red-500 decoration-4'}">{i + 1}</td
											>
										{:else}
											<!-- else content here -->
											<td
												class={record[1].privateKey
													? 'underline decoration-green-600 decoration-4 font-extrabold'
													: 'underline decoration-red-500 decoration-4'}>{i + 1}</td
											>
										{/if}
										<td>
											<!-- The button to open modal -->
											<label for="my-modal-{i}" class="btn">{displayAddress(record[0])}</label>

											<!-- Put this part before </body> tag -->
											<input type="checkbox" id="my-modal-{i}" class="modal-toggle" />
											<label for="my-modal-{i}" class="modal cursor-pointer">
												<label class="modal-box w-11/12 max-w-5xl" for="">
													<h3 class="text-lg font-bold">Info for {'0x' + record[0]}</h3>
													<p class="pt-4 truncate">Public Key: {'0x' + record[1].publicKey}</p>
													<p class="py-4">PrivateKey Key: {'0x' + record[1].privateKey}</p>
												</label>
											</label>
										</td>
										<td>{record[1].balance}</td>
										<!-- svelte-ignore a11y-click-events-have-key-events -->
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
										<td>
											<!-- svelte-ignore a11y-click-events-have-key-events -->
											<div
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

			<!-- USER INTERACTIONS DISPLAY AND TXNS -->
			<div class="w-2/3 p-4 grid grid-cols-2 justify-center items-left mr-12">
				<!-- YOUR WALLET -->
				<div class="border-8 border-primary p-8 rounded-lg mx-10">
					<div class="text-xl font-bold m-4">Your Wallet</div>
					<div class="text-md my-2 text-left">Private Key</div>
					<div>
						{allBalances[curAddress] == undefined
							? '---'
							: displayPrivateKey(allBalances[curAddress].privateKey)}
					</div>

					<div class="text-md my-2 text-left">
						Address: {curAddress == undefined ? 'None' : displayAddress(curAddress)}
					</div>
					<div class="text-md my-2 text-left">
						Nonce: {curAddress == undefined || allBalances[curAddress] == undefined
							? '---'
							: allBalances[curAddress].nonce}
					</div>
					<div class="input input-bordered input-success w-full max-w-xs bg-base-100">
						<p class="mt-3">
							Your Balance is: {number == undefined ? 0 : number}
						</p>
					</div>
				</div>

				<!-- TRANSFER -->
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
						Recipient Address: {destAddress == undefined ? 'None' : displayAddress(destAddress)}
					</div>
					<input
						class="input input-bordered input-success w-full max-w-xs bg-base-100"
						type="text"
						bind:value={destAddress}
						placeholder="Recipient Wallet"
					/>
					<div class="btn my-4 max-w-xs " on:click={transfer}>transfer</div>
				</div>

				<!-- TRANSACTIONS -->
				<div class="col-span-2 justify-center mt-10">
					<div class="text-xl font-bold m-4 text-center ">Last 4 Transactions</div>
					{#if allTxns.length != 0}
						<div class="flex flex-wrap gap-2 justify-center">
							{#each allTxns.reverse() as tx, i}
								{#if i < 4}
									<!-- content here -->

									<div class="w-64 h-64 bg-base-200 rounded-lg">
										<div class="font-extrabold text-xl text-center p-3 text-primary">
											TX # {tx.id}
										</div>
										<div class="px-4">
											<div class="font-bold">From:</div>
											<div>
												{displayAddress(tx.from)} <br /> [{tx.fromInit} => {tx.fromEnd}]
												<span class="badge badge-error badge-outline"
													>{tx.fromEnd - tx.fromInit}</span
												>
											</div>
											<div class="font-bold">To:</div>
											<div>
												{displayAddress(tx.to)} <br /> [{tx.toInit} => {tx.toEnd}]
												<span class="badge badge-success badge-outline"
													>+ {tx.toEnd - tx.toInit}</span
												>
											</div>
											<div class="font-bold">Timestamp:</div>
											<div>
												{tx.timestamp}
											</div>
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
	{/if}
</div>
