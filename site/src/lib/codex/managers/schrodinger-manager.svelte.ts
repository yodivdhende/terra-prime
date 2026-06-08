function createSchrodingerManager() {
	let visible = $state(false);
	let message = $state('');
	let mode = $state<'idle' | 'registration' | 'notification'>('idle');

	const STEP_MESSAGES = [
		"Pick an event you'd like to attend!",
		'Choose or create your character.',
		"Fill in your character's details.",
		'All set — confirm your registration!'
	];

	function show(msg: string, m: 'idle' | 'registration' | 'notification' = 'idle') {
		message = msg;
		mode = m;
		visible = true;
	}

	function dismiss() {
		visible = false;
	}

	function setRegistrationStep(step: number) {
		const msg = STEP_MESSAGES[step];
		if (msg) show(msg, 'registration');
	}

	return {
		get visible() { return visible; },
		get message() { return message; },
		get mode() { return mode; },
		show,
		dismiss,
		setRegistrationStep
	};
}

export const SCHRODINGER_MANAGER = createSchrodingerManager();
