<script lang="ts">
    import  logo  from '$lib/assets/images/Logo.png';
	import { type PageProps } from './$types';	

	let {data}: PageProps= $props();
	$effect(() => {
		console.log(data.values);
	})
</script>

<main>
    <img src={logo} alt="TerraPrime Logo" class="logo" />
	<section>
		<div class="content">
			<p>Terra Prime is een gloednieuwe volwassenen-LARP onder DHvT.</p>
			<p>
				Stap in een futuristische wereld waar actie, samenwerking en verbeelding centraal staan.
				Samen met andere spelers en crew creëer je een meeslepend verhaal vol avontuur, spanning en
				humor !
			</p>
			<p>
				We spelen om elkaar te versterken, niet om te winnen. Daarom houden we de regels eenvoudig
				en ligt de focus op sfeer, plezier en sterk rollenspel. Nieuwe deelnemers kunnen vlot
				instappen, terwijl ervaren spelers alle ruimte krijgen om te schitteren in hun personage.
			</p>
			<p>
				Verwacht sciencefictionvibes, Nerf, close combat en een beleving die je even helemaal
				losmaakt van de echte wereld.
			</p>
			<p>Jouw plaats wacht in de Federatie!</p>
		</div>
	</section>
</main>

<style>
	main {
		display: grid;
        grid-template-columns: 1fr;
        grid-template-rows: min-content 1fr;
		place-items: center;
		width: 100vw;
		height: 100vh;
		background-color: black;
        overflow: hidden;
        scrollbar-color: #00aa00 black;
	}
    
    .logo {
        margin-top: 20px;
        height: 50vh;
        margin-top: 25vh;
        animation-name: logoFadeIn;
        animation-duration: 6s;
        animation-fill-mode: forwards;
        animation-timing-function: cubic-bezier(0.8, 0, 0.2, 1);
    }


	section {
		opacity: 0;
		width: 0;
		max-width: 800px;
		min-height: 100px;
		max-height: 60vh;
		border: 3px solid #00aa00;
		border-radius: 10px;
		padding: 0;
		box-shadow: #00aa00 0px 0px 10px;
		overflow-x: none;
		word-wrap: none;
		animation-name: fadeIn;
		animation-duration: 2s;
        animation-delay: 6s;
		animation-fill-mode: forwards;
        animation-timing-function: ease-in-out;
	}

	.content {
		color: #00aa00;
        font-size: 0;
		overflow-x: none;
		word-wrap: none;
		animation-name: textFadeIn;
		animation-duration: 1s;
		animation-delay: calc(6s + 2s);
		animation-fill-mode: forwards;
	}
    
    .content p {
        margin-bottom: 1rem;
    }
    
    @keyframes logoFadeIn {
        0% {
            opacity: 0;
            height: 50vh;
            margin-top: 25vh;
        }
        50% {
            opacity: 1;
            height: 50vh;
            margin-top: 25vh;
        }
        50% {
            opacity: 1;
            height: 50vh;
            margin-top: calc(50vh - 300px);
        }
        100% {
            opacity: 1;
            height: 300px;
            margin-top: 30px;
        }
    }

	@keyframes fadeIn {
		0% {
			opacity: 0;
			padding: 0;
			width: 0;
            height:0;
		}
		5% {
            display: block;
			opacity: 1;
			padding: 0;
			width: 0;
            height:0;
		}
		100% {
			opacity: 1;
			padding: 2rem;
			width: 100%;
            height:100%;
		}
	}

	@keyframes textFadeIn {
		0% {
            font-size: 0;
		}
		100% {
            font-size: 1.5em;
		}
	}
</style>
