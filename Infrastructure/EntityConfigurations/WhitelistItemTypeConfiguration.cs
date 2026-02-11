using OpenClawWalletServer.Domain.AggregatesModel.WhitelistAggregate;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using NetCorePal.Extensions.Repository.EntityFrameworkCore;

namespace OpenClawWalletServer.Infrastructure.EntityConfigurations;

/// <summary>
/// 白名单项数据库配置
/// </summary>
public class WhitelistItemTypeConfiguration : IEntityTypeConfiguration<WhitelistItem>
{
    public void Configure(EntityTypeBuilder<WhitelistItem> builder)
    {
        builder.ToTable("WhitelistItem");

        builder.HasKey(sr => sr.Id);

        builder.Property(sr => sr.Id)
            .UseGuidVersion7ValueGenerator();

        builder.Property(sr => sr.Address)
            .IsRequired();

        builder.Property(sr => sr.SingleTransactionMaxLimit)
            .IsRequired();

        builder.Property(sr => sr.Deleted)
            .IsRequired();
    }
}
