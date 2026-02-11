using OpenClawWalletServer.Domain.AggregatesModel.KeyConfigAggregate;
using OpenClawWalletServer.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using NetCorePal.Extensions.Repository.EntityFrameworkCore;

namespace OpenClawWalletServer.Infrastructure.EntityConfigurations;

public class KeyConfigTypeConfiguration : IEntityTypeConfiguration<KeyConfig>
{
    public void Configure(EntityTypeBuilder<KeyConfig> builder)
    {
        builder.ToTable("KeyConfig");

        builder.HasKey(kc => kc.Id);

        builder.Property(kc => kc.Id)
            .UseGuidVersion7ValueGenerator();

        builder.Property(kc => kc.SignType)
            .IsRequired()
            .HasDefaultValue(SignType.Unknown);

        builder.Property(kc => kc.Address)
            .IsRequired()
            .HasMaxLength(256)
            .HasDefaultValue(string.Empty);

        builder.Property(kc => kc.PrivateKey)
            .IsRequired()
            .HasMaxLength(512)
            .HasDefaultValue(string.Empty);

        builder.Property(kc => kc.Deleted)
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
