<script lang="ts">
	const { form } = $props();

	let images = $derived(form?.images ?? []);
	$inspect(images);
</script>

<form action="" method="post">
	<button class="btn" type="submit">
		Get events
	</button>
</form>

<div class="flex flex-col gap-2">
	{#each images.filter(i => i.path) as { path }}
		<img src={path} alt="Preview" />
	{/each}
</div>