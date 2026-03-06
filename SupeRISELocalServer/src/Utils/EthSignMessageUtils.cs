using Nethereum.Signer;

namespace SupeRISELocalServer.Utils;

/// <summary>
/// ETH 签名消息工具 (EIP-191 personal_sign)
/// </summary>
public class EthSignMessageUtils
{
    /// <summary>
    /// 签名消息 (EIP-191 personal_sign)
    /// </summary>
    public static string SignMessage(string privateKey, string message)
    {
        var signer = new EthereumMessageSigner();
        return signer.EncodeUTF8AndSign(message, new EthECKey(privateKey));
    }

    /// <summary>
    /// 验证签名，返回签名者地址
    /// </summary>
    public static string RecoverSignerAddress(string message, string signature)
    {
        var signer = new EthereumMessageSigner();
        return signer.EncodeUTF8AndEcRecover(message, signature);
    }

    /// <summary>
    /// 通过私钥获取以太坊地址
    /// </summary>
    public static string GetAddress(string privateKey)
    {
        return new EthECKey(privateKey).GetPublicAddress();
    }
}
