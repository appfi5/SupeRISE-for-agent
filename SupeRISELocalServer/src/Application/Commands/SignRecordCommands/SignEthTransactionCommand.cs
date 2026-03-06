using System.Numerics;
using Microsoft.AspNetCore.DataProtection;
using NetCorePal.Extensions.Primitives;
using Nethereum.Hex.HexConvertors.Extensions;
using Nethereum.Hex.HexTypes;
using Nethereum.Signer;
using Nethereum.Util;
using Newtonsoft.Json;
using SupeRISELocalServer.Domain.AggregatesModel.SignRecordAggregate;
using SupeRISELocalServer.Domain.Enums;
using SupeRISELocalServer.Infrastructure.Repositories;

namespace SupeRISELocalServer.Application.Commands.SignRecordCommands;

/// <summary>
/// 签名 ETH/USDC 交易命令
/// </summary>
public class SignEthTransactionCommand : ICommand<SignEthTransactionCommandResult>
{
    /// <summary>
    /// 签名地址
    /// </summary>
    public required string Address { get; set; }

    /// <summary>
    /// 未签名的交易（JSON 序列化）
    /// </summary>
    public required string Content { get; set; }
}

/// <summary>
/// 命令结果
/// </summary>
public class SignEthTransactionCommandResult
{
    /// <summary>
    /// 签名地址
    /// </summary>
    public required string Address { get; set; }

    /// <summary>
    /// 已签名的交易（RLP 编码 hex，含 0x 前缀）
    /// </summary>
    public required string SignedTransaction { get; set; }

    /// <summary>
    /// 交易 Hash
    /// </summary>
    public required string TxHash { get; set; }
}

/// <summary>
/// ETH 未签名交易结构
/// </summary>
public class EthUnsignedTransaction
{
    /// <summary>
    /// 目标地址
    /// </summary>
    public required string To { get; set; }

    /// <summary>
    /// 转账金额（wei，十六进制字符串，如 "0xde0b6b3a7640000"）
    /// </summary>
    public required string Value { get; set; }

    /// <summary>
    /// 调用数据（十六进制，ETH 转账为空，ERC-20 为编码后的 transfer 调用）
    /// </summary>
    public string Data { get; set; } = "0x";

    /// <summary>
    /// Nonce（十六进制字符串）
    /// </summary>
    public required string Nonce { get; set; }

    /// <summary>
    /// Gas Price（wei，十六进制字符串）
    /// </summary>
    public required string GasPrice { get; set; }

    /// <summary>
    /// Gas Limit（十六进制字符串）
    /// </summary>
    public required string GasLimit { get; set; }

    /// <summary>
    /// 链 ID（整数，如以太坊主网为 1，Sepolia 为 11155111）
    /// </summary>
    public required long ChainId { get; set; }
}

/// <summary>
/// 命令处理器
/// </summary>
public class SignEthTransactionCommandHandler(
    SignRecordRepository signRecordRepository,
    KeyConfigRepository keyConfigRepository,
    IDataProtectionProvider dataProtectionProvider
) : ICommandHandler<SignEthTransactionCommand, SignEthTransactionCommandResult>
{
    /// <summary>
    /// DataProtectionProvider Key
    /// </summary>
    private const string ProviderKey = "PrivateKey";

    public async Task<SignEthTransactionCommandResult> Handle(
        SignEthTransactionCommand command,
        CancellationToken cancellationToken
    )
    {
        var keyConfig = await keyConfigRepository.FindByAddress(command.Address, cancellationToken);
        if (keyConfig is null)
        {
            throw new KnownException("KeyConfig not found");
        }

        if (keyConfig.AddressType != AddressType.Eth)
        {
            throw new KnownException("Address is not an ETH address");
        }

        var tx = JsonConvert.DeserializeObject<EthUnsignedTransaction>(command.Content);
        if (tx is null)
        {
            throw new KnownException("ETH transaction deserialize failed");
        }

        // 解密私钥
        var dataProtector = dataProtectionProvider.CreateProtector(ProviderKey);
        var privateKey = dataProtector.Unprotect(keyConfig.PrivateKey);

        var txSigner = new LegacyTransactionSigner();
        var signedTxHex = txSigner.SignTransaction(
            privateKey,
            new BigInteger(tx.ChainId),
            tx.To,
            new HexBigInteger(tx.Value).Value,
            new HexBigInteger(tx.Nonce).Value,
            new HexBigInteger(tx.GasPrice).Value,
            new HexBigInteger(tx.GasLimit).Value,
            tx.Data
        );

        // 计算交易 Hash（对 RLP 编码后的已签名交易做 Keccak256）
        var sha3 = new Sha3Keccack();
        var txHashBytes = sha3.CalculateHash(signedTxHex.HexToByteArray());
        var txHash = "0x" + txHashBytes.ToHex();
        var signedTx = "0x" + signedTxHex;

        var signRecord = SignRecord.Create(
            addressType: AddressType.Eth,
            content: signedTx
        );

        await signRecordRepository.AddAsync(signRecord, cancellationToken);

        return new SignEthTransactionCommandResult
        {
            Address = command.Address,
            SignedTransaction = signedTx,
            TxHash = txHash,
        };
    }
}
