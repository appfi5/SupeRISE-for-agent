using Ckb.Sdk.Core;
using Ckb.Sdk.Core.Types;
using Ckb.Sdk.Core.Utils.Addresses;
using Ckb.Sdk.Utils.Crypto.Secp256k1;
using Ckb.Sdk.Utils.Utils;
using SupeRISELocalServer.Utils;
using Xunit;

namespace Test;

public class SignatureTest
{
    [Fact]
    public async Task Signature()
    {
        var addressInfo = GenSingleAddress(Network.Testnet);
        var privateKey = addressInfo.PrivateKey;
        var publicKey = addressInfo.PublicKey;
        const string message = "test";
        var hashHex = CkbHash.Blake2B256Hex(message);
        var signature = SignMessageUtils.SignMessage(privateKey, message);

        var signatureData = new SignatureData(Numeric.HexStringToByteArray(signature));
        var isValid = Sign.VerifyMessage(Numeric.HexStringToByteArray(hashHex), signatureData,
            Numeric.ToBigInt(publicKey), false);

        Assert.True(isValid);
    }

    /// <summary>
    /// 生成单签地址
    /// </summary>
    private static AddressPair GenSingleAddress(Network network = Network.Mainnet)
    {
        var keyPair = Keys.CreateSecp256k1KeyPair();
        var ecKeyPair = ECKeyPair.Create(keyPair);
        var privateKey = Numeric.ToHexString(ecKeyPair.GetEncodedPrivateKey());
        var publicKey = Numeric.ToHexString(ecKeyPair.GetEncodedPublicKey(true));
        var script = Script.GenerateSecp256K1Blake160SignhashAllScript(ecKeyPair);
        var address = new Address(script, network).Encode();
        return new AddressPair
        {
            Address = address,
            PublicKey = publicKey,
            PrivateKey = privateKey
        };
    }

    /// <summary>
    /// 地址私钥对
    /// </summary>
    private class AddressPair
    {
        /// <summary>
        /// 地址
        /// </summary>
        public required string Address { get; set; }

        /// <summary>
        /// 公钥
        /// </summary>
        public required string PublicKey { get; set; }

        /// <summary>
        /// 私钥
        /// </summary>
        public required string PrivateKey { get; set; }
    }
}