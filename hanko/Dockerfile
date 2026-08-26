FROM ghcr.io/teamhanko/hanko:v3.0.5 AS hanko-bin

FROM alpine:3.22

ARG CONFIG_TEMPLATE=config.staging.template.yaml

RUN apk add --no-cache gettext ca-certificates

COPY --from=hanko-bin /hanko /usr/local/bin/hanko
COPY ${CONFIG_TEMPLATE} /etc/hanko/config.template.yaml
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

ENTRYPOINT ["/docker-entrypoint.sh"]
