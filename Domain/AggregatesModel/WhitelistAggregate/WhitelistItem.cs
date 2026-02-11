using NetCorePal.Extensions.Domain;

namespace OpenClawWalletServer.Domain.AggregatesModel.WhitelistAggregate;

/// <summary>
/// 白名单 Id
/// </summary>
public partial record WhitelistItemId : IGuidStronglyTypedId;

/// <summary>
/// 白名单项
/// </summary>
public class WhitelistItem : Entity<WhitelistItemId>, IAggregateRoot
{
    protected WhitelistItem()
    {
    }

    /// <summary>
    /// 资金流出白名单地址
    /// </summary>
    public string Address { get; private set; } = string.Empty;

    /// <summary>
    /// 单笔最大金额
    /// </summary>
    public long SingleTransactionMaxLimit { get; private set; }

    /// <summary>
    /// 是否已删除
    /// </summary>
    public bool Deleted { get; private set; } = false;

    /// <summary>
    /// 创建白名单
    /// </summary>
    public static WhitelistItem Create(string address, long limit)
    {
        var instance = new WhitelistItem
        {
            Address = address,
            SingleTransactionMaxLimit = limit,
        };
        return instance;
    }

    /// <summary>
    /// 删除白名单项
    /// </summary>
    public void Delete()
    {
        Deleted = true;
    }

    /// <summary>
    /// 修改白名单项
    /// </summary>
    public void Modify(string address, long limit)
    {
        Address = address;
        SingleTransactionMaxLimit = limit;
    }
}
