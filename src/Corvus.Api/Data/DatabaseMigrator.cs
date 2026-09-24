using System.Reflection;
using DbUp;

namespace Corvus.Api.Data;

public static class DatabaseMigrator
{
    public static void Migrate(IDbConnectionFactory connectionFactory, ILogger logger)
    {
        string connectionString = connectionFactory.ConnectionString;

        logger.LogInformation("Veritabanı migration kontrolü yapılıyor: {DbPath}", connectionFactory.DatabasePath);

        // WAL modu SQLite'ta kalıcıdır; veritabanı dosyasında 1 kez başlatılması yeterlidir.
        using (var initConn = new Microsoft.Data.Sqlite.SqliteConnection(connectionString))
        {
            initConn.Open();
            using var walCmd = initConn.CreateCommand();
            walCmd.CommandText = "PRAGMA journal_mode = WAL;";
            walCmd.ExecuteNonQuery();
        }

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
