using Nethereum.Hex.HexConvertors.Extensions;
using Nethereum.Signer;

namespace SupeRISELocalServer.Utils;

/// <summary>
/// ETH 地址生成工具
/// </summary>
public class GenEthAddressUtils
{
    /// <summary>
    /// 生成以太坊地址
    /// </summary>
    public static EthAddressInfo GenerateAddress()
    {
        var ecKey = EthECKey.GenerateKey();
        var privateKey = ecKey.GetPrivateKey();
        var publicKey = "0x04" + ecKey.GetPubKeyNoPrefix(false).ToHex();
        var address = ecKey.GetPublicAddress();
        return new EthAddressInfo
        {
            Address = address,
            PublicKey = publicKey,
            PrivateKey = privateKey,
        };
    }
}

/// <summary>
/// 以太坊地址信息
/// </summary>
public class EthAddressInfo
{
    /// <summary>
    /// 以太坊地址（EIP-55 checksum 格式）
    /// </summary>
    public required string Address { get; set; }

    /// <summary>
    /// 未压缩公钥（04 前缀 + 64 字节）
    /// </summary>
    public required string PublicKey { get; set; }

    /// <summary>
    /// 私钥（hex，含 0x 前缀）
    /// </summary>
    public required string PrivateKey { get; set; }
}
