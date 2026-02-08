<script lang="ts">
	import code from '$lib/assets/data/code.json';

	let leftCode = $state(code.join('\n'));
	let codeIndex = 0;
	let characterIndex = -1;
	let textArea: HTMLTextAreaElement;

	$effect(() => {
		if (leftCode) {
			textArea.scrollTop = textArea.scrollHeight;
		}
	});

	setInterval(() => {
		leftCode = updateCode();
	}, 10);

	function updateCode() {
		characterIndex++;
		let nextLine = '';
		if (characterIndex >= code[codeIndex].length) {
			characterIndex = 0;
			codeIndex++;
			nextLine = '\n';
		}
		if (codeIndex >= code.length) {
			codeIndex = 0;
			leftCode = code.join('\n');
		}
		return leftCode + nextLine + code[codeIndex].slice(characterIndex, characterIndex + 1);
	}
</script>

	<textarea bind:this={textArea}>{leftCode}</textarea>

<style>
	textarea {
		width: 100%;
		height: 90%;
		background: transparent;
		color: #006600;
		border: none;
		resize: none;
		font-family: 'Courier New', Courier, monospace;
		font-size: 1rem;
		overflow: hidden;
	}
</style>
