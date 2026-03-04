using Ckb.Sdk.Utils.Crypto.Secp256k1;
using Ckb.Sdk.Utils.Utils;

namespace SupeRISELocalServer.Utils;

/// <summary>
/// 签名消息工具
/// </summary>
public class SignMessageUtils
{
    /// <summary>
    /// 签名消息
    /// </summary>
    public static string SignMessage(string privateKey, string message)
    {
        var keyPair = ECKeyPair.Create(privateKey);
        var messageByte = Numeric.HexStringToByteArray(CkbHash.Blake2B256Hex(message));
        var signature = Sign.SignMessage(messageByte, keyPair).GetSignature();
        return Numeric.ToHexString(signature);
    }
}