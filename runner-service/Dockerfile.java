FROM openjdk:17-slim

WORKDIR /workspace

# Minimal packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

CMD ["javac"]

