export async function onRequestPost(context) {
  try {
    const formData = await context.request.formData();
    const token = formData.get("cf-turnstile-response");
    const ip = context.request.headers.get("CF-Connecting-IP");

    // 1. Honeypot check: silently drop automated bots that fill invisible fields
    const honeypot = formData.get("website_url");
    if (honeypot) {
      return new Response(JSON.stringify({ success: true, message: "Logged" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 2. Validate token presence
    if (!token) {
      return new Response(JSON.stringify({ success: false, error: "Missing Turnstile verification token" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 3. Resolve Turnstile Secret from environment variables (NEVER hardcoded in source)
    const secretKey = context.env.TURNSTILE_SECRET;
    if (!secretKey) {
      return new Response(JSON.stringify({ success: false, error: "Server configuration: TURNSTILE_SECRET is missing." }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 4. Server-side validation via Cloudflare Siteverify API
    const verifyBody = new URLSearchParams();
    verifyBody.append("secret", secretKey);
    verifyBody.append("response", token);
    if (ip) verifyBody.append("remoteip", ip);

    const verifyRes = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: verifyBody,
    });

    const verifyOutcome = await verifyRes.json();
    if (!verifyOutcome.success) {
      return new Response(JSON.stringify({
        success: false,
        error: "Turnstile verification failed",
        codes: verifyOutcome["error-codes"] || [],
      }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 5. Input length and sanity checks
    const email = (formData.get("email") || "").trim();
    const name = (formData.get("name") || "").trim();
    const company = (formData.get("company") || "").trim();
    const service = (formData.get("service") || "").trim();
    const message = (formData.get("message") || "").trim();

    if (!email || !email.includes("@") || email.length > 254 || name.length > 200 || message.length > 5000) {
      return new Response(JSON.stringify({ success: false, error: "Invalid form input" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 6. Forward to Google Forms server-side (URL and field mappings are never exposed to browser)
    const googleFormUrl = context.env.GOOGLE_FORM_URL || "https://docs.google.com/forms/d/e/1FAIpQLSeJ67fjlrU0pZfmFS27UBCjjYczEB3bbubdyBpujfRS2IZcvg/formResponse";
    const googleFormData = new FormData();
    googleFormData.append("emailAddress", email);
    googleFormData.append("entry.160552575", name);
    googleFormData.append("entry.1861370323", email);
    googleFormData.append("entry.770263093", company);
    googleFormData.append("entry.1788635073", service);
    googleFormData.append("entry.443471588", message);

    await fetch(googleFormUrl, {
      method: "POST",
      body: googleFormData,
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
