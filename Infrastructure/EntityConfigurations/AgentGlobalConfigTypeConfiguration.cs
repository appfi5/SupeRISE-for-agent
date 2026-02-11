using OpenClawWalletServer.Domain.AggregatesModel.AgentGlobalConfigAggregate;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using NetCorePal.Extensions.Domain;
using NetCorePal.Extensions.Repository.EntityFrameworkCore;

namespace OpenClawWalletServer.Infrastructure.EntityConfigurations;

public class GlobalConfigTypeConfiguration : IEntityTypeConfiguration<AgentGlobalConfig>
{
    public void Configure(EntityTypeBuilder<AgentGlobalConfig> builder)
    {
        builder.ToTable("AgentGlobalConfig");
        
        builder.HasKey(t => t.Id);
        
        builder.Property(t => t.Id)
            .UseGuidVersion7ValueGenerator();
        
        builder.Property(t => t.SingleTransactionMaxLimit)
            .IsRequired()
            .HasDefaultValue(0l);
        
        builder.Property(t => t.RowVersion)
            .IsRequired()
            .HasDefaultValue(new RowVersion(0));
        
        builder.Property(t => t.CreatedAt)
            .IsRequired()
            .HasDefaultValue(DateTimeOffset.MinValue);
        
        builder.Property(t => t.UpdatedAt)
            .IsRequired()
            .HasDefaultValue(DateTimeOffset.MinValue);
        
        builder.Property(t => t.Deleted)
            .IsRequired()
            .HasDefaultValue(false);

    }
}
