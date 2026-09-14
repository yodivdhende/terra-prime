<script lang="ts">
	let { text }: { text: string } = $props();
</script>

<p class="hint">{text}</p>

<style>
	.hint {
		margin: 0;
		font-size: 0.8rem;
		opacity: 0.6;
	}
</style>
