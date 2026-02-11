using OpenClawWalletServer.Domain.AggregatesModel.LoginPasswordAggregate;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using NetCorePal.Extensions.Repository.EntityFrameworkCore;

namespace OpenClawWalletServer.Infrastructure.EntityConfigurations;

/// <summary>
/// Agent配置的数据库配置
/// </summary>
public class LoginPasswordTypeConfiguration : IEntityTypeConfiguration<LoginPassword>
{
    public void Configure(EntityTypeBuilder<LoginPassword> builder)
    {
        builder.ToTable("LoginPassword");

        builder.HasKey(ac => ac.Id);

        builder.Property(t => t.Id)
            .UseGuidVersion7ValueGenerator();

        builder.Property(t => t.SecretData)
            .IsRequired()
            .HasColumnType("TEXT")
            .HasDefaultValue(string.Empty);

        builder.Property(ac => ac.Deleted)
            .IsRequired()
            .HasDefaultValue(false);

        builder.Property(ac => ac.CreatedAt)
            .IsRequired()
            .HasDefaultValue(DateTime.MinValue);

        builder.Property(ac => ac.UpdateAt)
            .IsRequired()
            .HasDefaultValue(DateTime.MinValue);
    }
}
