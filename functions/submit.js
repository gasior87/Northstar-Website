export async function onRequestPost({ request, env }) {
  try {
    const form = await request.formData();
    const token = form.get("cf-turnstile-response");

    // 1. Honeypot check: reject bots filling invisible fields
    const honeypot = form.get("website_url");
    if (honeypot) {
      return new Response(JSON.stringify({ success: true, message: "Logged" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!token) {
      return new Response(JSON.stringify({ success: false, error: "Brak tokenu weryfikacji Turnstile" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 2. Verify token via Cloudflare Siteverify API (Secret Key from Pages env)
    const result = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          secret: env.TURNSTILE_SECRET,
          response: token,
          remoteip: request.headers.get("CF-Connecting-IP") ?? "",
        }),
      }
    );

    const data = await result.json();
    if (!data.success) {
      return new Response(JSON.stringify({ success: false, error: "Weryfikacja nieudana" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 3. Process form: forward to Google Forms securely server-side
    const email = form.get("email") || "";
    const name = form.get("name") || "";
    const company = form.get("company") || "";
    const service = form.get("service") || "";
    const message = form.get("message") || "";

    const googleFormData = new FormData();
    googleFormData.append("emailAddress", email);
    googleFormData.append("entry.160552575", name);
    googleFormData.append("entry.1861370323", email);
    googleFormData.append("entry.770263093", company);
    googleFormData.append("entry.1788635073", service);
    googleFormData.append("entry.443471588", message);

    const googleFormUrl = env.GOOGLE_FORM_URL || "https://docs.google.com/forms/d/e/1FAIpQLSeJ67fjlrU0pZfmFS27UBCjjYczEB3bbubdyBpujfRS2IZcvg/formResponse";
    await fetch(googleFormUrl, {
      method: "POST",
      body: googleFormData,
    });

    return new Response(JSON.stringify({ success: true, message: "OK" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
