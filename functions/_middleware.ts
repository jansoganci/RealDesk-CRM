/**
 * Cloudflare Pages Middleware
 * Sets visitor country cookie from CF-IPCountry header
 * Runs on every request before serving assets
 */

export async function onRequest(context: {
  request: Request;
  next: () => Promise<Response>;
  env: Record<string, unknown>;
}) {
  const response = await context.next();

  // Read country from Cloudflare header
  const country = context.request.headers.get('CF-IPCountry');

  // Only set cookie if country is detected and cookie doesn't exist
  if (country && country !== 'XX') {
    const headers = new Headers(response.headers);

    // Set cookie with 1 year expiry, httpOnly=false (needs to be readable by JS)
    headers.append(
      'Set-Cookie',
      `x-visitor-country=${country}; Path=/; Max-Age=31536000; SameSite=Lax`
    );

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  }

  return response;
}
