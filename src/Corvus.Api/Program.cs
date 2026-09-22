using Corvus.Api.BackgroundServices;
using Corvus.Api.Data;
using Corvus.Api.Endpoints;
using Corvus.Api.Models;
using Corvus.Api.Services;

[module: Dapper.DapperAot]

var builder = WebApplication.CreateSlimBuilder(args);

// Port ayarı (CORVUS_PORT veya varsayılan 8090)
string port = Environment.GetEnvironmentVariable("CORVUS_PORT") ?? "8090";
builder.WebHost.UseUrls($"http://0.0.0.0:{port}");

// JSON AOT Source Generator yapılandırması
builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.TypeInfoResolverChain.Insert(0, CorvusJsonSerializerContext.Default);
});

// HTTP Client & Bağımlılık Enjeksiyonu
builder.Services.AddHttpClient();
builder.Services.AddSingleton<IDbConnectionFactory, DbConnectionFactory>();
builder.Services.AddScoped<IServicesRepository, ServicesRepository>();
builder.Services.AddScoped<IMetricsRepository, MetricsRepository>();
builder.Services.AddScoped<IUptimeRepository, UptimeRepository>();
builder.Services.AddScoped<IBackupRepository, BackupRepository>();
builder.Services.AddSingleton<ISettingsRepository, SettingsRepository>();
builder.Services.AddScoped<IUserRepository, UserRepository>();

builder.Services.AddSingleton<IDockerHttpClient, DockerHttpClient>();
builder.Services.AddSingleton<IDockerService, DockerService>();
builder.Services.AddSingleton<IAuthService, AuthService>();

// Arka Plan Servisleri
builder.Services.AddHostedService<ContainerDiscoveryService>();
builder.Services.AddHostedService<SystemMetricsCollector>();
builder.Services.AddHostedService<UptimeCheckerService>();
builder.Services.AddHostedService<RetentionCleanupService>();

// CORS (Geliştirme aşamasında frontend Vite dev server ile iletişim için)
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyHeader()
              .AllowAnyMethod()
              .SetIsOriginAllowed(_ => true)
              .AllowCredentials();
    });
});

var app = builder.Build();

// Veritabanı otomatik migration çalıştırma
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<IDbConnectionFactory>();
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
    try
    {
        DatabaseMigrator.Migrate(db, logger);
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Veritabanı migration adımı sırasında kritik hata!");
    }
}

app.UseCors();

// Statik Dosyalar (Frontend SPA çıktısı için)
app.UseDefaultFiles();
app.UseStaticFiles();

// Minimal API Endpoint Grupları
app.MapServicesEndpoints();
app.MapContainersEndpoints();
app.MapMetricsEndpoints();
app.MapUptimeEndpoints();
app.MapPushEndpoints();
app.MapAuthEndpoints();
app.MapDashboardEndpoints();

// SPA Routing Fallback
app.MapFallbackToFile("index.html");

app.Run();
