using Corvus.Api.Models;
using Corvus.Api.Services;

namespace Corvus.Api.Endpoints;

public static class AuthEndpoints
{
    public static void MapAuthEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/auth");

        group.MapGet("/status", async (HttpContext context, IAuthService auth) =>
        {
            bool hasUsers = await auth.HasUsersAsync();
            bool regEnabled = await auth.IsRegistrationEnabledAsync();

            if (!auth.IsAuthEnabled)
            {
                return Results.Ok(new AuthStatusResponse(false, true, "anonymous", hasUsers, regEnabled));
            }

            // Zero-Trust SSO / Reverse Proxy Header Kontrolü (Tailscale, Cloudflare Access, vb.)
            string? proxyUser = auth.CheckProxyAuthHeader(context.Request.Headers);
            if (!string.IsNullOrEmpty(proxyUser))
            {
                return Results.Ok(new AuthStatusResponse(true, true, proxyUser, hasUsers, regEnabled));
            }

            string? token = context.Request.Cookies["corvus_session"];
            var (isAuth, username) = auth.ValidateSessionToken(token);

            return Results.Ok(new AuthStatusResponse(true, isAuth, isAuth ? username : null, hasUsers, regEnabled));
        });

        group.MapPost("/register", async (AuthRegisterRequest request, HttpContext context, IAuthService auth) =>
        {
            var (success, errorMessage) = await auth.RegisterAsync(request.Username, request.Password);
            if (!success)
            {
                return Results.BadRequest(new GenericApiResponse(false, errorMessage));
            }

            // Kayıt olan kullanıcıyı doğrudan oturum açmış olarak işaretle
            string token = auth.GenerateSessionToken(request.Username.Trim());
            context.Response.Cookies.Append("corvus_session", token, new CookieOptions
            {
                HttpOnly = true,
                SameSite = SameSiteMode.Lax,
                Expires = DateTimeOffset.UtcNow.AddDays(7)
            });

            return Results.Ok(new GenericApiResponse(true, "Kayıt başarılı."));
        });

        group.MapPost("/login", async (AuthLoginRequest request, HttpContext context, IAuthService auth) =>
        {
            var (valid, username) = await auth.ValidateCredentialsAsync(request.Username, request.Password);
            if (!valid || username == null)
            {
                return Results.Unauthorized();
            }

            string token = auth.GenerateSessionToken(username);
            context.Response.Cookies.Append("corvus_session", token, new CookieOptions
            {
                HttpOnly = true,
                SameSite = SameSiteMode.Lax,
                Expires = DateTimeOffset.UtcNow.AddDays(7)
            });

            return Results.Ok(new GenericApiResponse(true, "Giriş başarılı."));
        });

        group.MapPost("/toggle-registration", async (ToggleRegistrationRequest request, HttpContext context, IAuthService auth) =>
        {
            if (auth.IsAuthEnabled)
            {
                string? token = context.Request.Cookies["corvus_session"];
                var (isAuth, _) = auth.ValidateSessionToken(token);
                if (!isAuth)
                {
                    return Results.Unauthorized();
                }
            }

            await auth.SetRegistrationEnabledAsync(request.Enabled);
            string msg = request.Enabled ? "Kayıtlar başarıyla açıldı." : "Kayıtlar başarıyla kapatıldı.";
            return Results.Ok(new GenericApiResponse(true, msg));
        });

        group.MapPost("/logout", (HttpContext context, IAuthService auth) =>
        {
            string? token = context.Request.Cookies["corvus_session"];
            auth.InvalidateSessionToken(token);
            context.Response.Cookies.Delete("corvus_session");
            return Results.Ok(new GenericApiResponse(true, "Çıkış yapıldı."));
        });
    }
}
