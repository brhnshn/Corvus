using System.Reflection;
using DbUp;

namespace Corvus.Api.Data;

public static class DatabaseMigrator
{
    public static void Migrate(IDbConnectionFactory connectionFactory, ILogger logger)
    {
        string connectionString = connectionFactory.ConnectionString;

        logger.LogInformation("Veritabanı migration kontrolü yapılıyor: {DbPath}", connectionFactory.DatabasePath);

        var upgrader = DeployChanges.To
            .SqliteDatabase(connectionString)
            .WithScriptsEmbeddedInAssembly(Assembly.GetExecutingAssembly())
            .LogToConsole()
            .Build();

        var result = upgrader.PerformUpgrade();

        if (!result.Successful)
        {
            logger.LogError(result.Error, "Veritabanı migration işlemi başarısız oldu!");
            throw result.Error;
        }

        logger.LogInformation("Veritabanı migration başarıyla tamamlandı.");
    }
}
