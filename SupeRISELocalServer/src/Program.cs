using System.Net;
using System.Reflection;
using Ckb.Sdk.Core;
using FastEndpoints;
using FastEndpoints.Swagger;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.EntityFrameworkCore;
using NetCorePal.Extensions.DependencyInjection;
using NetCorePal.Extensions.Domain.Json;
using SupeRISELocalServer.Domain.AggregatesModel.KeyConfigAggregate;
using SupeRISELocalServer.Domain.Enums;
using SupeRISELocalServer.Extensions;
using SupeRISELocalServer.Infrastructure;
using SupeRISELocalServer.Options;
using SupeRISELocalServer.Utils;
using NetCorePal.Extensions.AspNetCore;

namespace SupeRISELocalServer;

public class Program
{
    public static async Task Main(string[] args)
    {
        var builder = WebApplication.CreateBuilder(args);

        builder.Services.AddHealthChecks();
        builder.Services.AddEndpointsApiExplorer();
        builder.Services.AddSwaggerGen();

        // Ckb & Eth 配置
        var ckbOption = new CkbOptions();
        builder.Services.Configure<CkbOptions>(builder.Configuration.GetSection("Ckb"));
        builder.Configuration.GetSection("Ckb").Bind(ckbOption);

        builder.Services.Configure<EthOptions>(builder.Configuration.GetSection("Eth"));

        // 当前环境 配置
        var currentEnvironmentOptions = new CurrentEnvironmentOptions();
        builder.Services.Configure<CurrentEnvironmentOptions>(builder.Configuration.GetSection("CurrentEnvironment"));
        builder.Configuration.GetSection("CurrentEnvironment").Bind(currentEnvironmentOptions);

        // 配置应用数据库
        builder.Services.AddDbContext<ApplicationDbContext>(options =>
            options.UseSqlite(
                builder.Configuration.GetConnectionString("AppDb"),
                sqliteOptionsAction: optionBuilder =>
                    optionBuilder.MigrationsAssembly(typeof(Program).Assembly.FullName)
            )
        );

        // 配置 DataProtect
        builder.Services.AddDataProtection().PersistKeysToDbContext<ApplicationDbContext>();


        builder.Services.AddMediatR(configuration => configuration
            .RegisterServicesFromAssemblies(Assembly.GetExecutingAssembly())
            .AddOpenBehavior(typeof(AgentValidationBehavior<,>))
            .AddUnitOfWorkBehaviors()
        );

        builder.Services.AddUnitOfWork<ApplicationDbContext>();

        // 配置仓储
        builder.Services.AddRepositories(typeof(ApplicationDbContext).Assembly);

        builder.Services.AddControllers().AddJsonOptions(options =>
        {
            options.JsonSerializerOptions.Converters.Add(new EntityIdJsonConverterFactory());
        });
        builder.Services.AddSwaggerGenNewtonsoftSupport();

        #region AddAddEthereumMessageSigner

        builder.Services.AddEthereumMessageSigner();

        #endregion

        builder.Services.AddHttpContextAccessor();

        #region Fast Endpoints

        builder.Services.AddFastEndpoints(o => { o.IncludeAbstractValidators = true; });
        builder.Services.AddResponseCaching();
        builder.Services.SwaggerDocument(o =>
        {
            o.DocumentSettings = s =>
            {
                s.Version = "v1"; //must match what's being passed in to the map method below
                s.Title = $"SupeRISELocalServer";
            };
            //自动Tag路径
            o.AutoTagPathSegmentIndex = 0;
        });

        #endregion

        // Cookie 认证
        builder.Services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
            .AddCookie(configureOptions =>
                {
                    configureOptions.Events.OnRedirectToLogin = context =>
                    {
                        context.Response.StatusCode = (int)HttpStatusCode.Unauthorized;
                        return Task.CompletedTask;
                    };
                    configureOptions.Cookie.Name = "token";
                    configureOptions.ExpireTimeSpan = TimeSpan.FromDays(1);
                    configureOptions.SlidingExpiration = true;
                }
            );

        var app = builder.Build();

        app.UseKnownExceptionHandler();

        var logger = app.Services.GetRequiredService<ILogger<Program>>();
        logger.LogInformation("Agent 启动");
        if (!Directory.Exists("data"))
        {
            logger.LogError("data 目录不存在");
            Directory.CreateDirectory("data");
        }

        app.UseFastEndpoints().UseSwaggerGen(
            config: c => { c.Path = $"/superise-for-agent/swagger/{{documentName}}/swagger.{{json|yaml}}"; },
            uiConfig: u =>
            {
                u.Path = $"/superise-for-agent/swagger";
                u.DocumentPath =
                    $"/superise-for-agent/swagger/{{documentName}}/swagger.{{json|yaml}}";
            });

        using var scope = app.Services.CreateScope();


        // 创建数据库文件
        var appDbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        await appDbContext.Database.MigrateAsync();

        // 初始化用户地址
        if (currentEnvironmentOptions.IsDebug)
        {
            const string providerKey = "PrivateKey";
            var provider = scope.ServiceProvider.GetRequiredService<IDataProtectionProvider>()
                .CreateProtector(providerKey);
            var keyConfig = await appDbContext.KeyConfigs.FirstOrDefaultAsync();
            if (keyConfig is null)
            {
                var addressInfo = GenAddressUtils.GenSingleAddress(Network.Testnet);
                await appDbContext.KeyConfigs.AddAsync(
                    KeyConfig.Create(
                        AddressType.Ckb,
                        addressInfo.Address,
                        addressInfo.PublicKey,
                        provider.Protect(addressInfo.PrivateKey)
                    )
                );
                await appDbContext.SaveChangesAsync();
            }
        }


        app.UseDefaultFiles();
        app.UseStaticFiles();
        app.MapControllers();
        app.MapHealthChecks("/healthz");

        await app.RunAsync();
    }
}