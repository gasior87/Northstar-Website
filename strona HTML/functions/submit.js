// Cloudflare Pages Function: POST /submit
// Verifies Cloudflare Turnstile, validates input, forwards the inquiry to Google Forms.

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

export async function onRequestPost({ request, env }) {
  try {
    const form = await request.formData();

    // 1. Honeypot: silently accept and drop submissions from bots
    if (form.get("website_url")) {
      return json({ success: true });
    }

    // 2. Read and validate input before spending a Turnstile verification
    const name = String(form.get("name") || "").trim();
    const email = String(form.get("email") || "").trim();
    const company = String(form.get("company") || "").trim();
    const service = String(form.get("service") || "").trim();
    const message = String(form.get("message") || "").trim();
    const token = form.get("cf-turnstile-response");

    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!name || !emailOk || !message ||
        email.length > 254 || name.length > 200 || company.length > 200 ||
        service.length > 200 || message.length > 5000) {
      return json({ success: false, error: "Invalid form input" }, 400);
    }

    if (!token) {
      return json({ success: false, error: "Missing verification token" }, 400);
    }

    // 3. Server-side Turnstile verification (secret comes from Pages environment variables)
    if (!env.TURNSTILE_SECRET) {
      console.error("TURNSTILE_SECRET is not configured");
      return json({ success: false, error: "Server configuration error" }, 500);
    }

    const verifyRes = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        secret: env.TURNSTILE_SECRET,
        response: token,
        remoteip: request.headers.get("CF-Connecting-IP") ?? "",
      }),
    });
    const verify = await verifyRes.json();
    if (!verify.success) {
      return json({ success: false, error: "Verification failed" }, 403);
    }

    // 4. Forward to Google Forms (URL and field mapping stay server-side)
    const googleFormUrl =
      env.GOOGLE_FORM_URL ||
      "https://docs.google.com/forms/d/e/1FAIpQLSeJ67fjlrU0pZfmFS27UBCjjYczEB3bbubdyBpujfRS2IZcvg/formResponse";

    const googleFormData = new FormData();
    googleFormData.append("emailAddress", email);
    googleFormData.append("entry.160552575", name);
    googleFormData.append("entry.1861370323", email);
    googleFormData.append("entry.770263093", company);
    googleFormData.append("entry.1788635073", service);
    googleFormData.append("entry.443471588", message);

    await fetch(googleFormUrl, { method: "POST", body: googleFormData });

    return json({ success: true });
  } catch (err) {
    console.error("submit error:", err);
    return json({ success: false, error: "Internal server error" }, 500);
  }
}
