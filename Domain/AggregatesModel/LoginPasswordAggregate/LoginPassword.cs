using NetCorePal.Extensions.Domain;

namespace OpenClawWalletServer.Domain.AggregatesModel.LoginPasswordAggregate;

/// <summary>
/// 登录密码 Id
/// </summary>
public partial record LoginPasswordId : IGuidStronglyTypedId;

/// <summary>
/// 登录密码
/// </summary>
public class LoginPassword : Entity<LoginPasswordId>, IAggregateRoot
{
    protected LoginPassword()
    {
    }

    /// <summary>
    /// 密钥信息
    /// </summary>
    public string SecretData { get; private set; } = string.Empty;

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
    /// 创建登录密码
    /// </summary>
    public static LoginPassword Create(string secretData)
    {
        var instance = new LoginPassword
        {
            SecretData = secretData
        };
        return instance;
    }

    /// <summary>
    /// 修改密码
    /// </summary>
    public void ModifyPassword(string secretData)
    {
        SecretData = secretData;
    }

    public bool Delete()
    {
        Deleted = true;
        UpdateAt = DateTime.Now;
        return true;
    }
}
