# =============================================================================
# Stage 1: Build
# =============================================================================
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copy NuGet config (needed for custom package sources) and project file, then restore
COPY NuGet.config .
COPY src/SupeRISELocalServer.csproj ./src/
RUN dotnet restore ./src/SupeRISELocalServer.csproj

# Copy remaining source files
COPY src/ ./src/

# Publish release build
RUN dotnet publish ./src/SupeRISELocalServer.csproj \
    --configuration Release \
    --output /app/publish \
    --no-restore

# =============================================================================
# Stage 2: Runtime
# =============================================================================
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app

# Install curl for the HEALTHCHECK and create a non-root user (Debian-based image)
RUN apt-get update \
 && apt-get install -y --no-install-recommends curl \
 && rm -rf /var/lib/apt/lists/* \
 && groupadd --gid 1001 appgroup \
 && useradd  --uid 1001 --gid appgroup --no-create-home --shell /bin/false appuser

# Copy published output from the build stage
COPY --from=build /app/publish .

# Create the data directory and set ownership
RUN mkdir -p /app/data && chown -R appuser:appgroup /app

# Run as non-root
USER appuser

# Expose the server port
EXPOSE 18799

# Health check (requires the /healthz endpoint)
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD curl --fail http://localhost:18799/healthz || exit 1

ENTRYPOINT ["dotnet", "SupeRISELocalServer.dll"]
