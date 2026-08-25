FROM ghcr.io/teamhanko/hanko:v3.0.5 AS hanko-bin

FROM alpine:3.22

RUN apk add --no-cache gettext ca-certificates

COPY --from=hanko-bin /hanko /usr/local/bin/hanko
COPY config.staging.template.yaml /etc/hanko/config.template.yaml
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

ENTRYPOINT ["/docker-entrypoint.sh"]
