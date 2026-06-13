export function mockRequest(body?: unknown, method = 'POST'): Request {
	return new Request('http://localhost', {
		method,
		headers: { 'Content-Type': 'application/json' },
		body: body != null ? JSON.stringify(body) : undefined,
	});
}
