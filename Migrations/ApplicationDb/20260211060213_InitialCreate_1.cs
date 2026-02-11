using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OpenClawWalletServer.Migrations.ApplicationDb
{
    /// <inheritdoc />
    public partial class InitialCreate_1 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AgentConfig",
                columns: table => new
                {
                    Id = table.Column<long>(type: "INTEGER", nullable: false),
                    ServerUrl = table.Column<string>(type: "TEXT", maxLength: 256, nullable: false, defaultValue: ""),
                    Code = table.Column<string>(type: "TEXT", maxLength: 128, nullable: false, defaultValue: ""),
                    Token = table.Column<string>(type: "TEXT", maxLength: 256, nullable: false, defaultValue: ""),
                    Deleted = table.Column<bool>(type: "INTEGER", nullable: false, defaultValue: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false, defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified)),
                    UpdateAt = table.Column<DateTime>(type: "TEXT", nullable: false, defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified))
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AgentConfig", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "AgentGlobalConfig",
                columns: table => new
                {
                    Id = table.Column<long>(type: "INTEGER", nullable: false),
                    SingleTransactionMaxLimit = table.Column<long>(type: "INTEGER", nullable: false, defaultValue: 0L),
                    RowVersion = table.Column<int>(type: "INTEGER", nullable: false, defaultValue: 0),
                    CreatedAt = table.Column<DateTimeOffset>(type: "TEXT", nullable: false, defaultValue: new DateTimeOffset(new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0))),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "TEXT", nullable: false, defaultValue: new DateTimeOffset(new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0))),
                    Deleted = table.Column<bool>(type: "INTEGER", nullable: false, defaultValue: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AgentGlobalConfig", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "KeyConfig",
                columns: table => new
                {
                    Id = table.Column<long>(type: "INTEGER", nullable: false),
                    SignType = table.Column<int>(type: "INTEGER", nullable: false, defaultValue: 0),
                    Address = table.Column<string>(type: "TEXT", maxLength: 256, nullable: false, defaultValue: ""),
                    PrivateKey = table.Column<string>(type: "TEXT", maxLength: 512, nullable: false, defaultValue: ""),
                    Deleted = table.Column<bool>(type: "INTEGER", nullable: false, defaultValue: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false, defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified)),
                    UpdateAt = table.Column<DateTime>(type: "TEXT", nullable: false, defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified))
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_KeyConfig", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "LoginPassword",
                columns: table => new
                {
                    Id = table.Column<long>(type: "INTEGER", nullable: false),
                    SecretData = table.Column<string>(type: "TEXT", nullable: false, defaultValue: ""),
                    Deleted = table.Column<bool>(type: "INTEGER", nullable: false, defaultValue: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false, defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified)),
                    UpdateAt = table.Column<DateTime>(type: "TEXT", nullable: false, defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified))
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LoginPassword", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "SendTransactionRecord",
                columns: table => new
                {
                    Id = table.Column<long>(type: "INTEGER", nullable: false),
                    AgentSendTransactionTaskId = table.Column<long>(type: "INTEGER", nullable: false),
                    OrderId = table.Column<long>(type: "INTEGER", nullable: false),
                    OrderType = table.Column<int>(type: "INTEGER", nullable: false),
                    CurrencyType = table.Column<int>(type: "INTEGER", nullable: false, defaultValue: 0),
                    Content = table.Column<string>(type: "TEXT", maxLength: 1024, nullable: false, defaultValue: ""),
                    ExecuteTime = table.Column<DateTime>(type: "TEXT", nullable: false, defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified)),
                    Deleted = table.Column<bool>(type: "INTEGER", nullable: false, defaultValue: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SendTransactionRecord", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "SignRecord",
                columns: table => new
                {
                    Id = table.Column<long>(type: "INTEGER", nullable: false),
                    AgentTaskId = table.Column<long>(type: "INTEGER", nullable: false),
                    OrderId = table.Column<long>(type: "INTEGER", nullable: false),
                    OrderType = table.Column<int>(type: "INTEGER", nullable: false),
                    SignType = table.Column<int>(type: "INTEGER", nullable: false, defaultValue: 0),
                    Content = table.Column<string>(type: "TEXT", maxLength: 1024, nullable: false, defaultValue: ""),
                    SignTime = table.Column<DateTime>(type: "TEXT", nullable: false, defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified)),
                    Deleted = table.Column<bool>(type: "INTEGER", nullable: false, defaultValue: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SignRecord", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "WhitelistItem",
                columns: table => new
                {
                    Id = table.Column<long>(type: "INTEGER", nullable: false),
                    Address = table.Column<string>(type: "TEXT", nullable: false),
                    SingleTransactionMaxLimit = table.Column<long>(type: "INTEGER", nullable: false),
                    Deleted = table.Column<bool>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WhitelistItem", x => x.Id);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AgentConfig");

            migrationBuilder.DropTable(
                name: "AgentGlobalConfig");

            migrationBuilder.DropTable(
                name: "KeyConfig");

            migrationBuilder.DropTable(
                name: "LoginPassword");

            migrationBuilder.DropTable(
                name: "SendTransactionRecord");

            migrationBuilder.DropTable(
                name: "SignRecord");

            migrationBuilder.DropTable(
                name: "WhitelistItem");
        }
    }
}
