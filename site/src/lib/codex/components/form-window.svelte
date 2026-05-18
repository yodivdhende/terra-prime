<script lang="ts">
	import type { GoogleForm, GoogleFormItem } from '$lib/services/google-form-service';

	let { formId }: { formId: string } = $props();

	type Section = {
		title: string | null;
		description: string | null;
		items: GoogleFormItem[];
	};

	let form = $state<GoogleForm | null>(null);
	let loading = $state(true);
	let failed = $state(false);
	let submitted = $state(false);
	let answers = $state<Record<string, string | string[]>>({});
	let currentSection = $state(0);
	let formEl = $state<HTMLFormElement | null>(null);

	let sections = $derived<Section[]>(buildSections(form?.items ?? []));

	function buildSections(items: GoogleFormItem[]): Section[] {
		const result: Section[] = [{ title: null, description: null, items: [] }];
		for (const item of items) {
			if (item.pageBreakItem) {
				result.push({
					title: item.title ?? null,
					description: item.description ?? null,
					items: []
				});
			} else {
				result[result.length - 1].items.push(item);
			}
		}
		return result;
	}

	$effect(() => {
		loading = true;
		failed = false;
		submitted = false;
		answers = {};
		currentSection = 0;
		fetch(`/api/forms/${formId}`)
			.then((r) => {
				if (!r.ok) throw new Error();
				return r.json();
			})
			.then((data: GoogleForm) => {
				form = data;
				loading = false;
			})
			.catch(() => {
				failed = true;
				loading = false;
			});
	});

	function getQuestionId(item: GoogleFormItem): string | null {
		return item.questionItem?.question?.questionId ?? null;
	}

	function goNext() {
		if (!formEl) return;
		if (!formEl.reportValidity()) return;
		if (currentSection < sections.length - 1) {
			currentSection += 1;
		}
	}

	function goBack() {
		if (currentSection > 0) currentSection -= 1;
	}

	function setAnswer(questionId: string, value: string | string[]) {
		answers[questionId] = value;
	}

	function toggleCheckbox(questionId: string, option: string) {
		const current = (answers[questionId] as string[] | undefined) ?? [];
		if (current.includes(option)) {
			answers[questionId] = current.filter((v) => v !== option);
		} else {
			answers[questionId] = [...current, option];
		}
	}

	function submit(event: SubmitEvent) {
		event.preventDefault();
		submitted = true;
	}

	function buildResponderUrl(): string | null {
		return form?.responderUri ?? null;
	}
</script>

<div class="form-window">
	{#if loading}
		<span class="status">loading form...</span>
	{:else if failed || !form}
		<span class="status error">failed to load form</span>
	{:else if submitted}
		<div class="submitted">
			<p class="status">// transmission captured locally</p>
			<p>
				Direct submission to Google Forms is not supported from this terminal. To submit your
				answers, open the form on the Google network:
			</p>
			{#if buildResponderUrl()}
				<a href={buildResponderUrl()} target="_blank" rel="noopener noreferrer">
					{buildResponderUrl()}
				</a>
			{/if}
			<button type="button" onclick={() => (submitted = false)}>back</button>
		</div>
	{:else}
		<header>
			<h1>{form.info?.title ?? 'untitled form'}</h1>
			{#if form.info?.description}
				<p class="desc">{form.info.description}</p>
			{/if}
			{#if sections.length > 1}
				<span class="section-counter">
					section {currentSection + 1} / {sections.length}
				</span>
			{/if}
		</header>

		<form bind:this={formEl} onsubmit={submit}>
			{#if sections[currentSection]?.title}
				<div class="section-header">
					<h2>{sections[currentSection].title}</h2>
					{#if sections[currentSection].description}
						<p class="q-desc">{sections[currentSection].description}</p>
					{/if}
				</div>
			{/if}

			{#each sections[currentSection]?.items ?? [] as item (item.itemId)}
				<section class="item">
					{#if item.questionItem}
						{@const question = item.questionItem.question}
						{@const qid = getQuestionId(item) ?? item.itemId ?? ''}
						<label>
							<span class="q-title">
								{item.title ?? ''}
								{#if question?.required}<span class="required">*</span>{/if}
							</span>
							{#if item.description}
								<span class="q-desc">{item.description}</span>
							{/if}

							{#if question?.textQuestion}
								{#if question.textQuestion.paragraph}
									<textarea
										rows="4"
										required={question.required ?? false}
										value={(answers[qid] as string) ?? ''}
										oninput={(e) => setAnswer(qid, e.currentTarget.value)}
									></textarea>
								{:else}
									<input
										type="text"
										required={question.required ?? false}
										value={(answers[qid] as string) ?? ''}
										oninput={(e) => setAnswer(qid, e.currentTarget.value)}
									/>
								{/if}
							{:else if question?.choiceQuestion}
								{@const choice = question.choiceQuestion}
								{#if choice.type === 'RADIO'}
									<div class="options">
										{#each choice.options ?? [] as opt, i (i)}
											<label class="option">
												<input
													type="radio"
													name={qid}
													value={opt.value ?? ''}
													required={question.required ?? false}
													checked={(answers[qid] as string) === opt.value}
													onchange={() => setAnswer(qid, opt.value ?? '')}
												/>
												<span>{opt.value ?? ''}</span>
											</label>
										{/each}
									</div>
								{:else if choice.type === 'CHECKBOX'}
									<div class="options">
										{#each choice.options ?? [] as opt, i (i)}
											<label class="option">
												<input
													type="checkbox"
													value={opt.value ?? ''}
													checked={((answers[qid] as string[]) ?? []).includes(opt.value ?? '')}
													onchange={() => toggleCheckbox(qid, opt.value ?? '')}
												/>
												<span>{opt.value ?? ''}</span>
											</label>
										{/each}
									</div>
								{:else if choice.type === 'DROP_DOWN'}
									<select
										required={question.required ?? false}
										value={(answers[qid] as string) ?? ''}
										onchange={(e) => setAnswer(qid, e.currentTarget.value)}
									>
										<option value="">-- select --</option>
										{#each choice.options ?? [] as opt, i (i)}
											<option value={opt.value ?? ''}>{opt.value ?? ''}</option>
										{/each}
									</select>
								{/if}
							{:else if question?.scaleQuestion}
								{@const scale = question.scaleQuestion}
								<div class="scale">
									{#if scale.lowLabel}<span class="scale-label">{scale.lowLabel}</span>{/if}
									{#each Array.from({ length: (scale.high ?? 5) - (scale.low ?? 1) + 1 }, (_, i) => (scale.low ?? 1) + i) as n (n)}
										<label class="option">
											<input
												type="radio"
												name={qid}
												value={n}
												checked={(answers[qid] as string) === String(n)}
												onchange={() => setAnswer(qid, String(n))}
											/>
											<span>{n}</span>
										</label>
									{/each}
									{#if scale.highLabel}<span class="scale-label">{scale.highLabel}</span>{/if}
								</div>
							{:else if question?.dateQuestion}
								<input
									type="date"
									required={question.required ?? false}
									value={(answers[qid] as string) ?? ''}
									oninput={(e) => setAnswer(qid, e.currentTarget.value)}
								/>
							{:else if question?.timeQuestion}
								<input
									type="time"
									required={question.required ?? false}
									value={(answers[qid] as string) ?? ''}
									oninput={(e) => setAnswer(qid, e.currentTarget.value)}
								/>
							{:else if (question as any)?.ratingQuestion}
								{@const rating = (question as any).ratingQuestion}
								{@const level = rating.ratingScaleLevel ?? 5}
								{@const iconType = rating.iconType ?? 'STAR'}
								{@const selected = Number((answers[qid] as string) ?? 0) || 0}
								<div class="rating">
									{#each Array.from({ length: level }, (_, i) => i + 1) as n (n)}
										<label class="rating-icon" class:active={n <= selected}>
											<input
												type="radio"
												name={qid}
												value={n}
												required={question?.required ?? false}
												checked={selected === n}
												onchange={() => setAnswer(qid, String(n))}
											/>
											<span>
												{#if iconType === 'HEART'}
													{n <= selected ? '♥' : '♡'}
												{:else if iconType === 'THUMB_UP'}
													▲
												{:else}
													{n <= selected ? '★' : '☆'}
												{/if}
											</span>
										</label>
									{/each}
								</div>
							{:else}
								<span class="status">// unsupported question type</span>
							{/if}
						</label>
					{:else if item.textItem}
						<div class="text-item">
							<span class="q-title">{item.title ?? ''}</span>
							{#if item.description}<p class="q-desc">{item.description}</p>{/if}
						</div>
					{:else if item.imageItem?.image?.contentUri}
						<img src={item.imageItem.image.contentUri} alt={item.title ?? ''} />
					{/if}
				</section>
			{/each}

			<nav class="section-nav">
				<button type="button" onclick={goBack} disabled={currentSection === 0}> &lt; back </button>
				{#if currentSection < sections.length - 1}
					<button type="button" onclick={goNext}>next &gt;</button>
				{:else}
					<button type="submit">submit</button>
				{/if}
			</nav>
		</form>
	{/if}
</div>

<style>
	.form-window {
		padding: 1rem 1.25rem;
		overflow-y: auto;
		color: var(--color-main);
		font-family: var(--font-mono);
		font-size: 0.85rem;
	}

	header h1 {
		color: var(--color-accent);
		text-transform: uppercase;
		letter-spacing: 0.08em;
		font-size: 1rem;
		margin: 0 0 0.4rem;
	}

	header .desc {
		color: var(--color-main-dim);
		margin: 0 0 1rem;
		font-size: 0.75rem;
	}

	form {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.item {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		border-left: 1px solid color-mix(in srgb, var(--color-accent) 30%, transparent);
		padding-left: 0.75rem;
	}

	.q-title {
		display: block;
		font-size: 0.8rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-main);
	}

	.q-desc {
		display: block;
		font-size: 0.7rem;
		color: var(--color-main-dim);
		margin: 0.15rem 0 0.35rem;
	}

	.required {
		color: var(--color-warning);
		margin-left: 0.25rem;
	}

	input[type='text'],
	input[type='date'],
	input[type='time'],
	textarea,
	select {
		background: transparent;
		border: 1px solid color-mix(in srgb, var(--color-accent) 30%, transparent);
		color: var(--color-main);
		font-family: var(--font-mono);
		font-size: 0.85rem;
		padding: 0.3rem 0.5rem;
		width: 100%;
		box-sizing: border-box;
		margin-top: 0.25rem;
	}

	textarea {
		resize: vertical;
	}

	input[type='text']:focus,
	input[type='date']:focus,
	input[type='time']:focus,
	textarea:focus,
	select:focus {
		outline: none;
		border-color: var(--color-accent);
	}

	.options {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		margin-top: 0.25rem;
	}

	.option {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.8rem;
		cursor: pointer;
	}

	.option input {
		accent-color: var(--color-accent);
	}

	.scale {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
		margin-top: 0.25rem;
	}

	.scale-label {
		font-size: 0.7rem;
		color: var(--color-main-dim);
	}

	.rating {
		display: flex;
		gap: 0.4rem;
		margin-top: 0.35rem;
	}

	.rating-icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		font-size: 1.25rem;
		line-height: 1;
		color: var(--color-main-dim);
		cursor: pointer;
		transition: color 0.15s;
	}

	.rating-icon:hover,
	.rating-icon.active {
		color: var(--color-accent);
	}

	.rating-icon input {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}

	.text-item {
		padding: 0.25rem 0;
	}

	hr {
		border: none;
		border-top: 1px dashed color-mix(in srgb, var(--color-accent) 30%, transparent);
		margin: 0.5rem 0;
	}

	img {
		max-width: 100%;
		display: block;
		margin-top: 0.25rem;
	}

	button {
		font-family: var(--font-mono);
		font-size: 0.75rem;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		padding: 0.4rem 0.9rem;
		background: transparent;
		color: var(--color-main);
		border: 1px solid color-mix(in srgb, var(--color-accent) 30%, transparent);
		cursor: pointer;
		align-self: flex-start;
		transition:
			border-color 0.15s,
			color 0.15s;
	}

	button:hover:not(:disabled) {
		border-color: var(--color-accent);
		color: var(--color-accent);
	}

	button:disabled {
		opacity: 0.35;
		cursor: not-allowed;
	}

	.section-counter {
		display: block;
		font-size: 0.7rem;
		color: var(--color-main-dim);
		text-transform: uppercase;
		letter-spacing: 0.08em;
		margin-bottom: 0.5rem;
	}

	.section-header {
		border-left: 1px solid color-mix(in srgb, var(--color-accent) 50%, transparent);
		padding-left: 0.75rem;
	}

	.section-header h2 {
		color: var(--color-accent);
		text-transform: uppercase;
		letter-spacing: 0.06em;
		font-size: 0.85rem;
		margin: 0 0 0.25rem;
	}

	.section-nav {
		display: flex;
		justify-content: space-between;
		gap: 0.5rem;
		margin-top: 0.5rem;
		padding-top: 0.75rem;
		border-top: 1px dashed color-mix(in srgb, var(--color-accent) 25%, transparent);
	}

	.section-nav button {
		align-self: auto;
	}

	.status {
		display: block;
		opacity: 0.5;
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.08em;
	}

	.status.error {
		color: var(--color-warning);
	}

	.submitted {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.submitted a {
		color: var(--color-accent);
		word-break: break-all;
		font-size: 0.75rem;
	}
</style>
