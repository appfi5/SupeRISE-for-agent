using Microsoft.AspNetCore.DataProtection;
using NetCorePal.Extensions.Primitives;
using SupeRISELocalServer.Domain.AggregatesModel.SignRecordAggregate;
using SupeRISELocalServer.Domain.Enums;
using SupeRISELocalServer.Infrastructure.Repositories;
using SupeRISELocalServer.Utils;

namespace SupeRISELocalServer.Application.Commands.SignRecordCommands;

/// <summary>
/// 签名消息命令
/// </summary>
public class SignMessageCommand : ICommand<SignMessageCommandResult>
{
    /// <summary>
    /// 签名地址
    /// </summary>
    public required string Address { get; set; }

    /// <summary>
    /// 签名内容
    /// </summary>
    public required string Message { get; set; }
}

/// <summary>
/// 命令结果
/// </summary>
public class SignMessageCommandResult
{
    /// <summary>
    /// 签名地址
    /// </summary>
    public required string Address { get; set; }

    /// <summary>
    /// 签名内容，交易
    /// </summary>
    public required string Signature { get; set; }
}

/// <summary>
/// 命令处理器
/// </summary>
public class SignMessageCommandHandler(
    SignRecordRepository signRecordRepository,
    KeyConfigRepository keyConfigRepository,
    IDataProtectionProvider dataProtectionProvider
) : ICommandHandler<SignMessageCommand, SignMessageCommandResult>
{
    /// <summary>
    /// DataProtectionProvider Key
    /// </summary>
    private const string ProviderKey = "PrivateKey";

    public async Task<SignMessageCommandResult> Handle(
        SignMessageCommand command,
        CancellationToken cancellationToken
    )
    {
        var keyConfig = await keyConfigRepository.FindByAddressOrDefault(command.Address, cancellationToken);
        if (keyConfig is null)
        {
            throw new KnownException("KeyConfig not found");
        }

        // 解密私钥
        var dataProtector = dataProtectionProvider.CreateProtector(ProviderKey);
        var privateKey = dataProtector.Unprotect(keyConfig.PrivateKey);
        
        var signature = SignMessageUtils.SignMessage(privateKey, command.Message);

        var signRecord = SignRecord.Create(
            addressType: AddressType.Ckb,
            content: signature
        );

        await signRecordRepository.AddAsync(signRecord, cancellationToken);

        return new SignMessageCommandResult
        {
            Address = command.Address,
            Signature = signature,
        };
    }
}
