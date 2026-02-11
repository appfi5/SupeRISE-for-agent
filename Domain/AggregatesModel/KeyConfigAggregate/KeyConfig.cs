using OpenClawWalletServer.Domain.Enums;
using NetCorePal.Extensions.Domain;

namespace OpenClawWalletServer.Domain.AggregatesModel.KeyConfigAggregate;

/// <summary>
/// 密钥配置 Id
/// </summary>
public partial record KeyConfigId : IGuidStronglyTypedId;

/// <summary>
/// 密钥配置
/// </summary>
public class KeyConfig : Entity<KeyConfigId>, IAggregateRoot
{
    protected KeyConfig()
    {
    }

    /// <summary>
    /// 签名类型
    /// </summary>
    public SignType SignType { get; private set; } = SignType.Unknown;

    /// <summary>
    /// 私钥对应的链上地址
    /// </summary>
    public string Address { get; private set; } = string.Empty;

    /// <summary>
    /// 私钥
    /// </summary>
    public string PrivateKey { get; private set; } = string.Empty;

    /// <summary>
    /// 是否已被删除
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
    /// 创建密钥配置
    /// </summary>
    public static KeyConfig Create(
        SignType signType,
        string address,
        string privateKey
    )
    {
        var config = new KeyConfig
        {
            SignType = signType,
            Address = address,
            PrivateKey = privateKey,
            CreatedAt = DateTime.Now,
            UpdateAt = DateTime.Now,
        };
        return config;
    }

    /// <summary>
    /// 逻辑删除 KeyConfig
    /// </summary>
    public void Delete()
    {
        UpdateAt = DateTime.Now;
        Deleted = true;
    }
}
