<script lang="ts">
	import Logo from '$lib/assets/images/Logo.png';
</script>

<main>
	<div class="background">
		<img src={Logo} alt="terraprime logo" />
	</div>
</main>

<style>
	main {
		position: relative;
		width: 100%;
		height: 100%;
		background-color: black;
	}

	.background {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
	}

	.background img {
		max-width: 400px;
	}
</style>
