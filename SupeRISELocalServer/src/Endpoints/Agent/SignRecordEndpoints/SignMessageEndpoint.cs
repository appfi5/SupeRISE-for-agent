using FastEndpoints;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using NetCorePal.Extensions.Dto;
using SupeRISELocalServer.Extensions;
using SupeRISELocalServer.Application.Commands.SignRecordCommands;

namespace SupeRISELocalServer.Endpoints.Agent.SignRecordEndpoints;

/// <summary>
/// 签名 Ckb 消息 Endpoint
/// </summary>
[Tags("Agent")]
[HttpPost("api/v1/agent/sign/sign-message")]
[AllowAnonymous]
public class SignMessageEndpoint(
    IMediator mediator
) : Endpoint<SignMessageReq, ResponseData<SignMessageResp>>
{
    public override async Task HandleAsync(SignMessageReq req, CancellationToken ct)
    {
        var command = req.ToCommand();
        var result = SignMessageResp.From(await mediator.Send(command, ct));
        await Send.OkAsync(result.AsSuccessResponseData(), ct);
    }
}

/// <summary>
/// 签名请求
/// </summary>
public class SignMessageReq
{
    /// <summary>
    /// 签名地址
    /// </summary>
    public required string Address { get; set; }

    /// <summary>
    /// 签名内容
    /// </summary>
    public required string Message { get; set; }

    /// <summary>
    /// 请求转命令
    /// </summary>
    public SignMessageCommand ToCommand()
    {
        return new SignMessageCommand
        {
            Address = Address,
            Message = Message,
        };
    }
}

/// <summary>
/// 签名响应
/// </summary>
public class SignMessageResp
{
    /// <summary>
    /// 签名地址
    /// </summary>
    public required string Address { get; set; }

    /// <summary>
    /// 签名
    /// </summary>
    public required string Signature { get; set; }


    public static SignMessageResp From(SignMessageCommandResult result)
    {
        return new SignMessageResp
        {
            Address = result.Address,
            Signature = result.Signature,
        };
    }
}
