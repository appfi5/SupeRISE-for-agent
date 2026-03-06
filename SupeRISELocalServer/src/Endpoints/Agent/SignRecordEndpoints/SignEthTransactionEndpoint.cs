using FastEndpoints;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using NetCorePal.Extensions.Dto;
using SupeRISELocalServer.Extensions;
using SupeRISELocalServer.Application.Commands.SignRecordCommands;

namespace SupeRISELocalServer.Endpoints.Agent.SignRecordEndpoints;

/// <summary>
/// 签名 ETH/USDC 交易 Endpoint
/// </summary>
[Tags("Agent")]
[HttpPost("api/v1/agent/sign/sign-eth-transaction")]
[AllowAnonymous]
public class SignEthTransactionEndpoint(
    IMediator mediator
) : Endpoint<SignEthTransactionReq, ResponseData<SignEthTransactionResp>>
{
    public override async Task HandleAsync(SignEthTransactionReq req, CancellationToken ct)
    {
        var command = req.ToCommand();
        var result = SignEthTransactionResp.From(await mediator.Send(command, ct));
        await Send.OkAsync(result.AsSuccessResponseData(), ct);
    }
}

/// <summary>
/// 签名 ETH/USDC 交易请求
/// </summary>
public class SignEthTransactionReq
{
    /// <summary>
    /// 签名地址（ETH 地址，如 0x...）
    /// </summary>
    public required string Address { get; set; }

    /// <summary>
    /// 未签名的交易（JSON 序列化的 EthUnsignedTransaction）
    /// </summary>
    public required string Content { get; set; }

    /// <summary>
    /// 请求转命令
    /// </summary>
    public SignEthTransactionCommand ToCommand()
    {
        return new SignEthTransactionCommand
        {
            Address = Address,
            Content = Content,
        };
    }
}

/// <summary>
/// 签名 ETH/USDC 交易响应
/// </summary>
public class SignEthTransactionResp
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

    public static SignEthTransactionResp From(SignEthTransactionCommandResult result)
    {
        return new SignEthTransactionResp
        {
            Address = result.Address,
            SignedTransaction = result.SignedTransaction,
            TxHash = result.TxHash,
        };
    }
}
