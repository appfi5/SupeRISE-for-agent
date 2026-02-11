using OpenClawWalletServer.Domain.Enums;
using NetCorePal.Extensions.Domain;

namespace OpenClawWalletServer.Domain.AggregatesModel.SignRecordAggregate;

/// <summary>
/// 签名记录 Id
/// </summary>
public partial record SignRecordId : IGuidStronglyTypedId;

/// <summary>
/// 资金流出订单 AgentTask Id
/// </summary>
public partial record BusinessCashOutOrderAgentTaskId : IGuidStronglyTypedId;

/// <summary>
/// 签名记录
/// </summary>
public class SignRecord : Entity<SignRecordId>, IAggregateRoot
{
    protected SignRecord()
    {
    }

    /// <summary>
    /// 签名类型
    /// </summary>
    public SignType SignType { get; private set; } = SignType.Unknown;

    /// <summary>
    /// 签名内容
    /// </summary>
    public string Content { get; private set; } = string.Empty;

    /// <summary>
    /// 签名时间
    /// </summary>
    public DateTime SignTime { get; private set; } = DateTime.MinValue;

    /// <summary>
    /// 是否已删除
    /// </summary>
    public bool Deleted { get; private set; } = false;

    /// <summary>
    /// 创建签名记录
    /// </summary>
    public static SignRecord Create(
        SignType signType
    )
    {
        var record = new SignRecord
        {
            SignType = signType,
            SignTime = DateTime.Now
        };
        return record;
    }
}
