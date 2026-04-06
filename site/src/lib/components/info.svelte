<script lang="ts">
	import logo from '$lib/assets/images/Logo.png';
</script>

<main>
	<img src={logo} alt="TerraPrime Logo" class="logo" />
	<div class="grid">
		<section class="glow-border grow-animation" style="">
			<div class="content">
				<h2>Welkom bij Terra Prime: jouw toekomst begint hier</h2>
				<p>
					Terra Prime is een gloednieuwe sci-fi-LARP onder de vlag van DHvT. Stap in een nabije,
					futuristische wereld waar de grenzen van onze realiteit zijn opengebroken.
				</p>
				<div class="transmition">
					<h3>+++ [ FEDERATIE TRANSMISSIE ONTVANGEN ] +++</h3>
					<p>
						De ontdekking van Avix74 betekende het einde van een tijdperk voor uw wereld en zonder
						onze interventie tevens het einde van het voortbestaan van de mensheid op Terra Prime.
					</p>
					<p>
						Uw wereld balanceerde lange tijd op de rand van zelfvernietiging. Interne conflicten,
						ecologische instorting en technologische escalatie maakten duurzame overleving
						statistisch onwaarschijnlijk. Integratie in de Federatie heeft deze uitkomst succesvol
						herzien.
					</p>
					<p>
						Interdimensionaal reizen is sindsdien geen ambitie meer, maar een gereguleerd proces
						binnen een samenwerkingsverband van werelden die ontdekten dat overleven efficiënter is
						wanneer men dit niet alleen probeert.
					</p>
					<p>
						Onder begeleiding van de Federatie nemen aangesloten werelden deel aan gezamenlijke
						initiatieven rond samenwerking, expansie en vooruitgang. Termen die binnen de Federatie
						beschikken over duidelijke definities.
					</p>
					<p>
						Nieuwe dimensies worden verkend en veiliggesteld ten voordele van het collectief.
						Grondstoffen worden herverdeeld, kennis gedeeld en existentiële bedreigingen beheerd
						voordat zij planetaire proporties aannemen.
					</p>
					<p>
						De Federatie nodigt burgers van Terra Prime uit om actief bij te dragen aan deze
						voortdurende inspanning.
					</p>
					<p>
						Samen bouwen we aan stabiliteit. Omdat alternatieven aantoonbaar minder succesvol zijn
						gebleken.
					</p>
					<h3>+++ [ EINDE TRANSMISSIE ] +++</h3>
				</div>
				<h2>Wat mag je verwachten?</h2>
				<ul>
					<li>
						<b>Samenwerking & verbeelding:</b> Samen met medespelers en crew creëer je een meeslepend
						verhaal vol avontuur, spanning en een gezonde dosis humor.
					</li>
					<li>
						<b>Strategie, conflict en keuzes:</b> Hoewel tactische missies met Nerf-blasters en close
						combat deel uitmaken van Terra Prime, ligt de nadruk ook op keuzes en interactie. Onderhandeling,
						onderzoek, sabotage, diplomatie, politiek en probleemoplossing spelen een even grote rol in
						het verloop van het verhaal.
					</li>
					<li>
						<b>Rollenspel eerst:</b> We spelen om elkaar te versterken, niet om te winnen. De regels zijn
						eenvoudig, zodat de focus volledig ligt op sfeer, plezier en sterk rollenspel.
					</li>
				</ul>
				<h2>Toegankelijk voor iedereen</h2>
				<p>
					Of je nu een doorgewinterde veteraan bent die wil schitteren in een complex personage, of
					een nieuwkomer die vlot wil instappen: Terra Prime is toegankelijk voor spelers vanaf 16
					jaar en biedt een beleving die je even helemaal losmaakt van de echte wereld.
				</p>
				<h2>Jouw plaats wacht in de Federatie!</h2>
			</div>
		</section>
	</div>
</main>

<style>
	main {
		width: 100%;
		height: 100%;
	}

	.grid {
		display: grid;
		grid-template-columns: 1fr;
		grid-template-rows: min(310px, 70vw) min-content;
		grid-template-areas:
			'logo'
			'section';
		justify-items: center;
		align-items: start;
		width: 100vw;
		height: 100vh;
		overflow-x: hidden;
		overflow-y: auto;
		scrollbar-color: white black;
		background-color: black;
	}

	.logo {
		position: absolute;
		left: 50%;
		opacity: 1;
		max-width: min(500px, 80vw);
		max-height: min(250px, 80vh);
		top: 30px;
		z-index: 1;
		transform: translate(-50%, 0);
	}

	.glow-border {
		opacity: 1;
		padding: var(--section-padding);
		width: calc(100vw - 40px - 4rem);
		height: 100%;
		border: 3px solid var(--custom-green);
		border-radius: 10px;
		box-shadow: var(--custom-green) 0px 0px 10px;
	}

	.content {
		font-family: 'Courier New', Courier, monospace;
		color: var(--font-green);
	}

	.content p {
		margin-bottom: 1em;
	}

	.content h2 {
		font-family: 'Science Gothic', 'Courier New', Courier, monospace;
		font-size: 1.2em;
		font-weight: bold;
		margin: 1em 0;
	}

	.content h3 {
		font-family: 'Science Gothic', 'Courier New', Courier, monospace;
		font-weight: bold;
		margin: 1em 0;
	}

	.content b {
		font-weight: bold;
	}

	.content p {
		margin-bottom: 0.5em;
	}

	.content ul {
		list-style-type: circle;
		margin-left: 1em;
	}
</style>
