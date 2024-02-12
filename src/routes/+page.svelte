<script lang="ts">

	import { loadScript } from '$lib/utils/dom';
	import { enhance } from '$app/forms';

	const { form } = $props();

	let snapshot_list = $derived(form?.snapshot_list ?? []);
	let results = $state<Array<{
		id: string;
		result: {
			label: string;
			confidence: number
		}[];
	}>>([]);

	let loaded_script = false;
	let classifier;

	async function initClassifier() {
		if (!loaded_script) {
			loaded_script = true;
			await loadScript('https://unpkg.com/ml5@0.4.3/dist/ml5.min.js');
		}
		if (!classifier) {
			classifier = await window.ml5.imageClassifier('/human-model/model.json');
		}
	}

	$effect(() => {
		snapshot_list.forEach(({ id, snapshots }) => {
			snapshots.forEach(async (snapshot, index) => {
				const img = new Image();
				img.src = snapshot;
				img.onload = async () => {
					const result = await classifier.classify(img);
					results.push({
						id: `${id}-${index}`,
						result
					});
				};
			});
		});
	});

	$inspect(results);
</script>

{#await initClassifier()}
	<p class="alert">Loading...</p>
{:then _}
	<form action="" method="post" use:enhance>
		<button class="btn" type="submit">
			Get events
		</button>
	</form>
{/await}

<div class="flex flex-col gap-2 my-4">
	{#each snapshot_list as { id, snapshots }}
		{#each snapshots as snapshot, index}
			{@const result = results.find(r => r.id === `${id}-${index}`)?.result[0]}
			<div class="card card-bordered">
				<div class="card-body">
					<img src={snapshot} alt="Snapshot" class="w-1/4" />
					{#if result}
						{@const label = result.label}
						{@const confidence = result.confidence}
						<p class="alert"
							 class:alert-error={label === 'person'}
							 class:alert-success={label !== 'noperson'}
						>Result: {label} ({((confidence ?? 0) * 100).toFixed(0)})%</p>
					{/if}
				</div>
			</div>
		{/each}
	{/each}
</div>