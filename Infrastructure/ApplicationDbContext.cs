using MediatR;
using Microsoft.EntityFrameworkCore;
using NetCorePal.Extensions.Repository.EntityFrameworkCore;
using OpenClawWalletServer.Domain.AggregatesModel.AgentConfigAggregate;
using OpenClawWalletServer.Domain.AggregatesModel.AgentGlobalConfigAggregate;
using OpenClawWalletServer.Domain.AggregatesModel.KeyConfigAggregate;
using OpenClawWalletServer.Domain.AggregatesModel.LoginPasswordAggregate;
using OpenClawWalletServer.Domain.AggregatesModel.SignRecordAggregate;
using OpenClawWalletServer.Domain.AggregatesModel.WhitelistAggregate;

namespace OpenClawWalletServer.Infrastructure;

public partial class ApplicationDbContext(
    DbContextOptions<ApplicationDbContext> options,
    IMediator mediator
) : AppDbContextBase(options, mediator)
{
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        if (modelBuilder is null)
        {
            throw new ArgumentNullException(nameof(modelBuilder));
        }

        modelBuilder.ApplyConfigurationsFromAssembly(typeof(ApplicationDbContext).Assembly);
        base.OnModelCreating(modelBuilder);
    }

    protected override void ConfigureConventions(ModelConfigurationBuilder configurationBuilder)
    {
        ConfigureStronglyTypedIdValueConverter(configurationBuilder);
        base.ConfigureConventions(configurationBuilder);
    }

    /// <summary>
    /// Agent 配置
    /// </summary>
    public DbSet<AgentConfig> AgentConfigs => Set<AgentConfig>();

    /// <summary>
    /// 密钥配置
    /// </summary>
    public DbSet<KeyConfig> KeyConfigs => Set<KeyConfig>();

    /// <summary>
    /// 签名日志
    /// </summary>
    public DbSet<SignRecord> SignRecords => Set<SignRecord>();
    
    /// <summary>
    /// 全局配置
    /// </summary>
    public DbSet<AgentGlobalConfig> AgentGlobalConfigs => Set<AgentGlobalConfig>();

    /// <summary>
    /// 登录密码
    /// </summary>
    public DbSet<LoginPassword> LoginPasswords => Set<LoginPassword>();

    /// <summary>
    /// 白名单项
    /// </summary>
    public DbSet<WhitelistItem> WhitelistItems => Set<WhitelistItem>();
}