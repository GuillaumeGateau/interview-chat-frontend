# Security Considerations

## Important: Client-Side Endpoint Visibility

**Endpoints will always be visible in client-side code.** This is unavoidable for any frontend application. Security must be implemented on the **backend**, not by hiding endpoints.

## Current Frontend Protections

1. **Client-Side Rate Limiting**: Added rate limiting (10 requests per minute) as a first line of defense
   - This prevents accidental abuse from legitimate users
   - Can be bypassed by determined attackers, so backend rate limiting is essential

2. **Request Headers**: Added `X-Client-Version` header for backend validation
   - Backend can validate this header to ensure requests come from legitimate clients
   - Can be used to block requests from outdated or unauthorized client versions

## Backend Security Requirements (CRITICAL)

The following security measures **must** be implemented on your backend:

### 1. Rate Limiting (MOST IMPORTANT)
- Implement per-IP rate limiting (e.g., 10-20 requests per minute per IP)
- Use libraries like `express-rate-limit` or similar
- Consider different limits for different endpoints
- Return proper HTTP 429 (Too Many Requests) status codes

### 2. CORS Configuration
- Restrict CORS to only allow requests from your frontend domain
- Don't use `Access-Control-Allow-Origin: *` in production
- Example: `Access-Control-Allow-Origin: https://yourdomain.com`

### 3. Request Validation
- Validate all incoming request data
- Check message length limits
- Sanitize user input
- Validate conversation IDs format

### 4. Authentication/Authorization (Optional but Recommended)
- Consider adding API keys for production use
- Implement user session validation
- Use tokens that can be validated server-side

### 5. Monitoring & Logging
- Log all API requests with IP addresses
- Monitor for unusual patterns (rapid requests, large payloads)
- Set up alerts for potential abuse

### 6. Input Sanitization
- Validate and sanitize all user messages
- Prevent injection attacks
- Limit message length

### 7. Error Handling
- Don't expose sensitive information in error messages
- Return generic error messages to clients
- Log detailed errors server-side only

## Environment Variables

The backend URL is already using environment variables:
- `REACT_APP_BACKEND_URL` - Set this in your deployment environment
- Never commit sensitive values to git

## Additional Recommendations

1. **Use a Reverse Proxy**: Consider using Cloudflare or similar to add DDoS protection
2. **Implement CAPTCHA**: For production, consider adding CAPTCHA after a certain number of requests
3. **IP Blocking**: Implement IP blocking for repeated abuse
4. **Request Signing**: For high-security scenarios, implement request signing with HMAC

## What We CANNOT Do on Frontend

- ❌ Hide endpoints (they're always visible in network tab)
- ❌ Prevent determined attackers from making direct API calls
- ❌ Secure the API without backend support
- ❌ Hide API keys that need to be in client code

## What We CAN Do

- ✅ Add client-side rate limiting (done)
- ✅ Add request headers for validation (done)
- ✅ Implement proper error handling
- ✅ Use environment variables for configuration
- ✅ Validate input before sending

## Summary

**Security is a backend responsibility.** The frontend can help with user experience (rate limiting, validation), but real security must be enforced server-side. Make sure your backend implements proper rate limiting, CORS restrictions, and request validation.

