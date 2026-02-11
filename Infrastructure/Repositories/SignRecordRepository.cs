using NetCorePal.Extensions.Repository.EntityFrameworkCore;
using OpenClawWalletServer.Domain.AggregatesModel.SignRecordAggregate;

namespace OpenClawWalletServer.Infrastructure.Repositories;

/// <summary>
/// 签名记录仓储
/// </summary>
public class SignRecordRepository(
    ApplicationDbContext context
) : RepositoryBase<SignRecord, SignRecordId, ApplicationDbContext>(context)
{
}