<script lang='ts'>
    import { goto, invalidate } from "$app/navigation";
    import { untrack } from "svelte";
    import type { PageProps } from "./$types";
    import { TOAST_MANAGER } from '$lib/managers/toast-manager.svelte';

    let {data}: PageProps = $props();
    let user = $state(untrack(() => data.user));
    let resendStatus: 'idle' | 'sending' | 'sent' | 'error' = $state('idle');
    let resendError = $state('');
    let resetStatus: 'idle' | 'sending' | 'sent' | 'error' = $state('idle');
    let resetError = $state('');

    async function save() {
        if(user == null)return;
        try {
            const result = await fetch(`/api/users/${user.id}`, {
                method:'post',
                body: JSON.stringify(user),
                headers: { 'content-type': 'application/json' }
            })
            if(result.ok) {
                TOAST_MANAGER.success('User saved');
                goto('.');
            } else {
                TOAST_MANAGER.error(`Save failed (${result.status})`);
            }
        } catch (err: any) {
            TOAST_MANAGER.error(err?.message ?? 'Something went wrong');
        }
    }

    async function resendVerification() {
        if (user == null) return;
        resendStatus = 'sending';
        resendError = '';
        try {
            const res = await fetch(`/api/admin/users/${user.id}/resend-verification`, {
                method: 'POST',
                headers: { 'content-type': 'application/json' }
            });
            if (res.ok) {
                resendStatus = 'sent';
                await invalidate(`/api/users/${user.id}`);
                return;
            }
            const body = await res.json().catch(() => ({}));
            resendStatus = 'error';
            resendError = body?.message ?? `failed (${res.status})`;
        } catch (err) {
            resendStatus = 'error';
            resendError = `${err}`;
        }
    }

    async function sendPasswordReset() {
        if (user == null) return;
        resetStatus = 'sending';
        resetError = '';
        try {
            const res = await fetch(`/api/admin/users/${user.id}/send-password-reset`, {
                method: 'POST',
                headers: { 'content-type': 'application/json' }
            });
            if (res.ok) {
                resetStatus = 'sent';
                return;
            }
            const body = await res.json().catch(() => ({}));
            resetStatus = 'error';
            resetError = body?.message ?? `failed (${res.status})`;
        } catch (err) {
            resetStatus = 'error';
            resetError = `${err}`;
        }
    }
</script>
<main>
    <a href=".">back</a>
    {#if user}
    <label for="name">Name</label>
    <input type="text" id="name" bind:value={user.name}/>
    <label for="email">Email</label>
    <input type="email" id="email" bind:value={user.email}/>

    <div class="verification">
        <span class="status" class:ok={user.verified} class:no={!user.verified}>
            {user.verified ? 'email verified ✓' : 'email not verified'}
        </span>
        {#if !user.verified}
            <button onclick={resendVerification} disabled={resendStatus === 'sending'}>
                {resendStatus === 'sending' ? 'sending…' : 'Resend verification email'}
            </button>
        {/if}
        {#if resendStatus === 'sent'}
            <span class="feedback ok">verification email sent</span>
        {:else if resendStatus === 'error'}
            <span class="feedback err">{resendError}</span>
        {/if}
    </div>

    <div class="reset">
        <button onclick={sendPasswordReset} disabled={resetStatus === 'sending'}>
            {resetStatus === 'sending' ? 'sending…' : 'Send password reset email'}
        </button>
        {#if resetStatus === 'sent'}
            <span class="feedback ok">password reset email sent</span>
        {:else if resetStatus === 'error'}
            <span class="feedback err">{resetError}</span>
        {/if}
    </div>
    {/if}
    <button onclick={save}>Save</button>
</main>
<style>
    main {
        display: flex;
        flex-direction: column;
        gap:8px;
        min-width:300px;
        padding: 8px;
    }
    .verification {
        display: flex;
        flex-direction: column;
        gap: 6px;
        padding: 8px 0;
        border-top: 1px solid rgba(255, 255, 255, 0.15);
        border-bottom: 1px solid rgba(255, 255, 255, 0.15);
        margin-top: 8px;
    }
    .reset {
        display: flex;
        flex-direction: column;
        gap: 6px;
        padding: 8px 0;
        border-bottom: 1px solid rgba(255, 255, 255, 0.15);
    }
    .status.ok {
        color: limegreen;
    }
    .status.no {
        color: tomato;
    }
    .feedback.ok {
        color: limegreen;
    }
    .feedback.err {
        color: tomato;
    }
</style>
