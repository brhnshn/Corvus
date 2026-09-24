using System.Data;
using Microsoft.Data.Sqlite;

namespace Corvus.Api.Data;

public interface IDbConnectionFactory
{
    IDbConnection CreateConnection();
    string ConnectionString { get; }
    string DatabasePath { get; }
}

public class DbConnectionFactory : IDbConnectionFactory
{
    private readonly string _connectionString;
    public string ConnectionString => _connectionString;
    public string DatabasePath { get; }

    public DbConnectionFactory(IConfiguration configuration)
    {
        string dataDir = Environment.GetEnvironmentVariable("CORVUS_DATA_DIR")
                         ?? configuration["Database:DataDir"]
                         ?? Path.Combine(AppContext.BaseDirectory, "data");

        if (!Directory.Exists(dataDir))
        {
            Directory.CreateDirectory(dataDir);
        }

        DatabasePath = Path.Combine(dataDir, "corvus.db");
        _connectionString = new SqliteConnectionStringBuilder
        {
            DataSource = DatabasePath,
            Mode = SqliteOpenMode.ReadWriteCreate
        }.ToString();
    }

    public IDbConnection CreateConnection()
    {
        var connection = new SqliteConnection(_connectionString);
        connection.Open();

        // Performans ve veri bütünlüğü optimizasyonları (busy_timeout, foreign_keys, synchronous, mmap_size 16MB)
        using var cmd = connection.CreateCommand();
        cmd.CommandText = "PRAGMA foreign_keys = ON; PRAGMA synchronous = NORMAL; PRAGMA busy_timeout = 5000; PRAGMA mmap_size = 16777216;";
        cmd.ExecuteNonQuery();

        return connection;
    }
}
