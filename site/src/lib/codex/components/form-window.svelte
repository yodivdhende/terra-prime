<script lang="ts">
	import type { GoogleForm, GoogleFormItem } from '$lib/services/google-form-service';

	let { formId }: { formId: string } = $props();

	let form = $state<GoogleForm | null>(null);
	let loading = $state(true);
	let failed = $state(false);
	let submitted = $state(false);
	let answers = $state<Record<string, string | string[]>>({});

	$effect(() => {
		loading = true;
		failed = false;
		submitted = false;
		answers = {};
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

<div class="form-window scroll">
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
		</header>

		<form onsubmit={submit}>
			{#each form.items ?? [] as item (item.itemId)}
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
									{#each Array.from( { length: (scale.high ?? 5) - (scale.low ?? 1) + 1 }, (_, i) => (scale.low ?? 1) + i ) as n (n)}
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
							{:else}
								<span class="status">// unsupported question type</span>
							{/if}
						</label>
					{:else if item.textItem}
						<div class="text-item">
							<span class="q-title">{item.title ?? ''}</span>
							{#if item.description}<p class="q-desc">{item.description}</p>{/if}
						</div>
					{:else if item.pageBreakItem}
						<hr />
						{#if item.title}<span class="q-title">{item.title}</span>{/if}
					{:else if item.imageItem?.image?.contentUri}
						<img src={item.imageItem.image.contentUri} alt={item.title ?? ''} />
					{/if}
				</section>
			{/each}

			<button type="submit">submit</button>
		</form>
	{/if}
</div>

<style>
	.form-window {
		padding: 1rem 1.25rem;
		overflow-y: auto;
		height: 100%;
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

	button:hover {
		border-color: var(--color-accent);
		color: var(--color-accent);
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
