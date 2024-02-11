<script lang="ts">
	import '../app.css';

	let { children } = $props();
</script>

<div class="p-10">
{@render children()}
</div>