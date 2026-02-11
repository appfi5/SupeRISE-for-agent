using NetCorePal.Extensions.Domain;

namespace OpenClawWalletServer.Domain.AggregatesModel.AgentConfigAggregate;

/// <summary>
/// Agent 配置 Id
/// </summary>
public partial record AgentConfigId : IGuidStronglyTypedId;

/// <summary>
/// Agent 配置
/// </summary>
public class AgentConfig : Entity<AgentConfigId>, IAggregateRoot
{
    protected AgentConfig()
    {
    }

    /// <summary>
    /// 服务端分配的访问 Token
    /// </summary>
    public string ApiKey { get; private set; } = string.Empty;

    /// <summary>
    /// 是否被删除
    /// </summary>
    public bool Deleted { get; private set; } = false;

    /// <summary>
    /// 创建时间
    /// </summary>
    public DateTime CreatedAt { get; private set; } = DateTime.MinValue;

    /// <summary>
    /// 更新时间
    /// </summary>
    public DateTime UpdateAt { get; private set; } = DateTime.MinValue;

    /// <summary>
    /// 创建 Agent 配置
    /// </summary>
    public static AgentConfig Create(
        string apiKey
    )
    {
        var config =  new AgentConfig
        {
            ApiKey = apiKey,
            Deleted = false,
            CreatedAt = DateTime.Now,
            UpdateAt = DateTime.Now,
        };
        return config;
    }

    /// <summary>
    /// 配置 Agent
    /// </summary>
    public void Config(string apiKey)
    {
        ApiKey = apiKey;
        UpdateAt = DateTime.Now;
    }
}
