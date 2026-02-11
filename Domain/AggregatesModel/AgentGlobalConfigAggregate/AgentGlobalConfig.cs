using NetCorePal.Extensions.Domain;

namespace OpenClawWalletServer.Domain.AggregatesModel.AgentGlobalConfigAggregate;

/// <summary>
/// agent 全局配置
/// </summary>
public partial record AgentGlobalConfigId : IGuidStronglyTypedId;

public class AgentGlobalConfig : Entity<AgentGlobalConfigId>, IAggregateRoot
{
    protected AgentGlobalConfig()
    {
    }

    /// <summary>
    /// 单笔最大金额限额 标准币种 精度六位 例如：1usd * 1000000
    /// </summary> 
    public long SingleTransactionMaxLimit { get; private set; }

    /// <summary>
    /// 行版本，处理并发问题
    /// </summary> 
    public RowVersion RowVersion { get; private set; } = null!;

    /// <summary>
    /// 创建时间
    /// </summary> 
    public DateTimeOffset CreatedAt { get; private set; } = DateTimeOffset.UtcNow;

    /// <summary>
    /// 更新时间
    /// </summary> 
    public DateTimeOffset UpdatedAt { get; private set; } = DateTimeOffset.UtcNow;

    /// <summary>
    /// 是否删除
    /// </summary> 
    public bool Deleted { get; private set; } = false;

    /// <summary>
    /// 创建
    /// </summary>
    public static AgentGlobalConfig Create(
        decimal singleTransactionMaxLimit
    )
    {
        return new AgentGlobalConfig
        {
            SingleTransactionMaxLimit = Convert.ToInt64(singleTransactionMaxLimit * 1000000m)
        };
    }

    /// <summary>
    /// 修改
    /// </summary>
    public void Edit(decimal singleTransactionMaxLimit)
    {
        SingleTransactionMaxLimit = Convert.ToInt64(singleTransactionMaxLimit * 1000000m);
        UpdatedAt = DateTimeOffset.UtcNow;
    }
    
    public void Delete()
    {
        Deleted = true;
        UpdatedAt = DateTimeOffset.UtcNow;
    }
}
