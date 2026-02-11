using OpenClawWalletServer.Domain.AggregatesModel.SignRecordAggregate;
using OpenClawWalletServer.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using NetCorePal.Extensions.Repository.EntityFrameworkCore;

namespace OpenClawWalletServer.Infrastructure.EntityConfigurations;

/// <summary>
/// SignRecord配置的数据库配置
/// </summary>
public class SignRecordTypeConfiguration : IEntityTypeConfiguration<SignRecord>
{
    public void Configure(EntityTypeBuilder<SignRecord> builder)
    {
        builder.ToTable("SignRecord");

        builder.HasKey(sr => sr.Id);

        builder.Property(sr => sr.Id)
            .UseGuidVersion7ValueGenerator();

        builder.Property(sr => sr.SignType)
            .IsRequired()
            .HasDefaultValue(SignType.Unknown);

        builder.Property(sr => sr.Content)
            .IsRequired()
            .HasMaxLength(1024)
            .HasDefaultValue(string.Empty);

        builder.Property(sr => sr.SignTime)
            .IsRequired()
            .HasDefaultValue(DateTime.MinValue);
        
        builder.Property(ac => ac.Deleted)
            .IsRequired()
            .HasDefaultValue(false);
    }
}
