using Nethereum.Hex.HexConvertors.Extensions;
using Nethereum.Hex.HexTypes;
using Nethereum.Signer;
using Nethereum.Util;
using SupeRISELocalServer.Application.Commands.SignRecordCommands;
using SupeRISELocalServer.Utils;
using Xunit;

namespace Test;

/// <summary>
/// ETH / USDC 签名测试
/// </summary>
public class EthSignatureTest
{
    /// <summary>
    /// ETH 消息签名与恢复地址验证
    /// </summary>
    [Fact]
    public void SignAndVerifyEthMessage()
    {
        var addressInfo = GenEthAddressUtils.GenerateAddress();

        const string message = "Hello ETH";
        var signature = EthSignMessageUtils.SignMessage(addressInfo.PrivateKey, message);
        var recoveredAddress = EthSignMessageUtils.RecoverSignerAddress(message, signature);

        Assert.Equal(
            addressInfo.Address.ToLowerInvariant(),
            recoveredAddress.ToLowerInvariant()
        );
    }

    /// <summary>
    /// EthSignMessageUtils.GetAddress 与生成地址一致
    /// </summary>
    [Fact]
    public void GetAddressMatchesGeneratedAddress()
    {
        var addressInfo = GenEthAddressUtils.GenerateAddress();
        var address = EthSignMessageUtils.GetAddress(addressInfo.PrivateKey);

        Assert.Equal(
            addressInfo.Address.ToLowerInvariant(),
            address.ToLowerInvariant()
        );
    }

    /// <summary>
    /// ETH（Legacy）交易签名并验证发送方地址
    /// </summary>
    [Fact]
    public void SignEthLegacyTransactionAndRecoverSender()
    {
        var addressInfo = GenEthAddressUtils.GenerateAddress();

        // 构造一笔简单的 ETH 转账交易（Legacy/Type-0）
        var tx = new EthUnsignedTransaction
        {
            To = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
            Value = "0xde0b6b3a7640000",  // 1 ETH in wei
            Data = "0x",
            Nonce = "0x0",
            GasPrice = "0x4a817c800",     // 20 Gwei
            GasLimit = "0x5208",          // 21000
            ChainId = 1,
        };

        var txSigner = new LegacyTransactionSigner();
        var signedTxHex = txSigner.SignTransaction(
            addressInfo.PrivateKey,
            new System.Numerics.BigInteger(tx.ChainId),
            tx.To,
            new HexBigInteger(tx.Value).Value,
            new HexBigInteger(tx.Nonce).Value,
            new HexBigInteger(tx.GasPrice).Value,
            new HexBigInteger(tx.GasLimit).Value,
            tx.Data
        );

        // 验证：从已签名交易中恢复发送方地址
        var recovery = new TransactionVerificationAndRecovery();
        var senderAddress = recovery.GetSenderAddress(signedTxHex);

        Assert.Equal(
            addressInfo.Address.ToLowerInvariant(),
            senderAddress.ToLowerInvariant()
        );
    }

    /// <summary>
    /// USDC ERC-20 transfer 调用数据签名与验证
    /// </summary>
    [Fact]
    public void SignUsdcErc20TransferAndRecoverSender()
    {
        var addressInfo = GenEthAddressUtils.GenerateAddress();

        // USDC 合约地址（主网）
        const string usdcContract = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";

        // 构造 ERC-20 transfer(address,uint256) 调用数据
        // transfer(0x70997970C51812dc3A010C7d01b50e0d17dc79C8, 100_000_000) // 100 USDC (6 decimals)
        const string recipientAddress = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
        const ulong amount = 100_000_000UL; // 100 USDC

        // ABI-encode: selector(transfer(address,uint256)) = 0xa9059cbb
        var selector = "a9059cbb";
        var paddedAddress = recipientAddress[2..].PadLeft(64, '0'); // remove 0x and pad to 32 bytes
        var paddedAmount = amount.ToString("x").PadLeft(64, '0');   // pad to 32 bytes
        var data = "0x" + selector + paddedAddress + paddedAmount;

        var tx = new EthUnsignedTransaction
        {
            To = usdcContract,
            Value = "0x0",   // no ETH transfer
            Data = data,
            Nonce = "0x1",
            GasPrice = "0x4a817c800",  // 20 Gwei
            GasLimit = "0xea60",       // 60000
            ChainId = 1,
        };

        var txSigner = new LegacyTransactionSigner();
        var signedTxHex = txSigner.SignTransaction(
            addressInfo.PrivateKey,
            new System.Numerics.BigInteger(tx.ChainId),
            tx.To,
            new HexBigInteger(tx.Value).Value,
            new HexBigInteger(tx.Nonce).Value,
            new HexBigInteger(tx.GasPrice).Value,
            new HexBigInteger(tx.GasLimit).Value,
            tx.Data
        );

        var recovery = new TransactionVerificationAndRecovery();
        var senderAddress = recovery.GetSenderAddress(signedTxHex);

        Assert.Equal(
            addressInfo.Address.ToLowerInvariant(),
            senderAddress.ToLowerInvariant()
        );
    }

    /// <summary>
    /// 不同消息签名后不应产生相同签名
    /// </summary>
    [Fact]
    public void DifferentMessagesProduceDifferentSignatures()
    {
        var addressInfo = GenEthAddressUtils.GenerateAddress();

        var sig1 = EthSignMessageUtils.SignMessage(addressInfo.PrivateKey, "message one");
        var sig2 = EthSignMessageUtils.SignMessage(addressInfo.PrivateKey, "message two");

        Assert.NotEqual(sig1, sig2);
    }
}
