namespace Corvus.Api.Services;

public class CorvusAuthFilter : IEndpointFilter
{
    private readonly IAuthService _auth;

    public CorvusAuthFilter(IAuthService auth)
    {
        _auth = auth;
    }

    public async ValueTask<object?> InvokeAsync(EndpointFilterInvocationContext context, EndpointFilterDelegate next)
    {
        if (!_auth.IsAuthEnabled)
        {
            return await next(context);
        }

        var httpContext = context.HttpContext;

        // 1. Zero-Trust SSO / Reverse Proxy Header Kontrolü (Tailscale, Cloudflare Access, Remote-User, X-Forwarded-User)
        string? proxyUser = _auth.CheckProxyAuthHeader(httpContext.Request.Headers);
        if (!string.IsNullOrEmpty(proxyUser))
        {
            return await next(context);
        }

        // 2. Cookie tabanlı oturum doğrulaması
        string? token = httpContext.Request.Cookies["corvus_session"];
        var (isValid, _) = _auth.ValidateSessionToken(token);
        if (isValid)
        {
            return await next(context);
        }

        return Results.Unauthorized();
    }
}
