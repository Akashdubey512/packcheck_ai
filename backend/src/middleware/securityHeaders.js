// Security headers middleware enforcing OWASP & SIH standards
export function securityHeadersMiddleware(req, res, next) {
  // Prevent MIME-sniffing
  res.setHeader("X-Content-Type-Options", "nosniff");

  // Prevent framing (clickjacking defense)
  res.setHeader("X-Frame-Options", "DENY");

  // XSS protection header for older browsers
  res.setHeader("X-XSS-Protection", "1; mode=block");

  // Referrer Policy
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

  // Content Security Policy
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'"
  );

  // Feature policy / Permissions policy
  res.setHeader("Permissions-Policy", "geolocation=(), microphone=(), camera=()");

  // HSTS in production environments
  if (process.env.NODE_ENV === "production") {
    res.setHeader(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains"
    );
  }

  next();
}
